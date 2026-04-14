/**
 * useAdvancedSignature
 * 
 * Advanced electronic signature flow for YesClin:
 * - Password re-authentication
 * - SHA-256 document hash
 * - Content snapshot
 * - Audit event trail
 * - Post-signature immutability
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

export type SignMethod = 'password_reauth' | 'password_plus_otp_email' | 'password_plus_otp_whatsapp';

export type SignatureEventType =
  | 'signature_requested'
  | 'reauth_passed'
  | 'reauth_failed'
  | 'document_hashed'
  | 'document_signed'
  | 'pdf_generated'
  | 'public_validation_viewed'
  | 'signature_revoked';

export interface AdvancedSignatureInput {
  record_id: string;
  record_type: 'evolution' | 'anamnesis';
  patient_id: string;
  content: Record<string, unknown>;
  professional_name: string;
}

interface SignatureResult {
  success: boolean;
  signatureId?: string;
  verificationToken?: string;
  documentHash?: string;
}

async function generateDocumentHash(content: Record<string, unknown>): Promise<string> {
  // Sort keys for deterministic serialization
  const jsonString = JSON.stringify(content, Object.keys(content).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateVerificationToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAdvancedSignature() {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const [signing, setSigning] = useState(false);
  const [reAuthenticating, setReAuthenticating] = useState(false);

  /**
   * Step 1: Re-authenticate user with password
   */
  const reAuthenticate = useCallback(async (password: string): Promise<boolean> => {
    setReAuthenticating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) {
        toast.error('E-mail do usuário não encontrado');
        return false;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Log failed attempt
        if (clinic?.id) {
          await logSignatureEvent(null, clinic.id, 'reauth_failed', {
            reason: 'invalid_password',
          });
        }
        toast.error('Senha incorreta. Tente novamente.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ADVANCED_SIGNATURE] Re-auth error:', err);
      toast.error('Erro na reautenticação');
      return false;
    } finally {
      setReAuthenticating(false);
    }
  }, [clinic?.id]);

  /**
   * Step 2: Execute the full signing flow
   */
  const signRecord = useCallback(async (
    input: AdvancedSignatureInput,
    password: string
  ): Promise<SignatureResult> => {
    if (!clinic?.id || !professionalId) {
      toast.error('Dados de sessão incompletos');
      return { success: false };
    }

    setSigning(true);
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast.error('Usuário não autenticado');
        return { success: false };
      }

      // Log signature requested
      await logSignatureEvent(null, clinic.id, 'signature_requested', {
        record_id: input.record_id,
        record_type: input.record_type,
      });

      // Re-authenticate
      const authOk = await reAuthenticate(password);
      if (!authOk) {
        return { success: false };
      }

      // Log re-auth passed
      await logSignatureEvent(null, clinic.id, 'reauth_passed', {
        record_id: input.record_id,
      });

      // Check for existing signature
      const { data: existingSig } = await supabase
        .from('medical_record_signatures')
        .select('id')
        .eq('record_id', input.record_id)
        .eq('is_revoked', false)
        .maybeSingle();

      if (existingSig) {
        toast.error('Este registro já foi assinado');
        return { success: false };
      }

      // Generate hash and token
      const documentHash = await generateDocumentHash(input.content);
      const verificationToken = generateVerificationToken();
      const userAgent = navigator.userAgent;

      // Get IP
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch { /* fallback */ }

      // Log hash generated
      await logSignatureEvent(null, clinic.id, 'document_hashed', {
        record_id: input.record_id,
        hash_preview: documentHash.substring(0, 16),
      });

      // Insert signature record
      const { data: sigData, error: sigError } = await supabase
        .from('medical_record_signatures')
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          record_id: input.record_id,
          record_type: input.record_type,
          signature_hash: documentHash,
          document_snapshot_json: input.content as any,
          signed_by: userId,
          signed_by_professional_id: professionalId,
          signed_by_name: input.professional_name,
          sign_method: 'password_reauth' as string,
          ip_address: ipAddress,
          user_agent: userAgent,
          verification_token: verificationToken,
        })
        .select('id')
        .single();

      if (sigError) throw sigError;

      // Update the source record status
      const table = input.record_type === 'anamnesis' ? 'anamnesis_records' : 'clinical_evolutions';
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from(table)
        .update({
          status: 'assinado',
          signed_at: now,
          signed_by: userId,
        })
        .eq('id', input.record_id);

      if (updateError) {
        console.error(`[ADVANCED_SIGNATURE] Update ${table} failed:`, updateError);
        if (updateError.code === '42501') {
          throw new Error('Permissão negada: você não é o profissional responsável por este registro.');
        }
        throw updateError;
      }

      // Log document signed
      await logSignatureEvent(sigData.id, clinic.id, 'document_signed', {
        record_id: input.record_id,
        record_type: input.record_type,
        hash: documentHash,
        sign_method: 'password_reauth',
      });

      // Log access
      await supabase.from('access_logs').insert({
        clinic_id: clinic.id,
        user_id: userId,
        action: 'advanced_sign_medical_record',
        resource_type: 'medical_record',
        resource_id: input.record_id,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      toast.success('Documento assinado com assinatura avançada YesClin');

      return {
        success: true,
        signatureId: sigData.id,
        verificationToken,
        documentHash,
      };
    } catch (err: any) {
      console.error('[ADVANCED_SIGNATURE] Error:', err);
      toast.error(err?.message || 'Erro ao assinar documento');
      return { success: false };
    } finally {
      setSigning(false);
    }
  }, [clinic?.id, professionalId, reAuthenticate]);

  /**
   * Fetch signature events for audit trail
   */
  const fetchSignatureEvents = useCallback(async (signatureId: string) => {
    if (!clinic?.id) return [];

    const { data, error } = await supabase
      .from('medical_signature_events')
      .select('*')
      .eq('signature_id', signatureId)
      .eq('clinic_id', clinic.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ADVANCED_SIGNATURE] Fetch events error:', error);
      return [];
    }
    return data || [];
  }, [clinic?.id]);

  /**
   * Fetch signature by record ID
   */
  const fetchSignatureByRecord = useCallback(async (recordId: string) => {
    if (!clinic?.id) return null;

    const { data, error } = await supabase
      .from('medical_record_signatures')
      .select('*')
      .eq('record_id', recordId)
      .eq('clinic_id', clinic.id)
      .eq('is_revoked', false)
      .maybeSingle();

    if (error) {
      console.error('[ADVANCED_SIGNATURE] Fetch signature error:', error);
      return null;
    }
    return data;
  }, [clinic?.id]);

  return {
    signing,
    reAuthenticating,
    signRecord,
    reAuthenticate,
    fetchSignatureEvents,
    fetchSignatureByRecord,
  };
}

// Helper: log an event to medical_signature_events
async function logSignatureEvent(
  signatureId: string | null,
  clinicId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    // For events before the signature is created, we need the signature_id
    // We'll use a placeholder approach - log after signature creation when possible
    if (!signatureId) {
      // Pre-signature events: store in access_logs as fallback
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('access_logs').insert({
        clinic_id: clinicId,
        user_id: userData?.user?.id || '',
        action: `signature_event_${eventType}`,
        resource_type: 'medical_signature',
        details: metadata as any,
      });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('medical_signature_events').insert({
      signature_id: signatureId,
      clinic_id: clinicId,
      event_type: eventType,
      metadata: metadata as any,
      created_by: userData?.user?.id || null,
    });
  } catch (err) {
    console.error('[SIGNATURE_EVENT] Log error:', err);
  }
}
