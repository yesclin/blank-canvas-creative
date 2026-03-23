import { useState, useRef } from "react";
import { Building, Upload, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { maskPhone } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      </CardContent>
    </Card>
  );
}
