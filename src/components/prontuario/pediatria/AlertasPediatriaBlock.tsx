import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle,
  Plus,
  Save,
  X,
  Edit2,
  Heart,
  Pill,
  Activity,
  Baby,
  ShieldAlert,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const alertaPediatricoSchema = z.object({
  id: z.string(),
  tipo: z.enum(['alergia', 'doenca_cronica', 'condicao_risco', 'atraso_desenvolvimento']),
  titulo: z.string().min(1, 'Título é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
  severidade: z.enum(['baixa', 'media', 'alta', 'critica']),
  is_active: z.boolean(),
  data_identificacao: z.string().optional(),
  data_resolucao: z.string().optional(),
  observacoes: z.string().max(500).optional(),
  created_at: z.string(),
  created_by: z.string().optional(),
});

const alertasPediatriaSchema = z.object({
  alertas: z.array(alertaPediatricoSchema).max(50),
});

// ===== TYPES =====
export type TipoAlertaPediatrico = 'alergia' | 'doenca_cronica' | 'condicao_risco' | 'atraso_desenvolvimento';
export type SeveridadeAlerta = 'baixa' | 'media' | 'alta' | 'critica';

export interface AlertaPediatrico {
  id: string;
  tipo: TipoAlertaPediatrico;
  titulo: string;
  descricao?: string;
  severidade: SeveridadeAlerta;
  is_active: boolean;
  data_identificacao?: string;
  data_resolucao?: string;
  observacoes?: string;
  created_at: string;
  created_by?: string;
}

export type AlertasPediatriaData = z.infer<typeof alertasPediatriaSchema>;

export interface AlertasPediatriaRecord {
  id: string;
  patient_id: string;
  data: AlertasPediatriaData;
  updated_by: string;
  updated_by_name?: string;
  updated_at: string;
}

// Summary for Overview
export interface AlertasSummary {
  total_active: number;
  criticos: number;
  alergias: number;
  doencas_cronicas: number;
  condicoes_risco: number;
  atrasos: number;
}

// ===== CONSTANTS =====
export const TIPO_ALERTA_CONFIG: Record<TipoAlertaPediatrico, { label: string; icon: React.ReactNode; color: string }> = {
  alergia: { label: 'Alergia', icon: <Pill className="h-4 w-4" />, color: 'text-orange-600' },
  doenca_cronica: { label: 'Doença Crônica', icon: <Heart className="h-4 w-4" />, color: 'text-rose-600' },
  condicao_risco: { label: 'Condição de Risco', icon: <ShieldAlert className="h-4 w-4" />, color: 'text-red-600' },
  atraso_desenvolvimento: { label: 'Atraso de Desenvolvimento', icon: <Baby className="h-4 w-4" />, color: 'text-amber-600' },
};

export const SEVERIDADE_CONFIG: Record<SeveridadeAlerta, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  baixa: { label: 'Baixa', bgClass: 'bg-muted', textClass: 'text-muted-foreground', borderClass: 'border-muted' },
  media: { label: 'Média', bgClass: 'bg-amber-100', textClass: 'text-amber-700', borderClass: 'border-amber-300' },
  alta: { label: 'Alta', bgClass: 'bg-orange-100', textClass: 'text-orange-700', borderClass: 'border-orange-300' },
  critica: { label: 'Crítica', bgClass: 'bg-destructive/10', textClass: 'text-destructive', borderClass: 'border-destructive/30' },
};

export const COMMON_ALLERGIES = [
  'Penicilina', 'Amoxicilina', 'Dipirona', 'Ibuprofeno', 'AAS',
  'Leite de vaca', 'Ovo', 'Amendoim', 'Soja', 'Trigo', 'Frutos do mar',
  'Látex', 'Picada de inseto', 'Pólen', 'Ácaros',
];

export const COMMON_CHRONIC_DISEASES = [
  'Asma', 'Rinite alérgica', 'Dermatite atópica', 'Diabetes tipo 1',
  'Epilepsia', 'Cardiopatia congênita', 'Fibrose cística', 'Anemia falciforme',
  'Hipotireoidismo congênito', 'Fenilcetonúria', 'Síndrome de Down',
];

// ===== UTILITIES =====
export function calculateAlertasSummary(alertas: AlertaPediatrico[]): AlertasSummary {
  const activeAlertas = alertas.filter(a => a.is_active);
  
  return {
    total_active: activeAlertas.length,
    criticos: activeAlertas.filter(a => a.severidade === 'critica').length,
    alergias: activeAlertas.filter(a => a.tipo === 'alergia').length,
    doencas_cronicas: activeAlertas.filter(a => a.tipo === 'doenca_cronica').length,
    condicoes_risco: activeAlertas.filter(a => a.tipo === 'condicao_risco').length,
    atrasos: activeAlertas.filter(a => a.tipo === 'atraso_desenvolvimento').length,
  };
}

// ===== BANNER COMPONENT (for prontuário header) =====
interface AlertasBannerProps {
  alertas: AlertaPediatrico[];
  onNavigate?: () => void;
  className?: string;
}

