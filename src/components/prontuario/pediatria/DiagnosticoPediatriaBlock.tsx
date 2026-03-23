import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Stethoscope,
  Plus,
  X,
  Save,
  Edit2,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const diagnosticoItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Descrição obrigatória').max(300, 'Máximo 300 caracteres'),
  cid_code: z.string().max(10, 'Código CID inválido').optional(),
  is_primary: z.boolean(),
  is_active: z.boolean(),
  diagnosed_at: z.string(),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

const diagnosticoPediatriaSchema = z.object({
  diagnoses: z.array(diagnosticoItemSchema).max(20, 'Máximo 20 diagnósticos'),
  general_observations: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

// ===== TYPES =====
export interface DiagnosticoItem {
  id: string;
  description: string;
  cid_code?: string;
  is_primary: boolean;
  is_active: boolean;
  diagnosed_at: string;
  notes?: string;
}

export type DiagnosticoPediatriaData = z.infer<typeof diagnosticoPediatriaSchema>;

export interface DiagnosticoPediatriaRecord {
  id: string;
  patient_id: string;
  data: DiagnosticoPediatriaData;
  updated_by: string;
  updated_by_name?: string;
  updated_at: string;
}

// ===== COMMON PEDIATRIC CID-10 CODES =====
export const COMMON_PEDIATRIC_CID: { code: string; description: string }[] = [
  { code: 'J06.9', description: 'Infecção aguda das vias aéreas superiores' },
  { code: 'J20.9', description: 'Bronquite aguda não especificada' },
  { code: 'J18.9', description: 'Pneumonia não especificada' },
  { code: 'A09', description: 'Diarreia e gastroenterite de origem infecciosa' },
  { code: 'H66.9', description: 'Otite média não especificada' },
  { code: 'J03.9', description: 'Amigdalite aguda não especificada' },
  { code: 'L20.9', description: 'Dermatite atópica não especificada' },
  { code: 'J45.9', description: 'Asma não especificada' },
  { code: 'R50.9', description: 'Febre não especificada' },
  { code: 'R11', description: 'Náusea e vômitos' },
  { code: 'K59.0', description: 'Constipação' },
  { code: 'R63.0', description: 'Anorexia' },
  { code: 'E46', description: 'Desnutrição proteico-calórica' },
  { code: 'D50.9', description: 'Anemia ferropriva' },
  { code: 'B34.9', description: 'Infecção viral não especificada' },
];

// ===== PROPS =====
interface DiagnosticoPediatriaBlockProps {
  patientId: string;
  record?: DiagnosticoPediatriaRecord;
  onSave?: (data: DiagnosticoPediatriaData) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

// ===== COMPONENT =====
export function DiagnosticoPediatriaBlock({
  patientId,
  record,
  onSave,
  isEditable = true,
  className,
}: DiagnosticoPediatriaBlockProps) {
  const [isEditing, setIsEditing] = useState(!record || record.data.diagnoses.length === 0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCidSuggestions, setShowCidSuggestions] = useState(false);
  const [cidSearch, setCidSearch] = useState('');

  const [formData, setFormData] = useState<DiagnosticoPediatriaData>({
    diagnoses: record?.data.diagnoses || [],
    general_observations: record?.data.general_observations || '',
  });

  const [newDiagnosis, setNewDiagnosis] = useState<Omit<DiagnosticoItem, 'id' | 'diagnosed_at'>>({
    description: '',
    cid_code: '',
    is_primary: formData.diagnoses.length === 0,
    is_active: true,
    notes: '',
  });

  const filteredCidSuggestions = COMMON_PEDIATRIC_CID.filter(
    cid => 
      cid.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
      cid.description.toLowerCase().includes(cidSearch.toLowerCase())
  ).slice(0, 5);

  const handleAddDiagnosis = () => {
    if (!newDiagnosis.description.trim()) return;

    const diagnosis: DiagnosticoItem = {
      id: crypto.randomUUID(),
      description: newDiagnosis.description.trim(),
      cid_code: newDiagnosis.cid_code?.trim() || undefined,
      is_primary: newDiagnosis.is_primary,
      is_active: newDiagnosis.is_active,
      diagnosed_at: new Date().toISOString(),
      notes: newDiagnosis.notes?.trim() || undefined,
    };

    // If setting as primary, remove primary from others
    let updatedDiagnoses = formData.diagnoses;
    if (diagnosis.is_primary) {
      updatedDiagnoses = formData.diagnoses.map(d => ({ ...d, is_primary: false }));
    }

    setFormData(prev => ({
      ...prev,
      diagnoses: [...updatedDiagnoses, diagnosis],
    }));

    setNewDiagnosis({
      description: '',
      cid_code: '',
      is_primary: false,
      is_active: true,
      notes: '',
    });
    setCidSearch('');
    setShowCidSuggestions(false);
  };

  const handleRemoveDiagnosis = (id: string) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.filter(d => d.id !== id),
    }));
  };

  const handleTogglePrimary = (id: string) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map(d => ({
        ...d,
        is_primary: d.id === id,
      })),
    }));
  };

  const handleToggleActive = (id: string) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map(d => 
        d.id === id ? { ...d, is_active: !d.is_active } : d
      ),
    }));
  };

  const handleSelectCid = (cid: typeof COMMON_PEDIATRIC_CID[0]) => {
    setNewDiagnosis(prev => ({
      ...prev,
      cid_code: cid.code,
      description: prev.description || cid.description,
    }));
    setCidSearch(cid.code);
    setShowCidSuggestions(false);
  };

  const handleSave = async () => {
    if (!onSave) return;

    const result = diagnosticoPediatriaSchema.safeParse(formData);
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
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const primaryDiagnosis = formData.diagnoses.find(d => d.is_primary);
  const activeDiagnoses = formData.diagnoses.filter(d => d.is_active && !d.is_primary);
  const inactiveDiagnoses = formData.diagnoses.filter(d => !d.is_active);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Diagnósticos</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {formData.diagnoses.filter(d => d.is_active).length} ativo(s)
            </Badge>
            {isEditable && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </div>
        {record && (
          <p className="text-xs text-muted-foreground">
            Atualizado em {format(parseISO(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {record.updated_by_name && ` por ${record.updated_by_name}`}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Diagnosis Display */}
        {primaryDiagnosis && (
          <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5 fill-primary" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{primaryDiagnosis.description}</span>
                    {primaryDiagnosis.cid_code && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {primaryDiagnosis.cid_code}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diagnóstico Principal • {format(parseISO(primaryDiagnosis.diagnosed_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  {primaryDiagnosis.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{primaryDiagnosis.notes}</p>
                  )}
                </div>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemoveDiagnosis(primaryDiagnosis.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Active Diagnoses List */}
        {activeDiagnoses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Diagnósticos Associados</h4>
            <ScrollArea className={activeDiagnoses.length > 3 ? 'h-[180px]' : ''}>
              <div className="space-y-2 pr-2">
                {activeDiagnoses.map((diagnosis) => (
                  <div 
                    key={diagnosis.id}
                    className="flex items-start justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{diagnosis.description}</span>
                          {diagnosis.cid_code && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {diagnosis.cid_code}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(diagnosis.diagnosed_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {diagnosis.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{diagnosis.notes}</p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleTogglePrimary(diagnosis.id)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Principal
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleActive(diagnosis.id)}
                        >
                          Inativar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveDiagnosis(diagnosis.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Inactive Diagnoses */}
        {inactiveDiagnoses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Diagnósticos Inativos/Resolvidos</h4>
            <div className="space-y-2">
              {inactiveDiagnoses.map((diagnosis) => (
                <div 
                  key={diagnosis.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-muted/30 opacity-70"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium line-through">{diagnosis.description}</span>
                        {diagnosis.cid_code && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {diagnosis.cid_code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(diagnosis.diagnosed_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleToggleActive(diagnosis.id)}
                      >
                        Reativar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveDiagnosis(diagnosis.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {formData.diagnoses.length === 0 && !isEditing && (
          <div className="text-center py-8 text-muted-foreground">
            <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum diagnóstico registrado</p>
          </div>
        )}

        {/* Add New Diagnosis Form */}
        {isEditing && (
          <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Diagnóstico
            </h4>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Descrição do Diagnóstico *</Label>
                <Input
                  placeholder="Ex: Bronquite aguda"
                  value={newDiagnosis.description}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, description: e.target.value })}
                  maxLength={300}
                />
              </div>

              <div className="space-y-2 relative">
                <Label>CID-10 (opcional)</Label>
                <Input
                  placeholder="Ex: J20.9"
                  value={cidSearch}
                  onChange={(e) => {
                    setCidSearch(e.target.value);
                    setNewDiagnosis({ ...newDiagnosis, cid_code: e.target.value });
                    setShowCidSuggestions(true);
                  }}
                  onFocus={() => setShowCidSuggestions(true)}
                  maxLength={10}
                />
                {showCidSuggestions && cidSearch && filteredCidSuggestions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg">
                    {filteredCidSuggestions.map((cid) => (
                      <button
                        key={cid.code}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => handleSelectCid(cid)}
                      >
                        <span className="font-mono font-medium">{cid.code}</span>
                        <span className="text-muted-foreground ml-2">{cid.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Detalhes adicionais..."
                  value={newDiagnosis.notes}
                  onChange={(e) => setNewDiagnosis({ ...newDiagnosis, notes: e.target.value })}
                  maxLength={500}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_primary"
                      checked={newDiagnosis.is_primary}
                      onCheckedChange={(checked) => setNewDiagnosis({ ...newDiagnosis, is_primary: checked })}
                    />
                    <Label htmlFor="is_primary" className="text-sm cursor-pointer">
                      Diagnóstico Principal
                    </Label>
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={handleAddDiagnosis}
                  disabled={!newDiagnosis.description.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* General Observations */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Observações Gerais
          </Label>
          {isEditing ? (
            <Textarea
              placeholder="Considerações sobre o quadro clínico, diagnósticos diferenciais..."
              value={formData.general_observations}
              onChange={(e) => setFormData({ ...formData, general_observations: e.target.value })}
              maxLength={1000}
              rows={3}
            />
          ) : (
            <p className="text-sm p-3 bg-muted/30 rounded-lg">
              {formData.general_observations || 'Nenhuma observação'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && isEditable && (
          <>
            <Separator />
            <div className="flex justify-end gap-2">
              {record && record.data.diagnoses.length > 0 && (
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Diagnósticos'}
              </Button>
            </div>
          </>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">Corrija os erros:</p>
            <ul className="text-sm text-destructive list-disc list-inside mt-1">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DiagnosticoPediatriaBlock;
