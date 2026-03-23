import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertTriangle, FileText, ArrowRight, Link2 } from 'lucide-react';

interface DocumentInfo {
  id: string;
  document_type: string;
  document_reference: string;
  patient_name: string | null;
  professional_name: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  replaced_by_document_id: string | null;
  replaced_by_reference: string | null;
  replaces_document_id: string | null;
  replaces_reference: string | null;
  created_at: string;
  clinic_id: string;
  clinic_name?: string;
}

const TYPE_LABELS: Record<string, string> = {
  anamnese: 'Anamnese',
  receita: 'Receita',
  atestado: 'Atestado',
  evolucao: 'Evolução Clínica',
  relatorio: 'Relatório',
};

export default function ValidarDocumento() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      if (!id) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from('clinical_documents')
        .select('id, document_type, document_reference, patient_name, professional_name, is_revoked, revoked_at, created_at, clinic_id, revoked_reason, replaced_by_document_id, replaces_document_id' as any)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const raw = data as any;

      // Resolve linked document references
      const linkedIds: string[] = [];
      if (raw.replaced_by_document_id) linkedIds.push(raw.replaced_by_document_id);
      if (raw.replaces_document_id) linkedIds.push(raw.replaces_document_id);

      let refMap: Record<string, string> = {};
      if (linkedIds.length > 0) {
        const { data: linked } = await supabase
          .from('clinical_documents')
          .select('id, document_reference')
          .in('id', linkedIds);
        if (linked) {
          linked.forEach((l) => { refMap[l.id] = l.document_reference; });
        }
      }

      // Get clinic name
      const { data: clinic } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', raw.clinic_id)
        .maybeSingle();

      setDoc({
        id: raw.id,
        document_type: raw.document_type,
        document_reference: raw.document_reference,
        patient_name: raw.patient_name,
        professional_name: raw.professional_name,
        is_revoked: raw.is_revoked,
        revoked_at: raw.revoked_at,
        revoked_reason: raw.revoked_reason || null,
        replaced_by_document_id: raw.replaced_by_document_id || null,
        replaced_by_reference: raw.replaced_by_document_id ? refMap[raw.replaced_by_document_id] || null : null,
        replaces_document_id: raw.replaces_document_id || null,
        replaces_reference: raw.replaces_document_id ? refMap[raw.replaces_document_id] || null : null,
        created_at: raw.created_at,
        clinic_id: raw.clinic_id,
        clinic_name: clinic?.name || 'Clínica',
      });
      setLoading(false);
    }
    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Documento não encontrado</h1>
          <p className="text-gray-500 text-sm">
            O documento solicitado não existe em nosso sistema. Verifique o código e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const isValid = doc && !doc.is_revoked;
  const dateFormatted = doc ? format(new Date(doc.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${isValid ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
          {isValid ? (
            <CheckCircle className="mx-auto h-16 w-16 mb-3" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 mb-3" />
          )}
          <h1 className="text-xl font-bold">
            {isValid ? 'Documento Válido' : 'Documento Revogado'}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            {isValid
              ? 'Este documento foi emitido e validado digitalmente.'
              : 'Este documento foi revogado e não possui mais validade.'}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Tipo de Documento</p>
              <p className="font-medium text-gray-900">{TYPE_LABELS[doc!.document_type] || doc!.document_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Número</p>
              <p className="font-mono font-medium text-gray-900 text-sm">{doc!.document_reference}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Data de Emissão</p>
              <p className="font-medium text-gray-900 text-sm">{dateFormatted}</p>
            </div>
          </div>

          {doc!.clinic_name && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Clínica</p>
              <p className="font-medium text-gray-900">{doc!.clinic_name}</p>
            </div>
          )}

          {doc!.patient_name && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Paciente</p>
              <p className="font-medium text-gray-900">{doc!.patient_name}</p>
            </div>
          )}

          {doc!.professional_name && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Profissional Responsável</p>
              <p className="font-medium text-gray-900">{doc!.professional_name}</p>
            </div>
          )}

          {/* Replacement chain - valid doc that replaces another */}
          {!doc!.is_revoked && doc!.replaces_reference && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-1">
                <Link2 className="h-4 w-4" />
                Este documento substitui: <strong>{doc!.replaces_reference}</strong>
              </p>
              {doc!.replaces_document_id && (
                <Link
                  to={`/validar/${doc!.replaces_document_id}`}
                  className="text-xs text-blue-600 underline mt-1 inline-block"
                >
                  Ver documento original
                </Link>
              )}
            </div>
          )}

          {/* Revoked doc info */}
          {doc!.is_revoked && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-1">
                <XCircle className="h-4 w-4" /> DOCUMENTO REVOGADO
              </p>
              {doc!.revoked_at && (
                <p className="text-xs text-red-600">
                  Data da revogação: {format(new Date(doc!.revoked_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              {doc!.revoked_reason && (
                <p className="text-xs text-red-600">
                  Motivo: {doc!.revoked_reason}
                </p>
              )}

              {/* Link to replacement document */}
              {doc!.replaced_by_reference && (
                <div className="pt-2 border-t border-red-200">
                  <p className="text-sm text-amber-700 flex items-center gap-1">
                    <ArrowRight className="h-4 w-4" />
                    Substituído por: <strong>{doc!.replaced_by_reference}</strong>
                  </p>
                  {doc!.replaced_by_document_id && (
                    <Link
                      to={`/validar/${doc!.replaced_by_document_id}`}
                      className="text-xs text-blue-600 underline mt-1 inline-block"
                    >
                      Validar documento substituto
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t text-center">
            <p className="text-xs text-gray-400">
              Validação digital • YesClin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
