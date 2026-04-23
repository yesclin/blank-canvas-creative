import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

/**
 * useMedicalRecordSignatures
 *
 * Read-only helpers over the `medical_record_signatures` table.
 *
 * NOTE: Signing is centralized in `useUnifiedDocumentSigning` +
 * `UnifiedSignatureWizard` — this hook intentionally exposes only the
 * lookup helpers used by the Prontuário UI to render badges/state.
 *
 * Columns: id, clinic_id, record_id, record_type, signed_by, signature_hash,
 * ip_address, user_agent, signed_at
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

export function useMedicalRecordSignatures() {
  const { clinic } = useClinicData();
  const [signatures, setSignatures] = useState<MedicalRecordSignature[]>([]);
  const [loading, setLoading] = useState(false);

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

  return {
    signatures,
    loading,
    fetchSignaturesForPatient,
    getSignatureForRecord,
    isRecordSigned,
  };
}