export function AlertasPediatriaBanner({ alertas, onNavigate, className }: AlertasBannerProps) {
  const activeAlertas = alertas.filter(a => a.is_active);
  const criticalAlertas = activeAlertas.filter(a => a.severidade === 'critica' || a.severidade === 'alta');
  
  if (activeAlertas.length === 0) return null;

  return (
    <div 
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors",
        criticalAlertas.length > 0 
          ? "bg-destructive/10 border border-destructive/30 hover:bg-destructive/15" 
          : "bg-amber-50 border border-amber-200 hover:bg-amber-100",
        className
      )}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className={cn(
          "h-5 w-5 shrink-0",
          criticalAlertas.length > 0 ? "text-destructive animate-pulse" : "text-amber-600"
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {activeAlertas.slice(0, 4).map((alerta) => {
              const tipoConfig = TIPO_ALERTA_CONFIG[alerta.tipo];
              const sevConfig = SEVERIDADE_CONFIG[alerta.severidade];
              return (
                <Badge 
                  key={alerta.id} 
                  variant="outline"
                  className={cn("text-xs", sevConfig.bgClass, sevConfig.textClass, sevConfig.borderClass)}
                >
                  {tipoConfig.icon}
                  <span className="ml-1">{alerta.titulo}</span>
                </Badge>
              );
            })}
            {activeAlertas.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{activeAlertas.length - 4}
              </Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Ver todos →</span>
      </div>
    </div>
  );
}

// ===== PROPS =====
interface AlertasPediatriaBlockProps {
  patientId: string;
  record?: AlertasPediatriaRecord;
  onSave?: (data: AlertasPediatriaData) => Promise<void>;
  isEditable?: boolean;
  currentProfessionalId?: string;
  className?: string;
}

// ===== MAIN COMPONENT =====
export function AlertasPediatriaBlock({
  patientId,
  record,
  onSave,
  isEditable = true,
  currentProfessionalId,
  className,
}: AlertasPediatriaBlockProps) {
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [alertas, setAlertas] = useState<AlertaPediatrico[]>(
    (record?.data.alertas as AlertaPediatrico[]) || []
  );

  const [newAlerta, setNewAlerta] = useState<Omit<AlertaPediatrico, 'id' | 'created_at'>>({
    tipo: 'alergia',
    titulo: '',
    descricao: '',
    severidade: 'media',
    is_active: true,
    data_identificacao: format(new Date(), 'yyyy-MM-dd'),
    observacoes: '',
    created_by: currentProfessionalId,
  });

  const summary = calculateAlertasSummary(alertas);
  const activeAlertas = alertas.filter(a => a.is_active);
  const inactiveAlertas = alertas.filter(a => !a.is_active);

  const getSuggestions = () => {
    if (newAlerta.tipo === 'alergia') return COMMON_ALLERGIES;
    if (newAlerta.tipo === 'doenca_cronica') return COMMON_CHRONIC_DISEASES;
    return [];
  };

  const handleAddAlerta = () => {
    if (!newAlerta.titulo.trim()) {
      setErrors({ titulo: 'Título é obrigatório' });
      return;
    }

    const alerta: AlertaPediatrico = {
      id: crypto.randomUUID(),
      ...newAlerta,
      created_at: new Date().toISOString(),
    };

    setAlertas(prev => [...prev, alerta]);
    setNewAlerta({
      tipo: 'alergia',
      titulo: '',
      descricao: '',
      severidade: 'media',
      is_active: true,
      data_identificacao: format(new Date(), 'yyyy-MM-dd'),
      observacoes: '',
      created_by: currentProfessionalId,
    });
    setShowNewForm(false);
    setErrors({});
  };

  const handleToggleActive = (id: string) => {
    setAlertas(prev => prev.map(a => 
      a.id === id 
        ? { 
            ...a, 
            is_active: !a.is_active,
            data_resolucao: !a.is_active ? undefined : format(new Date(), 'yyyy-MM-dd')
          }
        : a
    ));
  };

  const handleRemoveAlerta = (id: string) => {
    setAlertas(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!onSave) return;

    const data: AlertasPediatriaData = { alertas };
    const result = alertasPediatriaSchema.safeParse(data);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await onSave(result.data);
    } finally {
      setSaving(false);
    }
  };

  const renderAlertaCard = (alerta: AlertaPediatrico) => {
    const tipoConfig = TIPO_ALERTA_CONFIG[alerta.tipo];
    const sevConfig = SEVERIDADE_CONFIG[alerta.severidade];

    return (
      <div 
        key={alerta.id}
        className={cn(
          "p-3 rounded-lg border",
          alerta.is_active ? sevConfig.bgClass : "bg-muted/30 opacity-60",
          alerta.is_active && sevConfig.borderClass
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={cn("mt-0.5", alerta.is_active ? tipoConfig.color : "text-muted-foreground")}>
              {tipoConfig.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("font-medium", !alerta.is_active && "line-through")}>
                  {alerta.titulo}
                </span>
                <Badge variant="outline" className={cn("text-xs", sevConfig.textClass)}>
                  {sevConfig.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {tipoConfig.label}
                </Badge>
              </div>
              {alerta.descricao && (
                <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
              )}
              {alerta.observacoes && (
                <p className="text-xs text-muted-foreground italic mt-1">{alerta.observacoes}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {alerta.data_identificacao && (
                  <span>Identificado: {format(parseISO(alerta.data_identificacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                )}
                {alerta.data_resolucao && (
                  <span className="text-primary">Resolvido: {format(parseISO(alerta.data_resolucao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                )}
              </div>
            </div>
          </div>
          
          {isEditable && (
            <div className="flex items-center gap-1">
              <Switch 
                checked={alerta.is_active}
                onCheckedChange={() => handleToggleActive(alerta.id)}
                className="scale-75"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemoveAlerta(alerta.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Alertas Pediátricos</CardTitle>
            {summary.total_active > 0 && (
              <Badge variant={summary.criticos > 0 ? "destructive" : "secondary"}>
                {summary.total_active} ativo{summary.total_active !== 1 && 's'}
              </Badge>
            )}
          </div>
          {isEditable && !showNewForm && (
            <Button onClick={() => setShowNewForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Novo Alerta
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Cards */}
        {summary.total_active > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded bg-orange-50 text-center">
              <Pill className="h-4 w-4 mx-auto text-orange-600" />
              <div className="text-lg font-bold text-orange-700">{summary.alergias}</div>
              <div className="text-xs text-orange-600">Alergias</div>
            </div>
            <div className="p-2 rounded bg-rose-50 text-center">
              <Heart className="h-4 w-4 mx-auto text-rose-600" />
              <div className="text-lg font-bold text-rose-700">{summary.doencas_cronicas}</div>
              <div className="text-xs text-rose-600">Crônicas</div>
            </div>
            <div className="p-2 rounded bg-red-50 text-center">
              <ShieldAlert className="h-4 w-4 mx-auto text-red-600" />
              <div className="text-lg font-bold text-red-700">{summary.condicoes_risco}</div>
              <div className="text-xs text-red-600">Risco</div>
            </div>
            <div className="p-2 rounded bg-amber-50 text-center">
              <Baby className="h-4 w-4 mx-auto text-amber-600" />
              <div className="text-lg font-bold text-amber-700">{summary.atrasos}</div>
              <div className="text-xs text-amber-600">Atrasos</div>
            </div>
          </div>
        )}

        {/* New Alert Form */}
        {showNewForm && isEditable && (
          <div className="space-y-4 p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Alerta
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Alerta *</Label>
                <Select
                  value={newAlerta.tipo}
                  onValueChange={(v) => setNewAlerta({ ...newAlerta, tipo: v as TipoAlertaPediatrico, titulo: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_ALERTA_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className={cn("flex items-center gap-2", config.color)}>
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severidade *</Label>
                <Select
                  value={newAlerta.severidade}
                  onValueChange={(v) => setNewAlerta({ ...newAlerta, severidade: v as SeveridadeAlerta })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERIDADE_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <span className={config.textClass}>{config.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder={`Ex: ${getSuggestions()[0] || 'Descrição do alerta'}`}
                value={newAlerta.titulo}
                onChange={(e) => setNewAlerta({ ...newAlerta, titulo: e.target.value })}
                maxLength={100}
                className={errors.titulo ? 'border-destructive' : ''}
                list="suggestions"
              />
              {getSuggestions().length > 0 && (
                <datalist id="suggestions">
                  {getSuggestions().map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
              {errors.titulo && (
                <p className="text-xs text-destructive">{errors.titulo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes adicionais, reações conhecidas..."
                value={newAlerta.descricao}
                onChange={(e) => setNewAlerta({ ...newAlerta, descricao: e.target.value })}
                maxLength={500}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Identificação</Label>
                <Input
                  type="date"
                  value={newAlerta.data_identificacao}
                  onChange={(e) => setNewAlerta({ ...newAlerta, data_identificacao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  placeholder="Notas adicionais..."
                  value={newAlerta.observacoes}
                  onChange={(e) => setNewAlerta({ ...newAlerta, observacoes: e.target.value })}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddAlerta} variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Adicionar Alerta
              </Button>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {activeAlertas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Alertas Ativos ({activeAlertas.length})
            </h4>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2 pr-4">
                {activeAlertas
                  .sort((a, b) => {
                    const sevOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
                    return sevOrder[a.severidade] - sevOrder[b.severidade];
                  })
                  .map(renderAlertaCard)}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Inactive Alerts */}
        {inactiveAlertas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Resolvidos ({inactiveAlertas.length})
            </h4>
            <ScrollArea className="max-h-[150px]">
              <div className="space-y-2 pr-4">
                {inactiveAlertas.map(renderAlertaCard)}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty State */}
        {alertas.length === 0 && !showNewForm && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum alerta registrado</p>
            {isEditable && (
              <Button variant="link" onClick={() => setShowNewForm(true)}>
                Adicionar alerta
              </Button>
            )}
          </div>
        )}

        {/* Save Button */}
        {alertas.length > 0 && isEditable && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alertas'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertasPediatriaBlock;
