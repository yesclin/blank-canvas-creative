import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import {
  useDocumentSettings,
  DOCUMENT_DEFAULTS,
  DOC_TYPES,
  FONT_OPTIONS,
  HEADER_LAYOUTS,
  WATERMARK_OPTIONS,
  type DocumentSettingsInput,
  type DocTypeConfig,
} from "@/hooks/useDocumentSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText, Upload, Save, Loader2, Building2, Palette,
  UserCircle, FileSignature, Eye, Image as ImageIcon,
  Type, Layout, Droplets, Users,
} from "lucide-react";
import { toast } from "sonner";

// ─── Document Preview ────────────────────────────────────────
function DocumentPreview({ form, activeDocType = 'anamnese' }: { form: DocumentSettingsInput; activeDocType?: string }) {
  const fontFamily = form.font_family || 'Inter';
  const docConfig = form.doc_type_config?.[activeDocType] || {};
  const defaultTitle = DOC_TYPES.find(d => d.key === activeDocType)?.label?.toUpperCase() || 'ANAMNESE';
  const docTitle = docConfig.title || defaultTitle;
  const showCpf = docConfig.show_cpf !== false;
  const showAddress = docConfig.show_address === true;

  const renderWatermark = () => {
    if (form.watermark_type === 'none') return null;
    let content: React.ReactNode = null;
    if (form.watermark_type === 'clinic_name') {
      content = <span className="text-4xl font-bold">{form.clinic_name || 'CLÍNICA'}</span>;
    } else if (form.watermark_type === 'logo' && form.logo_url) {
      content = <img src={form.logo_url} alt="" className="h-24 w-24 object-contain" />;
    } else if (form.watermark_type === 'custom_text') {
      content = <span className="text-4xl font-bold">{form.watermark_text || 'MARCA D\'ÁGUA'}</span>;
    } else {
      return null;
    }
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.06 }}>
        <div className="rotate-[-30deg] text-gray-500">{content}</div>
      </div>
    );
  };

  const renderHeader = () => {
    const logoEl = form.logo_url ? (
      <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded object-cover border bg-white/20" />
    ) : (
      <div className="h-10 w-10 rounded border flex items-center justify-center bg-white/20" style={{ color: form.primary_color }}>
        <Building2 className="h-5 w-5" />
      </div>
    );

    const infoEl = (
      <div>
        <p className="font-bold text-sm" style={{ color: form.header_style === 'stripe' ? 'white' : form.primary_color }}>
          {form.clinic_name || 'Nome da Clínica'}
        </p>
        {form.responsible_name && (
          <p className="text-[10px]" style={{ opacity: form.header_style === 'stripe' ? 0.9 : 0.7 }}>
            {form.use_professional_from_doc ? 'Dr(a). Profissional do Documento' : form.responsible_name}
          </p>
        )}
        {form.show_crm && form.responsible_crm && (
          <p className="text-[10px]" style={{ opacity: form.header_style === 'stripe' ? 0.8 : 0.5 }}>
            CRM: {form.responsible_crm}
          </p>
        )}
      </div>
    );

    const wrapperStyle = form.header_style === 'stripe'
      ? { backgroundColor: form.primary_color, color: 'white' }
      : {};
    const wrapperClass = form.header_style === 'stripe'
      ? 'p-3 text-white'
      : 'p-3 border-b';

    if (form.header_layout === 'center') {
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          <div className="flex flex-col items-center gap-1 text-center">
            {logoEl}
            {infoEl}
          </div>
        </div>
      );
    }

    if (form.header_layout === 'horizontal') {
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {logoEl}
              <p className="font-bold text-sm" style={{ color: form.header_style === 'stripe' ? 'white' : form.primary_color }}>
                {form.clinic_name || 'Nome da Clínica'}
              </p>
            </div>
            <div className="text-right">
              {form.responsible_name && (
                <p className="text-[10px]" style={{ opacity: 0.8 }}>
                  {form.use_professional_from_doc ? 'Dr(a). Profissional' : form.responsible_name}
                </p>
              )}
              {form.show_crm && form.responsible_crm && (
                <p className="text-[10px]" style={{ opacity: 0.6 }}>CRM: {form.responsible_crm}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // default: left
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="flex items-center gap-3">
          {logoEl}
          {infoEl}
        </div>
      </div>
    );
  };

  return (
    <div
      className="border rounded-lg bg-white text-black overflow-hidden shadow-sm relative"
      style={{ fontSize: '11px', fontFamily }}
    >
      {renderWatermark()}
      <div className="relative z-10">
        {renderHeader()}

        {/* Patient data */}
        <div className="px-3 py-2 bg-gray-50 border-b">
          <p className="text-[10px] text-gray-500 font-medium">DADOS DO PACIENTE</p>
          <p className="text-[10px] text-gray-400">
            Nome: João Silva
            {showCpf && ' • CPF: 000.000.000-00'}
            {showAddress && ' • Rua Exemplo, 123 - Centro'}
          </p>
        </div>

        {/* Document title */}
        <div className="px-3 py-2 text-center border-b">
          <p className="font-bold text-xs" style={{ color: form.primary_color }}>{docTitle}</p>
        </div>

        {/* Content placeholder */}
        <div className="px-3 py-2 space-y-1.5">
          <div>
            <p className="text-[10px] font-semibold text-gray-600">Queixa Principal</p>
            <div className="h-2 bg-gray-200 rounded w-3/4 mt-0.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-600">História da Doença Atual</p>
            <div className="h-2 bg-gray-200 rounded w-full mt-0.5" />
            <div className="h-2 bg-gray-200 rounded w-2/3 mt-0.5" />
          </div>
        </div>

        {/* Sequential number + QR Code (fictitious) */}
        <div className="px-3 py-2 border-t flex items-center justify-between">
          <div>
            <p className="text-[9px] text-gray-400 font-mono">Nº AN-2026-000001</p>
            <p className="text-[8px] text-gray-300">Validação: abc123...def456</p>
          </div>
          <div className="w-10 h-10 border rounded flex items-center justify-center bg-gray-50">
            <span className="text-[7px] text-gray-300 text-center leading-tight">QR<br/>Code</span>
          </div>
        </div>

        {/* Footer */}
        {form.show_footer && (
          <div className="border-t px-3 py-2">
            <div className="flex items-end justify-between">
              <p className="text-[9px] text-gray-400">{form.footer_text}</p>
              {form.show_digital_signature && form.signature_image_url && (
                <img src={form.signature_image_url} alt="Assinatura" className="h-6 object-contain" />
              )}
              {form.show_digital_signature && !form.signature_image_url && (
                <div className="text-[9px] text-gray-300 italic">Assinatura Digital</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modelos de Documento Section ─────────────────────────────
function ModelosDocumentoSection() {
  const { clinic } = useClinicData();
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(true);
  const [savingModelo, setSavingModelo] = useState(false);
  const [editingModelo, setEditingModelo] = useState<any | null>(null);
  const [formModelo, setFormModelo] = useState({ nome: '', tipo: 'receituario' as string, cabecalho_personalizado: '', texto_padrao: '', rodape: '', is_default: false });

  const fetchModelos = useCallback(async () => {
    if (!clinic?.id) return;
    setLoadingModelos(true);
    const { data } = await supabase.from('modelos_documento').select('*').eq('clinic_id', clinic.id).order('created_at', { ascending: false });
    setModelos(data || []);
    setLoadingModelos(false);
  }, [clinic?.id]);

  useEffect(() => { fetchModelos(); }, [fetchModelos]);

  const resetForm = () => { setFormModelo({ nome: '', tipo: 'receituario', cabecalho_personalizado: '', texto_padrao: '', rodape: '', is_default: false }); setEditingModelo(null); };

  const handleSaveModelo = async () => {
    if (!clinic?.id || !formModelo.nome.trim()) return;
    setSavingModelo(true);
    try {
      if (editingModelo) {
        await supabase.from('modelos_documento').update({ nome: formModelo.nome, tipo: formModelo.tipo, cabecalho_personalizado: formModelo.cabecalho_personalizado || null, texto_padrao: formModelo.texto_padrao || null, rodape: formModelo.rodape || null, is_default: formModelo.is_default } as any).eq('id', editingModelo.id);
      } else {
        await supabase.from('modelos_documento').insert({ clinic_id: clinic.id, nome: formModelo.nome, tipo: formModelo.tipo, cabecalho_personalizado: formModelo.cabecalho_personalizado || null, texto_padrao: formModelo.texto_padrao || null, rodape: formModelo.rodape || null, is_default: formModelo.is_default } as any);
      }
      toast.success(editingModelo ? 'Modelo atualizado' : 'Modelo criado');
      resetForm();
      await fetchModelos();
    } catch (err: any) { toast.error(err.message); }
    setSavingModelo(false);
  };

  const handleEdit = (m: any) => { setEditingModelo(m); setFormModelo({ nome: m.nome, tipo: m.tipo, cabecalho_personalizado: m.cabecalho_personalizado || '', texto_padrao: m.texto_padrao || '', rodape: m.rodape || '', is_default: m.is_default }); };
  const handleDelete = async (id: string) => { await supabase.from('modelos_documento').delete().eq('id', id); await fetchModelos(); toast.success('Modelo removido'); };
  const handleToggleActive = async (id: string, active: boolean) => { await supabase.from('modelos_documento').update({ is_active: active } as any).eq('id', id); await fetchModelos(); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {editingModelo ? 'Editar Modelo' : 'Novo Modelo de Documento'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do modelo *</Label>
              <Input placeholder="Ex: Receituário Padrão" value={formModelo.nome} onChange={e => setFormModelo(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={formModelo.tipo} onValueChange={v => setFormModelo(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receituario">Receituário</SelectItem>
                  <SelectItem value="atestado">Atestado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Cabeçalho personalizado</Label>
            <Textarea placeholder="Texto de cabeçalho..." value={formModelo.cabecalho_personalizado} onChange={e => setFormModelo(p => ({ ...p, cabecalho_personalizado: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Texto padrão</Label>
            <Textarea placeholder="Conteúdo padrão do documento..." value={formModelo.texto_padrao} onChange={e => setFormModelo(p => ({ ...p, texto_padrao: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label className="text-xs">Rodapé</Label>
            <Input placeholder="Rodapé do modelo" value={formModelo.rodape} onChange={e => setFormModelo(p => ({ ...p, rodape: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formModelo.is_default} onCheckedChange={v => setFormModelo(p => ({ ...p, is_default: v }))} />
            <Label className="text-xs">Definir como padrão</Label>
          </div>
          <div className="flex gap-2">
            {editingModelo && <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>}
            <Button size="sm" onClick={handleSaveModelo} disabled={savingModelo || !formModelo.nome.trim()}>
              {savingModelo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {editingModelo ? 'Atualizar' : 'Criar Modelo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Modelos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingModelos ? <Skeleton className="h-20 w-full" /> : modelos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum modelo cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {modelos.map(m => (
                <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.nome}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m.tipo === 'receituario' ? 'Receituário' : 'Atestado'}</span>
                      {m.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Padrão</span>}
                      {!m.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Inativo</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={m.is_active} onCheckedChange={v => handleToggleActive(m.id, v)} />
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(m.id)}>Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DocumentosInstitucionais() {
  const { settings, loading, saving, save, uploadFile, clinicName } = useDocumentSettings();

  const [form, setForm] = useState<DocumentSettingsInput>({ ...DOCUMENT_DEFAULTS });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [activeDocType, setActiveDocType] = useState('anamnese');

  useEffect(() => {
    if (settings) {
      setForm({
        logo_url: settings.logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        clinic_name: settings.clinic_name,
        responsible_name: settings.responsible_name,
        responsible_crm: settings.responsible_crm,
        show_crm: settings.show_crm,
        show_footer: settings.show_footer,
        footer_text: settings.footer_text,
        header_style: settings.header_style,
        show_digital_signature: settings.show_digital_signature,
        signature_image_url: settings.signature_image_url,
        font_family: settings.font_family || 'Inter',
        header_layout: settings.header_layout || 'left',
        watermark_type: settings.watermark_type || 'none',
        watermark_text: settings.watermark_text,
        use_professional_from_doc: settings.use_professional_from_doc || false,
        doc_type_config: settings.doc_type_config || DOCUMENT_DEFAULTS.doc_type_config,
      });
    } else if (clinicName) {
      setForm(prev => ({ ...prev, clinic_name: clinicName }));
    }
  }, [settings, clinicName]);

  const update = (key: keyof DocumentSettingsInput, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateDocTypeConfig = (docType: string, field: keyof DocTypeConfig, value: unknown) => {
    setForm(prev => ({
      ...prev,
      doc_type_config: {
        ...prev.doc_type_config,
        [docType]: {
          ...prev.doc_type_config[docType],
          [field]: value,
        },
      },
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    setUploadingLogo(true);
    const url = await uploadFile(file, 'logos');
    if (url) update('logo_url', url);
    setUploadingLogo(false);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    setUploadingSignature(true);
    const url = await uploadFile(file, 'signatures');
    if (url) update('signature_image_url', url);
    setUploadingSignature(false);
  };

  const handleSave = () => save(form);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Documentos Institucionais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o layout dos documentos PDF gerados pelo sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="identidade" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="identidade" className="text-xs">Identidade</TabsTrigger>
              <TabsTrigger value="estilo" className="text-xs">Estilo</TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs">Documentos</TabsTrigger>
              <TabsTrigger value="profissional" className="text-xs">Profissional</TabsTrigger>
              <TabsTrigger value="rodape" className="text-xs">Rodapé</TabsTrigger>
              <TabsTrigger value="modelos" className="text-xs">Modelos</TabsTrigger>
            </TabsList>

            {/* ─── Tab: Identidade ─── */}
            <TabsContent value="identidade" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Identidade da Clínica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Clínica (no documento)</Label>
                    <Input
                      value={form.clinic_name || ''}
                      onChange={e => update('clinic_name', e.target.value)}
                      placeholder="Nome que aparecerá nos documentos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-3">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-lg object-cover border" />
                      ) : (
                        <div className="h-14 w-14 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <Button variant="outline" size="sm" disabled={uploadingLogo} asChild>
                          <label className="cursor-pointer">
                            {uploadingLogo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                            {uploadingLogo ? 'Enviando...' : 'Upload Logo'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                        </Button>
                        {form.logo_url && (
                          <Button variant="ghost" size="sm" className="text-xs ml-1" onClick={() => update('logo_url', null)}>
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Estilo ─── */}
            <TabsContent value="estilo" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Cores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.primary_color} onChange={e => update('primary_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                        <Input value={form.primary_color} onChange={e => update('primary_color', e.target.value)} className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.secondary_color} onChange={e => update('secondary_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                        <Input value={form.secondary_color} onChange={e => update('secondary_color', e.target.value)} className="flex-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layout className="h-4 w-4 text-primary" />
                    Layout do Cabeçalho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estilo do Cabeçalho</Label>
                    <RadioGroup value={form.header_style} onValueChange={v => update('header_style', v)} className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="simple" id="hs-simple" />
                        <Label htmlFor="hs-simple">Simples</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="stripe" id="hs-stripe" />
                        <Label htmlFor="hs-stripe">Faixa Colorida</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Posição da Logo</Label>
                    <Select value={form.header_layout} onValueChange={v => update('header_layout', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HEADER_LAYOUTS.map(h => (
                          <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    Tipografia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Fonte do Documento</Label>
                    <Select value={form.font_family} onValueChange={v => update('font_family', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    Marca d'Água
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.watermark_type} onValueChange={v => update('watermark_type', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WATERMARK_OPTIONS.map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.watermark_type === 'custom_text' && (
                    <div className="space-y-2">
                      <Label>Texto da Marca d'Água</Label>
                      <Input
                        value={form.watermark_text || ''}
                        onChange={e => update('watermark_text', e.target.value)}
                        placeholder="Ex: CONFIDENCIAL"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Documentos (per-type) ─── */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Personalização por Tipo de Documento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeDocType} onValueChange={setActiveDocType}>
                    <TabsList className="grid w-full grid-cols-4">
                      {DOC_TYPES.map(dt => (
                        <TabsTrigger key={dt.key} value={dt.key} className="text-xs">{dt.label}</TabsTrigger>
                      ))}
                    </TabsList>
                    {DOC_TYPES.map(dt => {
                      const cfg = form.doc_type_config?.[dt.key] || {};
                      return (
                        <TabsContent key={dt.key} value={dt.key} className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Título do Documento</Label>
                            <Input
                              value={cfg.title || ''}
                              onChange={e => updateDocTypeConfig(dt.key, 'title', e.target.value)}
                              placeholder={`Ex: ${dt.label.toUpperCase()}`}
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={cfg.show_cpf !== false}
                                onCheckedChange={v => updateDocTypeConfig(dt.key, 'show_cpf', v)}
                              />
                              <Label className="text-sm">Exibir CPF</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={cfg.show_address === true}
                                onCheckedChange={v => updateDocTypeConfig(dt.key, 'show_address', v)}
                              />
                              <Label className="text-sm">Exibir Endereço</Label>
                            </div>
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Profissional ─── */}
            <TabsContent value="profissional" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-primary" />
                    Responsável Técnico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Responsável</Label>
                      <Input
                        value={form.responsible_name || ''}
                        onChange={e => update('responsible_name', e.target.value)}
                        placeholder="Dr(a). Nome Completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CRM / Registro Profissional</Label>
                      <Input
                        value={form.responsible_crm || ''}
                        onChange={e => update('responsible_crm', e.target.value)}
                        placeholder="CRM/UF 00000"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.show_crm} onCheckedChange={v => update('show_crm', v)} />
                    <Label className="text-sm">Exibir CRM nos documentos</Label>
                  </div>

                  <Separator />

                  <Card className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={form.use_professional_from_doc}
                              onCheckedChange={v => update('use_professional_from_doc', v)}
                            />
                            <Label className="text-sm font-medium">
                              Usar profissional do documento
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Quando ativado, o nome e registro do profissional que gerou o documento
                            serão usados no cabeçalho, ao invés do responsável fixo da clínica.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Rodapé ─── */}
            <TabsContent value="rodape" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-primary" />
                    Rodapé e Assinatura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.show_footer} onCheckedChange={v => update('show_footer', v)} />
                    <Label className="text-sm">Exibir rodapé nos documentos</Label>
                  </div>
                  {form.show_footer && (
                    <div className="space-y-2">
                      <Label>Texto do Rodapé</Label>
                      <Textarea
                        value={form.footer_text || ''}
                        onChange={e => update('footer_text', e.target.value)}
                        placeholder="Texto que aparecerá no rodapé"
                        rows={2}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-2">
                    <Switch checked={form.show_digital_signature} onCheckedChange={v => update('show_digital_signature', v)} />
                    <Label className="text-sm">Incluir assinatura digital</Label>
                  </div>
                  {form.show_digital_signature && (
                    <div className="space-y-2">
                      <Label>Imagem da Assinatura</Label>
                      <div className="flex items-center gap-3">
                        {form.signature_image_url ? (
                          <img src={form.signature_image_url} alt="Assinatura" className="h-12 object-contain border rounded p-1" />
                        ) : (
                          <div className="h-12 w-32 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground text-xs">
                            Sem assinatura
                          </div>
                        )}
                        <Button variant="outline" size="sm" disabled={uploadingSignature} asChild>
                          <label className="cursor-pointer">
                            {uploadingSignature ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                          </label>
                        </Button>
                        {form.signature_image_url && (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => update('signature_image_url', null)}>
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Modelos ─── */}
            <TabsContent value="modelos" className="mt-4">
              <ModelosDocumentoSection />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            Preview em Tempo Real
          </div>
          <div className="sticky top-6">
            <DocumentPreview form={form} activeDocType={activeDocType} />
          </div>
        </div>
      </div>
    </div>
  );
}
