import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

const LOG = '[SIGNATURE]';

export interface MedicalRecordSignature {
  id: string;
  clinic_id: string;
  record_id: string;
  record_type: string;
  signed_by: string;
  signature_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
}

interface SignatureInput {
  record_id: string;
  record_type: 'evolution' | 'anamnesis';
  content: Record<string, unknown>;
}

async function generateDocumentHash(content: Record<string, unknown>): Promise<string> {
  const jsonString = JSON.stringify(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useMedicalRecordSignatures() {
  const { clinic } = useClinicData();
  const [signatures, setSignatures] = useState<MedicalRecordSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);

  const fetchSignaturesForPatient = useCallback(async (_patientId: string) => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_signatures')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      setSignatures((data as MedicalRecordSignature[]) || []);
    } catch (err) {
      console.error(`${LOG} Error fetching signatures:`, err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  const getSignatureForRecord = useCallback((recordId: string): MedicalRecordSignature | null => {
    return signatures.find(s => s.record_id === recordId) || null;
  }, [signatures]);

  const isRecordSigned = useCallback((recordId: string): boolean => {
    return signatures.some(s => s.record_id === recordId);
  }, [signatures]);

  const signRecord = async (input: SignatureInput): Promise<boolean> => {
    console.log(`${LOG} ── Início da assinatura ──`);
    console.log(`${LOG} record_id=${input.record_id}, record_type=${input.record_type}`);

    if (!clinic?.id) {
      console.error(`${LOG} clinic_id ausente`);
      toast.error('Clínica não identificada');
      return false;
    }

    setSigning(true);
    try {
      // Check if already signed
      const existing = signatures.find(s => s.record_id === input.record_id);
      if (existing) {
        console.warn(`${LOG} Registro já assinado: signature_id=${existing.id}`);
        toast.error('Este registro já foi assinado');
        return false;
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        console.error(`${LOG} Usuário não autenticado`);
        toast.error('Usuário não autenticado');
        return false;
      }
      console.log(`${LOG} user_id=${userId}`);

      // Generate hash
      console.log(`${LOG} Gerando hash SHA-256 do conteúdo...`);
      const documentHash = await generateDocumentHash(input.content);
      console.log(`${LOG} Hash gerado: ${documentHash.substring(0, 16)}...`);

      const userAgent = navigator.userAgent;
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch {
        console.warn(`${LOG} Não foi possível obter IP externo, usando fallback`);
      }

      // Step 1: Update the source record status to 'assinado' FIRST
      const table = input.record_type === 'anamnesis' ? 'anamnesis_records' : 'clinical_evolutions';
      console.log(`${LOG} Etapa 1: Atualizando ${table} status → assinado, signed_at, signed_by`);

      const { error: updateError } = await supabase
        .from(table)
        .update({
          status: 'assinado',
          signed_at: new Date().toISOString(),
          signed_by: userId,
        })
        .eq('id', input.record_id);

      if (updateError) {
        console.error(`${LOG} [DB_ERROR] Update ${table} falhou:`);
        console.error(`${LOG} Código: ${updateError.code}`);
        console.error(`${LOG} Mensagem: ${updateError.message}`);
        console.error(`${LOG} Detalhes: ${updateError.details}`);
        console.error(`${LOG} Hint: ${updateError.hint}`);
        console.error(`${LOG} Erro completo:`, JSON.stringify(updateError));

        let userMsg = 'Falha ao atualizar status do registro';
        if (updateError.code === '42501') userMsg = 'Permissão negada (RLS) — verifique se você é o profissional responsável';
        else if (updateError.message) userMsg = updateError.message;

        throw new Error(userMsg);
      }
      console.log(`${LOG} Etapa 1 OK: status atualizado para assinado`);

      // Step 2: Insert signature record
      console.log(`${LOG} Etapa 2: Inserindo em medical_record_signatures`);
      const sigPayload = {
        clinic_id: clinic.id,
        record_id: input.record_id,
        record_type: input.record_type,
        signed_by: userId,
        signature_hash: documentHash,
        ip_address: ipAddress,
        user_agent: userAgent,
      };
      console.log(`${LOG} Payload:`, JSON.stringify(sigPayload, null, 2));

      const { error: sigError } = await supabase
        .from('medical_record_signatures')
        .insert(sigPayload);

      if (sigError) {
        console.error(`${LOG} [DB_ERROR] Insert medical_record_signatures falhou:`);
        console.error(`${LOG} Código: ${sigError.code}`);
        console.error(`${LOG} Mensagem: ${sigError.message}`);
        console.error(`${LOG} Detalhes: ${sigError.details}`);
        console.error(`${LOG} Erro completo:`, JSON.stringify(sigError));
        throw new Error(sigError.message || 'Falha ao inserir assinatura');
      }
      console.log(`${LOG} Etapa 2 OK: assinatura inserida`);

      // Step 3: Audit log
      console.log(`${LOG} Etapa 3: Registrando log de acesso`);
      await supabase.from('access_logs').insert({
        clinic_id: clinic.id,
        user_id: userId,
        action: 'sign_medical_record',
        resource_type: 'medical_record',
        resource_id: input.record_id,
        ip_address: ipAddress,
        user_agent: userAgent,
      }).then(({ error }) => {
        if (error) console.warn(`${LOG} Audit log falhou (não-bloqueante):`, error.message);
      });

      // Refresh local signatures
      await fetchSignaturesForPatient('');

      console.log(`${LOG} ── Assinatura concluída com sucesso ──`);
      toast.success('Registro assinado digitalmente com sucesso');
      return true;
    } catch (err: any) {
      console.error(`${LOG} FALHA FINAL:`, err);
      toast.error(`Erro ao assinar registro: ${err?.message || 'erro desconhecido'}`);
      return false;
    } finally {
      setSigning(false);
    }
  };

  return {
    signatures,
    loading,
    signing,
    fetchSignaturesForPatient,
    getSignatureForRecord,
    isRecordSigned,
    signRecord,
  };
}
