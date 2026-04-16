import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, Lock, Clock, FileCheck, User, ExternalLink, History } from 'lucide-react';
import type { MedicalRecordSignature } from '@/hooks/prontuario/useMedicalRecordSignatures';
import { SignatureAuditTrail } from './SignatureAuditTrail';
import { supabase } from '@/integrations/supabase/client';

interface SignedRecordBadgeProps {
  signature: MedicalRecordSignature | null;
  compact?: boolean;
  clinicId?: string;
}

export function SignedRecordBadge({ signature, compact = false, clinicId }: SignedRecordBadgeProps) {
  const [auditOpen, setAuditOpen] = useState(false);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);

  // Load saved professional signature image if available
  const evidenceSnapshot = (signature as any)?.evidence_snapshot;
  const signedByProfId = (signature as any)?.signed_by_professional_id;

  useEffect(() => {
    if (!signedByProfId || !signature) return;
    // Check if this was signed with saved signature
    if (evidenceSnapshot?.has_saved_signature) {
      // Fetch the professional's saved signature file
      supabase
        .from('professional_signatures')
        .select('signature_file_url')
        .eq('professional_id', signedByProfId)
        .eq('is_active', true)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.signature_file_url) {
            supabase.storage
              .from('professional-signatures')
              .createSignedUrl(data.signature_file_url, 3600)
              .then(({ data: urlData }) => {
                if (urlData?.signedUrl) setSignatureImageUrl(urlData.signedUrl);
              });
          }
        });
    }
  }, [signedByProfId, evidenceSnapshot, signature]);

  if (!signature) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get extended fields if available
  const signerName = (signature as any).signed_by_name;
  const verificationToken = (signature as any).verification_token;
  const signMethod = (signature as any).sign_method;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="bg-green-50 text-green-700 border-green-300 gap-1"
            >
              <Shield className="h-3 w-3" />
              Assinado
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Assinatura Avançada YesClin</p>
              {signerName && <p>Por: {signerName}</p>}
              <p>Em: {formatDate(signature.signed_at)}</p>
              {signMethod && <p>Método: {signMethod === 'password_reauth' ? 'Senha' : signMethod}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-700">Assinatura Avançada YesClin</span>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            <Lock className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        </div>

        {signerName && (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <User className="h-4 w-4" />
            <span>{signerName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-green-700">
          <Clock className="h-4 w-4" />
          <span>{formatDate(signature.signed_at)}</span>
        </div>

        {signatureImageUrl && (
          <div className="bg-white rounded border border-green-200 p-3 flex items-center justify-center">
            <img src={signatureImageUrl} alt="Assinatura" className="max-h-[60px] max-w-full object-contain" crossOrigin="anonymous" />
          </div>
        )}

        {signature.signature_hash && (
          <div className="flex items-center gap-2 text-xs text-green-600 font-mono bg-green-100 rounded px-2 py-1">
            <FileCheck className="h-3 w-3 flex-shrink-0" />
            <span>SHA-256: {signature.signature_hash.substring(0, 24)}...</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {verificationToken && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => {
                const url = `${window.location.origin}/validar/${verificationToken}`;
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Validar Autenticidade
            </Button>
          )}

          {clinicId && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => setAuditOpen(true)}
            >
              <History className="h-3 w-3 mr-1" />
              Trilha
            </Button>
          )}
        </div>
      </div>

      {clinicId && (
        <SignatureAuditTrail
          open={auditOpen}
          onOpenChange={setAuditOpen}
          signatureId={signature.id}
          clinicId={clinicId}
        />
      )}
    </>
  );
}
