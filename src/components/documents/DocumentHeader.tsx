import { useClinicData } from "@/hooks/useClinicData";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Building2, Phone, Mail, MapPin } from "lucide-react";

interface DocumentHeaderProps {
  showAddress?: boolean;
  showContact?: boolean;
  compact?: boolean;
  className?: string;
}

export function DocumentHeader({
  showAddress = true,
  showContact = true,
  compact = false,
  className = "",
}: DocumentHeaderProps) {
  const { clinic, isLoading, getFormattedAddress, getFiscalDocument } = useClinicData();

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return null;
  }

  const fiscalDoc = getFiscalDocument();
  const address = getFormattedAddress();

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {clinic.logo_url ? (
          <img
            src={clinic.logo_url}
            alt={clinic.name}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{clinic.name}</h3>
          {fiscalDoc && (
            <p className="text-xs text-muted-foreground">
              {fiscalDoc.type}: {fiscalDoc.value}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-4">
        {clinic.logo_url ? (
          <img
            src={clinic.logo_url}
            alt={clinic.name}
            className="h-16 w-16 rounded-lg object-cover border"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center border">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="text-lg font-bold text-foreground">{clinic.name}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {fiscalDoc && (
              <span className="font-medium">
                {fiscalDoc.type}: {fiscalDoc.value}
              </span>
            )}
            {clinic.fiscal_type === "pj" && clinic.inscricao_estadual && (
              <span>IE: {clinic.inscricao_estadual}</span>
            )}
            {clinic.fiscal_type === "pj" && clinic.inscricao_municipal && (
              <span>IM: {clinic.inscricao_municipal}</span>
            )}
          </div>
        </div>
      </div>

      {(showAddress || showContact) && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {showAddress && address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>{address}</span>
              </div>
            )}
            {showContact && clinic.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                <span>{clinic.phone}</span>
              </div>
            )}
            {showContact && clinic.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                <span>{clinic.email}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
