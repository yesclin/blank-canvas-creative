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

function mapModelosPessoais(rows: Array<Record<string, any>> | null): ModeloReceitaProfissional[] {
  return (rows || []).map(m => ({
    id: m.id,
    professional_id: m.professional_id || '',
    nome_modelo: m.nome,
    conteudo_json: (m.itens || { medicamentos: [] }) as ConteudoReceituario,
    created_at: m.created_at,
  }));
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
        .select('id, user_id, registration_number')
        .eq('clinic_id', clinic.id)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (prof) {
        setCurrentProfessionalId(prof.id);
        setCurrentProfessionalRegistration(prof.registration_number || null);

        // Assinatura salva vive em professional_signatures (não em professionals)
        const { data: signature } = await supabase
          .from('professional_signatures')
          .select('signature_file_url')
          .eq('clinic_id', clinic.id)
          .eq('professional_id', prof.id)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setCurrentProfessionalSignatureUrl(signature?.signature_file_url || null);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', prof.user_id!)
          .maybeSingle();
        setCurrentProfessionalName(profile?.full_name || null);

        // Fetch personal templates
        const { data: modelos } = await supabase
          .from('modelos_receita_profissional')
          .select('id, professional_id, nome, itens, created_at')
          .eq('professional_id', prof.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        setModelosPessoais(mapModelosPessoais(modelos));
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
        .select('id, clinic_id, tipo, nome, cabecalho_personalizado, texto_padrao, rodape, is_active, is_default')
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      setModelosDocumento((data || []).map(m => ({ ...m, specialty_id: null })) as ModeloDocumento[]);
    }
    fetchModelos();
  }, [clinic?.id]);

  // Build medication autocomplete from patient + professional history
  useEffect(() => {
    async function fetchSuggestions() {
      if (!patientId || !clinic?.id) return;
      const { data } = await supabase
        .from('documentos_clinicos')
        .select('conteudo')
        .eq('clinic_id', clinic.id)
        .eq('tipo', 'receituario')
        .order('created_at', { ascending: false })
        .limit(50);

      const meds = new Set<string>();
      (data || []).forEach(d => {
        const c = (typeof d.conteudo === 'string' ? JSON.parse(d.conteudo) : d.conteudo) as any;
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
        .select('id, clinic_id, patient_id, professional_id, tipo, titulo, conteudo, status, created_at, updated_at')
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
            profInfo[p.id] = { nome: userMap[p.user_id], registro: p.registration_number || undefined };
          }
        });
      }

      setDocumentos((data || []).map(d => {
        const raw = (typeof d.conteudo === 'string' ? JSON.parse(d.conteudo) : d.conteudo) || {};
        const meta = (raw._meta || {}) as Record<string, any>;
        const { _meta, ...conteudo } = raw as Record<string, any>;
        return {
          id: d.id,
          clinic_id: d.clinic_id,
          patient_id: d.patient_id,
          professional_id: d.professional_id || '',
          specialty_id: meta.specialty_id ?? null,
          tipo: d.tipo as TipoDocumentoClinico,
          conteudo_json: conteudo as ConteudoDocumento,
          status: (d.status || 'rascunho') as StatusDocumentoClinico,
          pdf_url: meta.pdf_url ?? null,
          created_at: d.created_at,
          updated_at: d.updated_at,
          tipo_receita: (meta.tipo_receita || 'simples') as TipoReceita,
          numero_talonario: meta.numero_talonario || undefined,
          modelo_id: meta.modelo_id || undefined,
          bloqueado: meta.bloqueado ?? d.status === 'emitido',
          qr_hash: meta.qr_hash || undefined,
          profissional_nome: d.professional_id ? profInfo[d.professional_id]?.nome : undefined,
          profissional_registro: d.professional_id ? profInfo[d.professional_id]?.registro : undefined,
        };
      }));
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
      if (!clinic?.id) return;
      await supabase.from('documentos_log').insert({
        clinic_id: clinic.id,
        document_id: documentoId,
        document_type: 'documento_clinico',
        action: acao,
        user_id: userData.user.id,
        details: { user_agent: navigator.userAgent },
      });
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
      // Schema atual: conteúdo e metadados vivem no jsonb `conteudo`
      const insertPayload = {
        clinic_id: clinic.id,
        patient_id: patientId,
        professional_id: currentProfessionalId,
        tipo,
        titulo: TIPO_DOC_LABELS[tipo],
        status,
        conteudo: {
          ...(conteudo as Record<string, unknown>),
          _meta: {
            specialty_id: specialtyId || null,
            bloqueado: status === 'emitido',
            qr_hash: qrHash,
            tipo_receita: options?.tipo_receita || 'simples',
            numero_talonario: options?.numero_talonario || null,
            modelo_id: options?.modelo_id || null,
            assinatura_url: currentProfessionalSignatureUrl || null,
          },
        } as any,
      };

      const { data, error } = await supabase
        .from('documentos_clinicos')
        .insert(insertPayload)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Documento não retornado');

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
        .update({ status: 'cancelado' })
        .eq('id', id);

      await supabase.from('documentos_log').insert({
        clinic_id: clinic?.id as string,
        document_id: id,
        document_type: 'documento_clinico',
        action: 'cancelado',
        user_id: userData?.user?.id || null,
        details: { motivo_cancelamento: motivo },
      });

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
  }, [clinic?.id, fetchDocumentos]);

  const saveModeloPessoal = useCallback(async (nome: string, conteudo: ConteudoReceituario): Promise<boolean> => {
    if (!currentProfessionalId) return false;
    try {
      if (!clinic?.id) return false;
      const { error } = await supabase.from('modelos_receita_profissional').insert({
        clinic_id: clinic.id,
        professional_id: currentProfessionalId,
        nome: nome,
        itens: conteudo as any,
      });
      if (error) throw error;
      const { data: modelos } = await supabase
        .from('modelos_receita_profissional')
        .select('id, professional_id, nome, itens, created_at')
        .eq('professional_id', currentProfessionalId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setModelosPessoais(mapModelosPessoais(modelos));
      toast.success('Modelo pessoal salvo');
      return true;
    } catch (err: any) {
      toast.error(`Erro ao salvar modelo: ${err.message}`);
      return false;
    }
  }, [clinic?.id, currentProfessionalId]);

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
