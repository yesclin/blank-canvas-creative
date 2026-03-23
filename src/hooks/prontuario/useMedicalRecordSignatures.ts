import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface MedicalRecordSignature {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  medical_record_id: string;
  signed_name: string;
  signed_document: string | null;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  document_hash: string;
  signature_type: string;
  status: string;
  created_at: string;
}

interface SignatureInput {
  patient_id: string;
  professional_id: string;
  medical_record_id: string;
  signed_name: string;
  signed_document?: string;
  content: Record<string, unknown>;
}

// Generate a simple hash for the document content
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

  const fetchSignaturesForPatient = useCallback(async (patientId: string) => {
    if (!clinic?.id || !patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_signatures')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
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
    return signatures.find(s => s.medical_record_id === recordId) || null;
  }, [signatures]);

  const isRecordSigned = useCallback((recordId: string): boolean => {
    return signatures.some(s => s.medical_record_id === recordId && s.status === 'valid');
  }, [signatures]);

  const signRecord = async (input: SignatureInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSigning(true);

    try {
      // Check if already signed
      const existing = signatures.find(s => s.medical_record_id === input.medical_record_id);
      if (existing) {
        toast.error('Este registro já foi assinado');
        return false;
      }

      // Generate document hash
      const documentHash = await generateDocumentHash(input.content);

      // Get IP and user agent
      const userAgent = navigator.userAgent;
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch {
        // Fallback if IP fetch fails
      }

      // Create signature record
      const { error: sigError } = await supabase
        .from('medical_record_signatures')
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          professional_id: input.professional_id,
          medical_record_id: input.medical_record_id,
          signed_name: input.signed_name,
          signed_document: input.signed_document || null,
          document_hash: documentHash,
          signature_type: 'advanced_electronic',
          status: 'valid',
          ip_address: ipAddress,
          user_agent: userAgent,
        });

      if (sigError) throw sigError;

      // Update the medical record entry status to 'signed'
      const { error: updateError } = await supabase
        .from('medical_record_entries')
        .update({ 
          status: 'signed',
          signed_at: new Date().toISOString(),
        })
        .eq('id', input.medical_record_id);

      if (updateError) throw updateError;

      // Log the signature action
      await supabase.from('access_logs').insert({
        clinic_id: clinic.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'sign_medical_record',
        resource: `medical_record:${input.medical_record_id}`,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      toast.success('Registro assinado digitalmente com sucesso');
      await fetchSignaturesForPatient(input.patient_id);
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
