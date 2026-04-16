/**
 * useUnifiedDocumentSigning
 * 
 * Central hook for signing any document in YesClin.
 * Replaces per-module useAdvancedSignature calls with a single entry point.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfessionalSignature } from '@/hooks/useProfessionalSignature';
import { useClinicSignatureSettings } from '@/hooks/prontuario/useClinicSignatureSettings';
import { toast } from 'sonner';
import type {
  SignableDocumentContext,
  DocumentSignatureResult,
} from '@/types/documentSigning';

async function generateDocumentHash(content: Record<string, unknown>): Promise<string> {
  const jsonString = JSON.stringify(content, Object.keys(content).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateVerificationToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Resolve the DB table from document_type, with optional override */
function resolveTargetTable(ctx: SignableDocumentContext): string | null {
  if (ctx.target_table) return ctx.target_table;
  switch (ctx.document_type) {
    case 'anamnesis': return 'anamnesis_records';
    case 'evolution': return 'clinical_evolutions';
    case 'consolidated_document': return 'consolidated_documents';
    default: return null;
  }
}

export function useUnifiedDocumentSigning() {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const { signature: savedSignature, getSignedUrl } = useProfessionalSignature();
  const { settings } = useClinicSignatureSettings();

  const [signing, setSigning] = useState(false);

  /**
   * Execute the full signing flow for any document.
   * Called from UnifiedSignatureWizard after all wizard steps are completed.
   */
  const signDocument = useCallback(async (
    ctx: SignableDocumentContext,
    evidence: {
      useSavedSignature: boolean;
      selfieDataUrl?: string | null;
      handwrittenDataUrl?: string | null;
    }
  ): Promise<DocumentSignatureResult> => {
    if (!clinic?.id || !professionalId) {
      toast.error('Dados de sessão incompletos');
      return { success: false };
    }

    setSigning(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast.error('Usuário não autenticado');
        return { success: false };
      }

      // Check existing signature
      const { data: existingSig } = await supabase
        .from('medical_record_signatures')
        .select('id')
        .eq('record_id', ctx.record_id)
        .eq('is_revoked', false)
        .maybeSingle();

      if (existingSig) {
        toast.error('Este documento já foi assinado');
        return { success: false };
      }

      const documentHash = await generateDocumentHash(ctx.content);
      const verificationToken = generateVerificationToken();
      const userAgent = navigator.userAgent;

      let ipAddress = 'unknown';
      try {
        const r = await fetch('https://api.ipify.org?format=json');
        ipAddress = (await r.json()).ip;
      } catch {}

      // Insert signature record
      const { data: sigData, error: sigError } = await supabase
        .from('medical_record_signatures')
        .insert({
          clinic_id: clinic.id,
          patient_id: ctx.patient_id,
          record_id: ctx.record_id,
          record_type: ctx.document_type,
          signature_hash: documentHash,
          document_snapshot_json: ctx.content as any,
          signed_by: userId,
          signed_by_professional_id: professionalId,
          signed_by_name: ctx.professional_name,
          sign_method: evidence.useSavedSignature ? 'saved_signature' : 'password_reauth',
          signature_level: settings.signature_level,
          ip_address: ipAddress,
          user_agent: userAgent,
          verification_token: verificationToken,
          auth_method: 'password',
          evidence_snapshot: {
            has_selfie: !!evidence.selfieDataUrl,
            has_handwritten: !!evidence.handwrittenDataUrl,
            has_saved_signature: evidence.useSavedSignature,
            saved_signature_id: evidence.useSavedSignature ? savedSignature?.id : null,
            signature_level: settings.signature_level,
            source_module: ctx.source_module,
            specialty_slug: ctx.specialty_slug,
          } as any,
        })
        .select('id')
        .single();

      if (sigError) throw sigError;

      const sigId = sigData.id;

      // Upload evidence files
      if (evidence.selfieDataUrl) {
        const blob = await (await fetch(evidence.selfieDataUrl)).blob();
        const path = `${userId}/${sigId}/selfie.jpg`;
        await supabase.storage.from('signature-evidence').upload(path, blob, { contentType: 'image/jpeg' });
        await supabase.from('signature_evidence').insert({
          signature_id: sigId, clinic_id: clinic.id, evidence_type: 'selfie', file_path: path,
        });
        await supabase.from('medical_record_signatures').update({ selfie_path: path }).eq('id', sigId);
      }

      if (evidence.handwrittenDataUrl) {
        const blob = await (await fetch(evidence.handwrittenDataUrl)).blob();
        const path = `${userId}/${sigId}/handwritten.png`;
        await supabase.storage.from('signature-evidence').upload(path, blob, { contentType: 'image/png' });
        await supabase.from('signature_evidence').insert({
          signature_id: sigId, clinic_id: clinic.id, evidence_type: 'handwritten_signature', file_path: path,
        });
        await supabase.from('medical_record_signatures').update({ handwritten_path: path }).eq('id', sigId);
      }

      // Update source record status
      const table = resolveTargetTable(ctx);
      const now = new Date().toISOString();
      if (table) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ status: 'assinado', signed_at: now, signed_by: userId })
          .eq('id', ctx.record_id);
        if (updateError) {
          if (updateError.code === '42501') throw new Error('Permissão negada: você não é o responsável por este registro.');
          console.error(`[UNIFIED_SIGN] Update ${table} error:`, updateError);
        }
      }

      // Log events
      await supabase.from('medical_signature_events').insert({
        signature_id: sigId, clinic_id: clinic.id, event_type: 'document_signed',
        metadata: {
          hash: documentHash,
          sign_method: evidence.useSavedSignature ? 'saved_signature' : 'manual_canvas',
          level: settings.signature_level,
          source_module: ctx.source_module,
          document_type: ctx.document_type,
          specialty_slug: ctx.specialty_slug,
        } as any,
        created_by: userId,
      });

      await supabase.from('access_logs').insert({
        clinic_id: clinic.id, user_id: userId,
        action: 'unified_sign_document',
        resource_type: ctx.document_type,
        resource_id: ctx.record_id,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      toast.success('Documento assinado com assinatura avançada YesClin');

      return {
        success: true,
        signature_id: sigId,
        verification_token: verificationToken,
        document_hash: documentHash,
        signed_at: now,
      };
    } catch (err: any) {
      console.error('[UNIFIED_SIGN] Error:', err);
      toast.error(err?.message || 'Erro ao assinar documento');
      return { success: false };
    } finally {
      setSigning(false);
    }
  }, [clinic?.id, professionalId, savedSignature, settings.signature_level]);

  /** Re-authenticate user with password */
  const reAuthenticate = useCallback(async (password: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) { toast.error('E-mail não encontrado'); return false; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error('Senha incorreta. Tente novamente.'); return false; }
      return true;
    } catch {
      toast.error('Erro na autenticação');
      return false;
    }
  }, []);

  return {
    signing,
    signDocument,
    reAuthenticate,
    savedSignature,
    getSignedUrl,
    settings,
  };
}
