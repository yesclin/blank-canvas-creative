import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Building, Upload, Loader2, Trash2, Link2, Copy, ExternalLink, RefreshCw, Check, X, QrCode, Share2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { maskPhone } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PUBLIC_BOOKING_DOMAIN = "https://yesclin.com.br";

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ClinicDataCardProps {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  logoUrl: string;
  clinicId: string | null;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onLogoChange: (url: string) => void;
}

export function ClinicDataCard({
  name,
  phone,
  whatsapp,
  email,
  logoUrl,
  clinicId,
  onNameChange,
  onPhoneChange,
  onWhatsappChange,
  onEmailChange,
  onLogoChange,
}: ClinicDataCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Booking link state
  const [slug, setSlug] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!clinicId) return;
    let active = true;
    setLoadingBooking(true);
    supabase
      .from("clinics")
      .select("slug, public_booking_enabled")
      .eq("id", clinicId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setSlug(data.slug || "");
        setSlugDraft(data.slug || "");
        setBookingEnabled(!!data.public_booking_enabled);
      })
      .then(() => active && setLoadingBooking(false));
    return () => {
      active = false;
    };
  }, [clinicId]);

  const bookingUrl = slug ? `${PUBLIC_BOOKING_DOMAIN}/agendar/${slug}` : "";

  const handleCopyLink = async () => {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    toast({ title: "Link copiado!", description: bookingUrl });
  };

  const handleOpenLink = () => {
    if (bookingUrl) window.open(bookingUrl, "_blank", "noopener,noreferrer");
  };

  const handleShowQr = async () => {
    if (!bookingUrl) return;
    try {
      const url = await QRCode.toDataURL(bookingUrl, { width: 480, margin: 2 });
      setQrDataUrl(url);
      setQrOpen(true);
    } catch {
      toast({ title: "Erro ao gerar QR Code", variant: "destructive" });
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-agendamento-${slug || "clinica"}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!bookingUrl) return;
    const shareData = { title: "Agende online", text: `Agende seu atendimento: ${name}`, url: bookingUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* canceled */ }
    }
    await navigator.clipboard.writeText(bookingUrl);
    toast({ title: "Link copiado para compartilhar!", description: bookingUrl });
  };

  const handleSaveSlug = async () => {
    if (!clinicId) return;
    const clean = sanitizeSlug(slugDraft);
    if (!clean) {
      toast({ title: "Slug inválido", description: "Informe um identificador válido.", variant: "destructive" });
      return;
    }
    setSavingSlug(true);
    const { error } = await supabase
      .from("clinics")
      .update({ slug: clean })
      .eq("id", clinicId);
    setSavingSlug(false);
    if (error) {
      const dup = error.message?.toLowerCase().includes("duplicate") || error.message?.toLowerCase().includes("unique");
      toast({
        title: dup ? "Slug já em uso" : "Erro ao salvar slug",
        description: dup ? "Escolha outro identificador." : error.message,
        variant: "destructive",
      });
      return;
    }
    setSlug(clean);
    setSlugDraft(clean);
    setEditingSlug(false);
    toast({ title: "Link atualizado!" });
  };


  const handlePhoneChange = (value: string, setter: (v: string) => void) => {
    const masked = maskPhone(value);
    setter(masked);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use apenas imagens JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/clinic-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('clinic-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clinic-logos')
        .getPublicUrl(fileName);

      // Update clinic record
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ logo_url: publicUrl })
        .eq('id', clinicId);

      if (updateError) throw updateError;

      onLogoChange(publicUrl);

      toast({
        title: "Logo atualizada!",
        description: "A logo da clínica foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl || !clinicId) return;

    setIsUploading(true);

    try {
      // Extract path from URL
      const path = logoUrl.split('/clinic-logos/')[1];
      if (path) {
        await supabase.storage.from('clinic-logos').remove([path]);
      }

      // Update clinic record
      await supabase
        .from('clinics')
        .update({ logo_url: null })
        .eq('id', clinicId);

      onLogoChange('');

      toast({
        title: "Logo removida",
        description: "A logo da clínica foi removida.",
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Dados da Clínica
        </CardTitle>
        <CardDescription>
          Informações básicas que serão usadas em comunicações e documentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={logoUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {name.charAt(0).toUpperCase() || "Y"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !clinicId}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Enviando..." : "Enviar Logo"}
              </Button>
              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isUploading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos: JPG, PNG, WebP. Máx: 2MB
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="clinic_name">Nome da Clínica *</Label>
            <Input
              id="clinic_name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nome da clínica"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value, onPhoneChange)}
                placeholder="(00) 0000-0000"
                maxLength={15}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => handlePhoneChange(e.target.value, onWhatsappChange)}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="contato@clinica.com"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Link de agendamento online</Label>
            </div>
            <Badge variant={bookingEnabled ? "default" : "secondary"}>
              {bookingEnabled ? "Seu link de agendamento está ativo" : "Agendamento online desativado"}
            </Badge>
          </div>

          {editingSlug ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{PUBLIC_BOOKING_DOMAIN}/agendar/</span>
              <Input
                value={slugDraft}
                onChange={(e) => setSlugDraft(sanitizeSlug(e.target.value))}
                placeholder="minha-clinica"
                disabled={savingSlug}
              />
              <Button size="sm" onClick={handleSaveSlug} disabled={savingSlug || !clinicId}>
                {savingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSlugDraft(slug);
                  setEditingSlug(false);
                }}
                disabled={savingSlug}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={bookingUrl || (loadingBooking ? "Carregando..." : "Defina um identificador (slug) para gerar o link")}
                readOnly
                className="flex-1 min-w-[240px] font-mono text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleCopyLink} disabled={!bookingUrl}>
                <Copy className="h-4 w-4 mr-1" /> Copiar link
              </Button>
              <Button size="sm" variant="outline" onClick={handleOpenLink} disabled={!bookingUrl}>
                <ExternalLink className="h-4 w-4 mr-1" /> Abrir
              </Button>
              <Button size="sm" variant="outline" onClick={handleShowQr} disabled={!bookingUrl}>
                <QrCode className="h-4 w-4 mr-1" /> QR Code
              </Button>
              <Button size="sm" variant="outline" onClick={handleShare} disabled={!bookingUrl}>
                <Share2 className="h-4 w-4 mr-1" /> Compartilhar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingSlug(true)} disabled={!clinicId}>
                <RefreshCw className="h-4 w-4 mr-1" /> {slug ? "Editar slug" : "Definir slug"}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Envie este link aos pacientes para agendarem direto pelo site. Ative o agendamento online em Configurações → Agenda.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
