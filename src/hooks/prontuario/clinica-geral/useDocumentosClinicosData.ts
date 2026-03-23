import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TipoDocumentoClinico = 'receituario' | 'atestado' | 'declaracao' | 'relatorio';
export type StatusDocumentoClinico = 'rascunho' | 'emitido' | 'cancelado';
export type TipoReceita = 'simples' | 'controlada' | 'especial';

export interface MedicamentoItem {
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  observacoes?: string;
}

export interface ConteudoReceituario {
  medicamentos: MedicamentoItem[];
  observacoes_gerais?: string;
}

export interface ConteudoAtestado {
  tipo_afastamento: 'dias' | 'periodo';
  dias?: number;
  data_inicio?: string;
  data_fim?: string;
  cid?: string;
  observacao?: string;
}

export interface ConteudoDeclaracao {
  texto: string;
}

export interface ConteudoRelatorio {
  titulo_relatorio: string;
  objetivo?: string;
  historico_clinico?: string;
  descricao_detalhada: string;
  conclusao?: string;
  recomendacoes?: string;
}

export type ConteudoDocumento = ConteudoReceituario | ConteudoAtestado | ConteudoDeclaracao | ConteudoRelatorio;

export interface DocumentoClinico {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  specialty_id: string | null;
  tipo: TipoDocumentoClinico;
  conteudo_json: ConteudoDocumento;
  status: StatusDocumentoClinico;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  tipo_receita?: TipoReceita;
  numero_talonario?: string;
  modelo_id?: string;
  bloqueado?: boolean;
  qr_hash?: string;
  // joined
  profissional_nome?: string;
  profissional_registro?: string;
}

export interface ModeloReceitaProfissional {
  id: string;
  professional_id: string;
  nome_modelo: string;
  conteudo_json: ConteudoReceituario;
  created_at: string;
}

export interface ModeloDocumento {
  id: string;
  clinic_id: string;
  specialty_id: string | null;
  tipo: TipoDocumentoClinico;
  nome: string;
  cabecalho_personalizado: string | null;
  texto_padrao: string | null;
  rodape: string | null;
  is_active: boolean;
  is_default: boolean;
}

export interface SaveDocumentoOptions {
  tipo_receita?: TipoReceita;
  numero_talonario?: string;
  modelo_id?: string;
  status?: StatusDocumentoClinico;
}

export const TIPO_DOC_LABELS: Record<TipoDocumentoClinico, string> = {
  receituario: 'Receituário',
  atestado: 'Atestado',
  declaracao: 'Declaração',
  relatorio: 'Relatório',
};

interface UseDocumentosClinicosDataResult {
  documentos: DocumentoClinico[];
  loading: boolean;
  saving: boolean;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  currentProfessionalRegistration: string | null;
  currentProfessionalSignatureUrl: string | null;
  modelosPessoais: ModeloReceitaProfissional[];
  modelosDocumento: ModeloDocumento[];
  medicamentoSuggestions: string[];
  saveDocumento: (tipo: TipoDocumentoClinico, conteudo: ConteudoDocumento, specialtyId?: string, options?: SaveDocumentoOptions) => Promise<string | null>;
  cancelDocumento: (id: string, motivo: string) => Promise<boolean>;
  saveModeloPessoal: (nome: string, conteudo: ConteudoReceituario) => Promise<boolean>;
  deleteModeloPessoal: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useDocumentosClinicosData(patientId: string | null): UseDocumentosClinicosDataResult {
  const { clinic } = useClinicData();
  const [documentos, setDocumentos] = useState<DocumentoClinico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string | null>(null);
  const [currentProfessionalName, setCurrentProfessionalName] = useState<string | null>(null);
  const [currentProfessionalRegistration, setCurrentProfessionalRegistration] = useState<string | null>(null);
  const [currentProfessionalSignatureUrl, setCurrentProfessionalSignatureUrl] = useState<string | null>(null);
  const [modelosPessoais, setModelosPessoais] = useState<ModeloReceitaProfissional[]>([]);
  const [modelosDocumento, setModelosDocumento] = useState<ModeloDocumento[]>([]);
  const [medicamentoSuggestions, setMedicamentoSuggestions] = useState<string[]>([]);

  // Get current professional
  useEffect(() => {
    async function fetchProfessional() {
      if (!clinic?.id) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data: prof } = await supabase
        .from('professionals')
        .select('id, user_id, registration_number, signature_url')
        .eq('clinic_id', clinic.id)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (prof) {
        setCurrentProfessionalId(prof.id);
        setCurrentProfessionalRegistration((prof as any).registration_number || null);
        setCurrentProfessionalSignatureUrl((prof as any).signature_url || null);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', prof.user_id!)
          .maybeSingle();
        setCurrentProfessionalName(profile?.full_name || null);

        // Fetch personal templates
        const { data: modelos } = await supabase
          .from('modelos_receita_profissional')
          .select('*')
          .eq('professional_id', prof.id)
          .order('created_at', { ascending: false });
        setModelosPessoais((modelos || []) as any);
      }
    }
    fetchProfessional();
  }, [clinic?.id]);

