import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface DocTypeConfig {
  title?: string;
  show_cpf?: boolean;
  show_address?: boolean;
}

export interface DocumentSettings {
  id: string;
  clinic_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  clinic_name: string | null;
  responsible_name: string | null;
  responsible_crm: string | null;
  show_crm: boolean;
  show_footer: boolean;
  footer_text: string | null;
  header_style: 'simple' | 'stripe';
  show_digital_signature: boolean;
  signature_image_url: string | null;
  font_family: string;
  header_layout: string;
  watermark_type: string;
  watermark_text: string | null;
  use_professional_from_doc: boolean;
  doc_type_config: Record<string, DocTypeConfig>;
  created_at: string;
  updated_at: string;
}

export interface DocumentSettingsInput {
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  clinic_name?: string | null;
  responsible_name?: string | null;
  responsible_crm?: string | null;
  show_crm: boolean;
  show_footer: boolean;
  footer_text?: string | null;
  header_style: 'simple' | 'stripe';
  show_digital_signature: boolean;
  signature_image_url?: string | null;
  font_family: string;
  header_layout: string;
  watermark_type: string;
  watermark_text?: string | null;
  use_professional_from_doc: boolean;
  doc_type_config: Record<string, DocTypeConfig>;
}

export const DOCUMENT_DEFAULTS: DocumentSettingsInput = {
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  clinic_name: null,
  responsible_name: null,
  responsible_crm: null,
  show_crm: true,
  show_footer: true,
  footer_text: 'Documento gerado eletronicamente pelo YesClin',
  header_style: 'simple',
  show_digital_signature: false,
  logo_url: null,
  signature_image_url: null,
  font_family: 'Inter',
  header_layout: 'left',
  watermark_type: 'none',
  watermark_text: null,
  use_professional_from_doc: false,
  doc_type_config: {
    anamnese: { title: 'ANAMNESE', show_cpf: true, show_address: false },
    receita: { title: 'RECEITUÁRIO', show_cpf: true, show_address: true },
    atestado: { title: 'ATESTADO', show_cpf: true, show_address: false },
    evolucao: { title: 'EVOLUÇÃO CLÍNICA', show_cpf: true, show_address: false },
  },
};

export const DOC_TYPES = [
  { key: 'anamnese', label: 'Anamnese' },
  { key: 'receita', label: 'Receita' },
  { key: 'atestado', label: 'Atestado' },
  { key: 'evolucao', label: 'Evolução' },
] as const;

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Sans-serif)' },
  { value: 'Lato', label: 'Lato (Sans-serif)' },
  { value: 'Roboto', label: 'Roboto (Sans-serif)' },
  { value: 'Georgia, serif', label: 'Serif (Georgia)' },
] as const;

export const HEADER_LAYOUTS = [
  { value: 'left', label: 'Logo à Esquerda' },
  { value: 'center', label: 'Logo Centralizada' },
  { value: 'horizontal', label: 'Horizontal (lado a lado)' },
] as const;

export const WATERMARK_OPTIONS = [
  { value: 'none', label: 'Sem marca d\'água' },
  { value: 'clinic_name', label: 'Nome da clínica' },
  { value: 'logo', label: 'Logo opaca' },
  { value: 'custom_text', label: 'Texto personalizado' },
] as const;

export function useDocumentSettings() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [settings, setSettings] = useState<DocumentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_document_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const raw = data as any;
        setSettings({
          ...raw,
          font_family: raw.font_family || 'Inter',
          header_layout: raw.header_layout || 'left',
          watermark_type: raw.watermark_type || 'none',
          watermark_text: raw.watermark_text || null,
          use_professional_from_doc: raw.use_professional_from_doc || false,
          doc_type_config: (typeof raw.doc_type_config === 'object' && raw.doc_type_config !== null)
            ? raw.doc_type_config
            : DOCUMENT_DEFAULTS.doc_type_config,
        } as DocumentSettings);
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('Error fetching document settings:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchSettings();
    }
  }, [clinicLoading, clinic?.id, fetchSettings]);

  const save = async (input: DocumentSettingsInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        ...input,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('clinic_document_settings')
          .update(payload as any)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_document_settings')
          .insert(payload as any);
        if (error) throw error;
      }

      await fetchSettings();
      toast.success('Configurações de documentos salvas');
      return true;
    } catch (err) {
      console.error('Error saving document settings:', err);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!clinic?.id) return null;
    try {
      const ext = file.name.split('.').pop();
      const path = `${clinic.id}/${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('document-assets')
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('document-assets')
        .getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao fazer upload');
      return null;
    }
  };

  return {
    settings,
    defaults: DOCUMENT_DEFAULTS,
    loading: loading || clinicLoading,
    saving,
    save,
    uploadFile,
    fetchSettings,
    clinicName: clinic?.name || null,
  };
}
