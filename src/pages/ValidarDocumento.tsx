import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertTriangle, FileText, Shield, Copy, FileCheck, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DocumentInfo {
  id: string;
  document_type: string;
  title: string;
  status: string;
  signed_at: string | null;
  created_at: string;
  clinic_name: string;
  is_revoked: boolean | null;
  document_reference: string | null;
}

interface SignatureInfo {
  signed_by_name: string | null;
  signature_hash: string | null;
  sign_method: string | null;
  signed_at: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  receita: 'Receita',
  atestado: 'Atestado',
  evolucao: 'Evolução Clínica',
  evolution: 'Evolução Clínica',
  anamnesis: 'Anamnese',
  relatorio: 'Relatório',
  declaracao: 'Declaração',
  encaminhamento: 'Encaminhamento',
  laudo: 'Laudo',
  termo: 'Termo',
};

const METHOD_LABELS: Record<string, string> = {
  password_reauth: 'Reautenticação por senha',
  password_plus_otp_email: 'Senha + OTP e-mail',
  password_plus_otp_whatsapp: 'Senha + OTP WhatsApp',
  system_auth: 'Autenticação do sistema',
};

export default function ValidarDocumento() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentInfo | null>(null);
  const [sigInfo, setSigInfo] = useState<SignatureInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      if (!id) { setNotFound(true); setLoading(false); return; }

      // Try RPC first (for clinical_documents)
      const { data, error } = await supabase.rpc('validate_clinical_document', {
        p_code: id,
      });

      if (!error && data) {
        setDoc({
          id: data.id,
          document_type: data.document_type,
          title: data.title,
          status: data.status,
          signed_at: data.signed_at,
          created_at: data.created_at,
          clinic_name: data.clinic_name || 'Clínica',
          is_revoked: data.is_revoked,
          document_reference: data.document_reference,
        });
        setLoading(false);
        return;
      }

      // Try verification_token lookup in medical_record_signatures
      const { data: sigData, error: sigError } = await supabase
        .from('medical_record_signatures')
        .select('id, record_id, record_type, signature_hash, signed_at, signed_by_name, sign_method, is_revoked, clinic_id')
        .eq('verification_token', id)
        .maybeSingle();

      if (sigError || !sigData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Get clinic name
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', sigData.clinic_id)
        .maybeSingle();

      setDoc({
        id: sigData.record_id,
        document_type: sigData.record_type,
        title: sigData.record_type === 'anamnesis' ? 'Anamnese' : 'Evolução Clínica',
        status: sigData.is_revoked ? 'revogado' : 'assinado',
        signed_at: sigData.signed_at,
        created_at: sigData.signed_at,
        clinic_name: clinicData?.name || 'Clínica',
        is_revoked: sigData.is_revoked,
        document_reference: id,
      });

      setSigInfo({
        signed_by_name: (sigData as any).signed_by_name || null,
        signature_hash: sigData.signature_hash || null,
        sign_method: (sigData as any).sign_method || null,
        signed_at: sigData.signed_at,
      });

      // Log public validation view
      try {
        await supabase.from('medical_signature_events').insert({
          signature_id: sigData.id,
          clinic_id: sigData.clinic_id,
          event_type: 'public_validation_viewed',
          metadata: { ip: 'public', timestamp: new Date().toISOString() },
        });
      } catch { /* public page, ignore errors */ }

      setLoading(false);
    }
    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center border">
          <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Documento não encontrado</h1>
          <p className="text-muted-foreground text-sm">
            O código de validação informado não corresponde a nenhum documento em nosso sistema. Verifique o código e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const isRevoked = doc?.is_revoked === true;
  const isValid = doc && doc.status === 'assinado' && !isRevoked;
  const isCancelled = doc?.status === 'cancelado' || doc?.status === 'revogado' || isRevoked;
  const isDiscarded = doc?.status === 'discarded';
  const dateFormatted = doc?.signed_at
    ? format(new Date(doc.signed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : doc?.created_at
    ? format(new Date(doc.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg overflow-hidden border">
        {/* Header */}
        <div className={`p-6 text-center text-white ${
          isValid ? 'bg-emerald-500' : (isCancelled || isDiscarded) ? 'bg-red-500' : 'bg-amber-500'
        }`}>
          {isValid ? (
            <CheckCircle className="mx-auto h-16 w-16 mb-3" />
          ) : (isCancelled || isDiscarded) ? (
            <XCircle className="mx-auto h-16 w-16 mb-3" />
          ) : (
            <AlertTriangle className="mx-auto h-16 w-16 mb-3" />
          )}
          <h1 className="text-xl font-bold">
            {isValid ? 'Documento Válido' 
              : isDiscarded ? 'Documento Descartado'
              : isCancelled ? 'Documento Cancelado/Revogado' 
              : 'Rascunho (Não Assinado)'}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            {isValid
              ? 'Este documento foi assinado com Assinatura Avançada YesClin.'
              : isDiscarded
              ? 'Este documento foi descartado e não possui validade.'
              : isCancelled
              ? 'Este documento foi cancelado ou revogado.'
              : 'Este documento ainda não foi assinado digitalmente.'}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tipo de Documento</p>
              <p className="font-medium text-foreground">{TYPE_LABELS[doc!.document_type] || doc!.document_type}</p>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Título</p>
            <p className="font-medium text-foreground">{doc!.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Clínica</p>
              <p className="font-medium text-foreground text-sm">{doc!.clinic_name}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="font-medium text-foreground text-sm">{dateFormatted}</p>
            </div>
          </div>

          {/* Signer info */}
          {sigInfo?.signed_by_name && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Signatário</p>
                <p className="font-medium text-foreground text-sm">{sigInfo.signed_by_name}</p>
              </div>
            </div>
          )}

          {/* Signature hash */}
          {sigInfo?.signature_hash && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                Hash SHA-256
              </p>
              <p className="font-mono text-xs text-foreground mt-1 break-all">
                {sigInfo.signature_hash}
              </p>
            </div>
          )}

          {/* Sign method */}
          {sigInfo?.sign_method && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Método de Autenticação</p>
              <p className="font-medium text-foreground text-sm">
                {METHOD_LABELS[sigInfo.sign_method] || sigInfo.sign_method}
              </p>
            </div>
          )}

          {doc!.document_reference && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Referência</p>
              <p className="font-mono font-medium text-foreground text-sm break-all">{doc!.document_reference}</p>
            </div>
          )}

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {isValid ? 'Assinatura Avançada Verificada' : 'Verificação Digital'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isValid
                ? 'Este documento possui assinatura eletrônica avançada YesClin com hash de integridade e reautenticação do signatário.'
                : 'Este documento foi verificado através do sistema YesClin.'}
            </p>
          </div>

          <div className="pt-2 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Validação digital • Assinatura Avançada YesClin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