  // Fetch document templates for clinic
  useEffect(() => {
    async function fetchModelos() {
      if (!clinic?.id) return;
      const { data } = await supabase
        .from('modelos_documento')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      setModelosDocumento((data || []) as any);
    }
    fetchModelos();
  }, [clinic?.id]);

  // Build medication autocomplete from patient + professional history
  useEffect(() => {
    async function fetchSuggestions() {
      if (!patientId || !clinic?.id) return;
      const { data } = await supabase
        .from('documentos_clinicos')
        .select('conteudo_json')
        .eq('clinic_id', clinic.id)
        .eq('tipo', 'receituario')
        .order('created_at', { ascending: false })
        .limit(50);

      const meds = new Set<string>();
      (data || []).forEach(d => {
        const c = typeof d.conteudo_json === 'string' ? JSON.parse(d.conteudo_json) : d.conteudo_json;
        if (c?.medicamentos) {
          c.medicamentos.forEach((m: any) => { if (m.nome) meds.add(m.nome); });
        }
      });
      setMedicamentoSuggestions([...meds].sort());
    }
    fetchSuggestions();
  }, [patientId, clinic?.id]);

  const fetchDocumentos = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setDocumentos([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_clinicos')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch professional names + registration
      const profIds = [...new Set((data || []).map(d => d.professional_id).filter(Boolean))];
      let profInfo: Record<string, { nome: string; registro?: string }> = {};
      if (profIds.length > 0) {
        const { data: profs } = await supabase
          .from('professionals')
          .select('id, user_id, registration_number')
          .in('id', profIds);
        const userIds = (profs || []).map(p => p.user_id).filter(Boolean) as string[];
        const userMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          (profiles || []).forEach(p => { if (p.user_id && p.full_name) userMap[p.user_id] = p.full_name; });
        }
        (profs || []).forEach(p => {
          if (p.id && p.user_id && userMap[p.user_id]) {
            profInfo[p.id] = { nome: userMap[p.user_id], registro: (p as any).registration_number || undefined };
          }
        });
      }

      setDocumentos((data || []).map(d => ({
        id: d.id,
        clinic_id: d.clinic_id,
        patient_id: d.patient_id,
        professional_id: d.professional_id,
        specialty_id: d.specialty_id,
        tipo: d.tipo as TipoDocumentoClinico,
        conteudo_json: (typeof d.conteudo_json === 'string' ? JSON.parse(d.conteudo_json) : d.conteudo_json) as ConteudoDocumento,
        status: d.status as StatusDocumentoClinico,
        pdf_url: d.pdf_url,
        created_at: d.created_at,
        updated_at: d.updated_at,
        tipo_receita: (d as any).tipo_receita || 'simples',
        numero_talonario: (d as any).numero_talonario || undefined,
        modelo_id: (d as any).modelo_id || undefined,
        bloqueado: (d as any).bloqueado || false,
        qr_hash: (d as any).qr_hash || undefined,
        profissional_nome: profInfo[d.professional_id]?.nome || undefined,
        profissional_registro: profInfo[d.professional_id]?.registro || undefined,
      })));
    } catch (err) {
      console.error('Error fetching documentos clínicos:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchDocumentos().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [fetchDocumentos]);

  const logDocumentAction = async (documentoId: string, acao: 'criado' | 'emitido' | 'cancelado') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      await supabase.from('documentos_log').insert({
        documento_id: documentoId,
        acao,
        usuario_id: userData.user.id,
        user_agent: navigator.userAgent,
      } as any);
    } catch (err) {
      console.error('Log error (non-blocking):', err);
    }
  };

