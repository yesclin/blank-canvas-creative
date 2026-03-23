import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, Lock, Clock, User, FileCheck } from 'lucide-react';
import type { MedicalRecordSignature } from '@/hooks/prontuario/useMedicalRecordSignatures';

interface SignedRecordBadgeProps {
  signature: MedicalRecordSignature | null;
  compact?: boolean;
}

export function SignedRecordBadge({ signature, compact = false }: SignedRecordBadgeProps) {
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
              <p className="font-medium">Assinatura Digital Válida</p>
              <p>Por: {signature.signed_name}</p>
              <p>Em: {formatDate(signature.signed_at)}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-700">Registro Assinado Digitalmente</span>
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
          <Lock className="h-3 w-3 mr-1" />
          Bloqueado
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-green-700">
          <User className="h-4 w-4" />
          <span>{signature.signed_name}</span>
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <Clock className="h-4 w-4" />
          <span>{formatDate(signature.signed_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-green-600 font-mono bg-green-100 rounded px-2 py-1">
        <FileCheck className="h-3 w-3" />
        <span>Hash: {signature.document_hash.substring(0, 16)}...</span>
      </div>
    </div>
  );
}
