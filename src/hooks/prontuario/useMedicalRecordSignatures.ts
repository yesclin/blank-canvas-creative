import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Maps to the real `medical_record_signatures` table.
 * Columns: id, clinic_id, record_id, record_type, signed_by, signature_hash, ip_address, user_agent, signed_at
 */
export interface MedicalRecordSignature {
  id: string;
  clinic_id: string;
  record_id: string;
  record_type: string; // 'evolution' | 'anamnesis'
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
      // medical_record_signatures doesn't have patient_id — fetch all for clinic
      // and filter client-side if needed, or fetch by known record_ids
      const { data, error } = await supabase
        .from('medical_record_signatures')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      setSignatures((data as MedicalRecordSignature[]) || []);
    } catch (err) {
      console.error('Error fetching signatures:', err);
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
    if (!clinic?.id) return false;
    setSigning(true);
    try {
      const existing = signatures.find(s => s.record_id === input.record_id);
      if (existing) {
        toast.error('Este registro já foi assinado');
        return false;
      }

      const documentHash = await generateDocumentHash(input.content);
      const userAgent = navigator.userAgent;
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch {
        // Fallback
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast.error('Usuário não autenticado');
        return false;
      }

      // Insert signature record
      const { error: sigError } = await supabase
        .from('medical_record_signatures')
        .insert({
          clinic_id: clinic.id,
          record_id: input.record_id,
          record_type: input.record_type,
          signed_by: userId,
          signature_hash: documentHash,
          ip_address: ipAddress,
          user_agent: userAgent,
        });

      if (sigError) throw sigError;

      // Update the source record status to 'assinado'
      const table = input.record_type === 'anamnesis' ? 'anamnesis_records' : 'clinical_evolutions';
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'assinado' })
        .eq('id', input.record_id);

      if (updateError) throw updateError;

      // Log the signature action
      await supabase.from('access_logs').insert({
        clinic_id: clinic.id,
        user_id: userId,
        action: 'sign_medical_record',
        resource_type: 'medical_record',
        resource_id: input.record_id,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      toast.success('Registro assinado digitalmente com sucesso');
      return true;
    } catch (err) {
      console.error('Error signing record:', err);
      toast.error('Erro ao assinar registro');
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