  const saveDocumento = useCallback(async (
    tipo: TipoDocumentoClinico,
    conteudo: ConteudoDocumento,
    specialtyId?: string,
    options?: SaveDocumentoOptions,
  ): Promise<string | null> => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do profissional não encontrados');
      return null;
    }
    setSaving(true);
    try {
      const qrHash = crypto.randomUUID();
      const status = options?.status || 'emitido';
      const insertPayload: Record<string, unknown> = {
        clinic_id: clinic.id,
        patient_id: patientId,
        professional_id: currentProfessionalId,
        specialty_id: specialtyId || null,
        tipo,
        conteudo_json: conteudo,
        status,
        bloqueado: status === 'emitido',
        qr_hash: qrHash,
        tipo_receita: options?.tipo_receita || 'simples',
        numero_talonario: options?.numero_talonario || null,
        modelo_id: options?.modelo_id || null,
        assinatura_url: currentProfessionalSignatureUrl || null,
      };

      const { data, error } = await supabase
        .from('documentos_clinicos')
        .insert(insertPayload as any)
        .select('id')
        .single();

      if (error) throw error;

      await logDocumentAction(data.id, 'criado');
      if (status === 'emitido') {
        await logDocumentAction(data.id, 'emitido');
      }

      toast.success(`${TIPO_DOC_LABELS[tipo]} ${status === 'rascunho' ? 'salvo como rascunho' : 'emitido com sucesso'}`);
      await fetchDocumentos();
      return data.id;
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, currentProfessionalSignatureUrl, fetchDocumentos]);

  const cancelDocumento = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('documentos_clinicos')
        .update({
          status: 'cancelado',
          cancelado_em: new Date().toISOString(),
          cancelado_por: userData?.user?.id || null,
          motivo_cancelamento: motivo,
        })
        .eq('id', id);

      if (error) throw error;
      await logDocumentAction(id, 'cancelado');
      toast.success('Documento cancelado');
      await fetchDocumentos();
      return true;
    } catch (err: any) {
      toast.error(`Erro ao cancelar: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchDocumentos]);

  const saveModeloPessoal = useCallback(async (nome: string, conteudo: ConteudoReceituario): Promise<boolean> => {
    if (!currentProfessionalId) return false;
    try {
      const { error } = await supabase.from('modelos_receita_profissional').insert({
        professional_id: currentProfessionalId,
        nome_modelo: nome,
        conteudo_json: conteudo as any,
      } as any);
      if (error) throw error;
      const { data: modelos } = await supabase
        .from('modelos_receita_profissional')
        .select('*')
        .eq('professional_id', currentProfessionalId)
        .order('created_at', { ascending: false });
      setModelosPessoais((modelos || []) as any);
      toast.success('Modelo pessoal salvo');
      return true;
    } catch (err: any) {
      toast.error(`Erro ao salvar modelo: ${err.message}`);
      return false;
    }
  }, [currentProfessionalId]);

  const deleteModeloPessoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('modelos_receita_profissional').delete().eq('id', id);
      if (error) throw error;
      setModelosPessoais(prev => prev.filter(m => m.id !== id));
      toast.success('Modelo removido');
      return true;
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
      return false;
    }
  }, []);

  return {
    documentos,
    loading,
    saving,
    currentProfessionalId,
    currentProfessionalName,
    currentProfessionalRegistration,
    currentProfessionalSignatureUrl,
    modelosPessoais,
    modelosDocumento,
    medicamentoSuggestions,
    saveDocumento,
    cancelDocumento,
    saveModeloPessoal,
    deleteModeloPessoal,
    refetch: fetchDocumentos,
  };
}
