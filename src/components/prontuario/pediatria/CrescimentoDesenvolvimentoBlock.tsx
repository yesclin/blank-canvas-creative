import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  Baby,
  Ruler,
  Scale,
  Activity,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Brain,
  Users,
  MessageSquare,
  Hand
} from 'lucide-react';
import { format, differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===== TYPES =====
export interface GrowthMeasurement {
  id: string;
  date: string;
  age_months: number;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  bmi?: number;
  weight_percentile?: number;
  height_percentile?: number;
  hc_percentile?: number;
  bmi_percentile?: number;
  notes?: string;
  recorded_by?: string;
}

export interface DevelopmentMilestone {
  id: string;
  category: MilestoneCategory;
  name: string;
  expected_age_months: number;
  achieved_at?: string;
  status: 'pending' | 'achieved' | 'delayed' | 'not_applicable';
  notes?: string;
}

export type MilestoneCategory = 'motor_grosso' | 'motor_fino' | 'linguagem' | 'social' | 'cognitivo';

export interface GrowthFormData {
  date: string;
  weight_kg: string;
  height_cm: string;
  head_circumference_cm: string;
  notes: string;
}

// ===== CONSTANTS =====
export const MILESTONE_CATEGORIES: Record<MilestoneCategory, { label: string; icon: React.ReactNode; color: string }> = {
  motor_grosso: { label: 'Motor Grosso', icon: <Activity className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  motor_fino: { label: 'Motor Fino', icon: <Hand className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  linguagem: { label: 'Linguagem', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  social: { label: 'Social', icon: <Users className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700' },
  cognitivo: { label: 'Cognitivo', icon: <Brain className="h-4 w-4" />, color: 'bg-pink-100 text-pink-700' },
};

export const MILESTONE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
  achieved: { label: 'Alcançado', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  delayed: { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3 w-3" /> },
  not_applicable: { label: 'N/A', color: 'bg-gray-100 text-gray-500', icon: <Minus className="h-3 w-3" /> },
};

// Default milestones by age (simplified version based on MS guidelines)
export const DEFAULT_MILESTONES: Omit<DevelopmentMilestone, 'id' | 'achieved_at' | 'status' | 'notes'>[] = [
  // 1 month
  { category: 'motor_grosso', name: 'Movimenta braços e pernas', expected_age_months: 1 },
  { category: 'social', name: 'Olha para o rosto do cuidador', expected_age_months: 1 },
  // 2 months
  { category: 'motor_grosso', name: 'Sustenta a cabeça brevemente', expected_age_months: 2 },
  { category: 'social', name: 'Sorriso social', expected_age_months: 2 },
  { category: 'linguagem', name: 'Emite sons guturais', expected_age_months: 2 },
  // 4 months
  { category: 'motor_grosso', name: 'Sustenta a cabeça firme', expected_age_months: 4 },
  { category: 'motor_fino', name: 'Segura objetos com a mão', expected_age_months: 4 },
  { category: 'linguagem', name: 'Vocaliza e ri alto', expected_age_months: 4 },
  // 6 months
  { category: 'motor_grosso', name: 'Senta com apoio', expected_age_months: 6 },
  { category: 'motor_fino', name: 'Transfere objetos entre mãos', expected_age_months: 6 },
  { category: 'linguagem', name: 'Balbucia (mama, papa)', expected_age_months: 6 },
  // 9 months
  { category: 'motor_grosso', name: 'Senta sem apoio', expected_age_months: 9 },
  { category: 'motor_grosso', name: 'Engatinha', expected_age_months: 9 },
  { category: 'motor_fino', name: 'Pinça inferior', expected_age_months: 9 },
  { category: 'social', name: 'Estranha pessoas desconhecidas', expected_age_months: 9 },
  // 12 months
  { category: 'motor_grosso', name: 'Fica em pé com apoio', expected_age_months: 12 },
  { category: 'motor_fino', name: 'Pinça superior', expected_age_months: 12 },
  { category: 'linguagem', name: 'Fala 2-3 palavras', expected_age_months: 12 },
  { category: 'cognitivo', name: 'Entende "não"', expected_age_months: 12 },
  // 18 months
  { category: 'motor_grosso', name: 'Anda sozinho', expected_age_months: 18 },
  { category: 'motor_fino', name: 'Faz torre de 2-3 cubos', expected_age_months: 18 },
  { category: 'linguagem', name: 'Fala 10+ palavras', expected_age_months: 18 },
  { category: 'social', name: 'Imita atividades', expected_age_months: 18 },
  // 24 months
  { category: 'motor_grosso', name: 'Corre', expected_age_months: 24 },
  { category: 'motor_grosso', name: 'Sobe escadas com apoio', expected_age_months: 24 },
  { category: 'motor_fino', name: 'Faz torre de 6+ cubos', expected_age_months: 24 },
  { category: 'linguagem', name: 'Frases de 2 palavras', expected_age_months: 24 },
  // 36 months
  { category: 'motor_grosso', name: 'Pula com dois pés', expected_age_months: 36 },
  { category: 'motor_fino', name: 'Copia círculo', expected_age_months: 36 },
  { category: 'linguagem', name: 'Frases completas', expected_age_months: 36 },
  { category: 'social', name: 'Brinca com outras crianças', expected_age_months: 36 },
  // 48 months
  { category: 'motor_grosso', name: 'Pula em um pé', expected_age_months: 48 },
  { category: 'motor_fino', name: 'Desenha pessoa (3 partes)', expected_age_months: 48 },
  { category: 'linguagem', name: 'Conta histórias', expected_age_months: 48 },
  { category: 'cognitivo', name: 'Conhece cores básicas', expected_age_months: 48 },
  // 60 months
  { category: 'motor_grosso', name: 'Pega bola com as mãos', expected_age_months: 60 },
  { category: 'motor_fino', name: 'Escreve algumas letras', expected_age_months: 60 },
  { category: 'linguagem', name: 'Fala claramente', expected_age_months: 60 },
  { category: 'cognitivo', name: 'Conta até 10', expected_age_months: 60 },
];

// ===== UTILITIES =====
function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

function formatAge(months: number): string {
  if (months < 1) return 'RN';
  if (months < 24) return `${months}m`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years}a`;
  return `${years}a ${remainingMonths}m`;
}

function getPercentileColor(percentile?: number): string {
  if (percentile === undefined) return 'text-muted-foreground';
  if (percentile < 3) return 'text-red-600';
  if (percentile < 15) return 'text-orange-600';
  if (percentile > 97) return 'text-red-600';
  if (percentile > 85) return 'text-orange-600';
  return 'text-green-600';
}

function getTrendIcon(current?: number, previous?: number) {
  if (current === undefined || previous === undefined) return null;
  if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (current < previous) return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

// ===== PROPS =====
interface CrescimentoDesenvolvimentoBlockProps {
  patientId: string;
  birthDate: string;
  measurements: GrowthMeasurement[];
  milestones: DevelopmentMilestone[];
  onAddMeasurement?: (data: Omit<GrowthMeasurement, 'id'>) => Promise<void>;
  onUpdateMilestone?: (milestoneId: string, data: Partial<DevelopmentMilestone>) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

// ===== COMPONENT =====
export function CrescimentoDesenvolvimentoBlock({
  patientId,
  birthDate,
  measurements,
  milestones,
  onAddMeasurement,
  onUpdateMilestone,
  isEditable = true,
  className,
}: CrescimentoDesenvolvimentoBlockProps) {
  const [activeTab, setActiveTab] = useState<'crescimento' | 'desenvolvimento'>('crescimento');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<GrowthFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight_kg: '',
    height_cm: '',
    head_circumference_cm: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | 'all'>('all');

  // Calculate current age in months
  const currentAgeMonths = useMemo(() => {
    if (!birthDate) return 0;
    return differenceInMonths(new Date(), parseISO(birthDate));
  }, [birthDate]);

  // Sort measurements by date (most recent first)
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [measurements]);

  const latestMeasurement = sortedMeasurements[0];
  const previousMeasurement = sortedMeasurements[1];

  // Filter milestones by category and sort by expected age
  const filteredMilestones = useMemo(() => {
    let filtered = milestones;
    if (selectedCategory !== 'all') {
      filtered = milestones.filter(m => m.category === selectedCategory);
    }
    return [...filtered].sort((a, b) => a.expected_age_months - b.expected_age_months);
  }, [milestones, selectedCategory]);

  // Group milestones by age range
  const groupedMilestones = useMemo(() => {
    const groups: Record<string, DevelopmentMilestone[]> = {};
    filteredMilestones.forEach(m => {
      const ageLabel = formatAge(m.expected_age_months);
      if (!groups[ageLabel]) groups[ageLabel] = [];
      groups[ageLabel].push(m);
    });
    return groups;
  }, [filteredMilestones]);

  // Calculate milestone statistics
  const milestoneStats = useMemo(() => {
    const achieved = milestones.filter(m => m.status === 'achieved').length;
    const delayed = milestones.filter(m => m.status === 'delayed').length;
    const pending = milestones.filter(m => m.status === 'pending').length;
    return { achieved, delayed, pending, total: milestones.length };
  }, [milestones]);

  // Calculate BMI when weight and height are entered
  const calculatedBMI = useMemo(() => {
    const weight = parseFloat(formData.weight_kg);
    const height = parseFloat(formData.height_cm);
    if (weight > 0 && height > 0) {
      return calculateBMI(weight, height);
    }
    return null;
  }, [formData.weight_kg, formData.height_cm]);

  const handleAddMeasurement = async () => {
    if (!onAddMeasurement) return;
    setSaving(true);
    try {
      const measurementDate = parseISO(formData.date);
      const ageMonths = differenceInMonths(measurementDate, parseISO(birthDate));
      
      await onAddMeasurement({
        date: formData.date,
        age_months: ageMonths,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
        head_circumference_cm: formData.head_circumference_cm ? parseFloat(formData.head_circumference_cm) : undefined,
        bmi: calculatedBMI || undefined,
        notes: formData.notes || undefined,
      });
      
      setShowAddDialog(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight_kg: '',
        height_cm: '',
        head_circumference_cm: '',
        notes: '',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMilestoneToggle = async (milestone: DevelopmentMilestone) => {
    if (!onUpdateMilestone || !isEditable) return;
    
    const newStatus = milestone.status === 'achieved' ? 'pending' : 'achieved';
    await onUpdateMilestone(milestone.id, {
      status: newStatus,
      achieved_at: newStatus === 'achieved' ? new Date().toISOString() : undefined,
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Crescimento e Desenvolvimento</CardTitle>
          </div>
          <Badge variant="outline" className="font-normal">
            {formatAge(currentAgeMonths)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crescimento" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Crescimento
            </TabsTrigger>
            <TabsTrigger value="desenvolvimento" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Desenvolvimento
            </TabsTrigger>
          </TabsList>

          {/* CRESCIMENTO TAB */}
          <TabsContent value="crescimento" className="space-y-4 mt-4">
            {/* Current Stats */}
            {latestMeasurement && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Weight */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Scale className="h-3 w-3" />
                    <span>Peso</span>
                    {getTrendIcon(latestMeasurement.weight_kg, previousMeasurement?.weight_kg)}
                  </div>
                  <div className="text-lg font-semibold">
                    {latestMeasurement.weight_kg ? `${latestMeasurement.weight_kg} kg` : '—'}
                  </div>
                  {latestMeasurement.weight_percentile !== undefined && (
                    <div className={`text-xs ${getPercentileColor(latestMeasurement.weight_percentile)}`}>
                      P{latestMeasurement.weight_percentile}
                    </div>
                  )}
                </div>

                {/* Height */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Ruler className="h-3 w-3" />
                    <span>Altura</span>
                    {getTrendIcon(latestMeasurement.height_cm, previousMeasurement?.height_cm)}
                  </div>
                  <div className="text-lg font-semibold">
                    {latestMeasurement.height_cm ? `${latestMeasurement.height_cm} cm` : '—'}
                  </div>
                  {latestMeasurement.height_percentile !== undefined && (
                    <div className={`text-xs ${getPercentileColor(latestMeasurement.height_percentile)}`}>
                      P{latestMeasurement.height_percentile}
                    </div>
                  )}
                </div>

                {/* Head Circumference */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Baby className="h-3 w-3" />
                    <span>PC</span>
                    {getTrendIcon(latestMeasurement.head_circumference_cm, previousMeasurement?.head_circumference_cm)}
                  </div>
                  <div className="text-lg font-semibold">
                    {latestMeasurement.head_circumference_cm ? `${latestMeasurement.head_circumference_cm} cm` : '—'}
                  </div>
                  {latestMeasurement.hc_percentile !== undefined && (
                    <div className={`text-xs ${getPercentileColor(latestMeasurement.hc_percentile)}`}>
                      P{latestMeasurement.hc_percentile}
                    </div>
                  )}
                </div>

                {/* BMI */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>IMC</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {latestMeasurement.bmi ? latestMeasurement.bmi.toFixed(1) : '—'}
                  </div>
                  {latestMeasurement.bmi_percentile !== undefined && (
                    <div className={`text-xs ${getPercentileColor(latestMeasurement.bmi_percentile)}`}>
                      P{latestMeasurement.bmi_percentile}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add Measurement Button */}
            {isEditable && onAddMeasurement && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Medidas
              </Button>
            )}

            {/* Measurement History */}
            {sortedMeasurements.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Histórico</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {sortedMeasurements.map((m, idx) => (
                      <div 
                        key={m.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${idx === 0 ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(m.date), 'dd/MM/yy', { locale: ptBR })}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatAge(m.age_months)}
                            </Badge>
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs">Peso</span>
                              <div className="font-medium">{m.weight_kg ? `${m.weight_kg}kg` : '—'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Altura</span>
                              <div className="font-medium">{m.height_cm ? `${m.height_cm}cm` : '—'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">PC</span>
                              <div className="font-medium">{m.head_circumference_cm ? `${m.head_circumference_cm}cm` : '—'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">IMC</span>
                              <div className="font-medium">{m.bmi ? m.bmi.toFixed(1) : '—'}</div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {sortedMeasurements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma medida registrada</p>
              </div>
            )}
          </TabsContent>

          {/* DESENVOLVIMENTO TAB */}
          <TabsContent value="desenvolvimento" className="space-y-4 mt-4">
            {/* Stats Summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {milestoneStats.achieved} alcançados
              </Badge>
              <Badge variant="outline" className="bg-yellow-50">
                <Clock className="h-3 w-3 mr-1" />
                {milestoneStats.pending} pendentes
              </Badge>
              {milestoneStats.delayed > 0 && (
                <Badge variant="outline" className="bg-red-50">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {milestoneStats.delayed} atrasados
                </Badge>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </Button>
              {(Object.entries(MILESTONE_CATEGORIES) as [MilestoneCategory, typeof MILESTONE_CATEGORIES[MilestoneCategory]][]).map(([key, config]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className="flex items-center gap-1"
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                </Button>
              ))}
            </div>

            {/* Milestones by Age */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-4 pr-4">
                {Object.entries(groupedMilestones).map(([ageLabel, ageMilestones]) => (
                  <div key={ageLabel} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{ageLabel}</Badge>
                      <Separator className="flex-1" />
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {ageMilestones.map((milestone) => {
                        const categoryConfig = MILESTONE_CATEGORIES[milestone.category];
                        const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status];
                        const isExpected = milestone.expected_age_months <= currentAgeMonths;
                        
                        return (
                          <div 
                            key={milestone.id}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              milestone.status === 'achieved' ? 'bg-green-50/50' : 
                              milestone.status === 'delayed' ? 'bg-red-50/50' : 
                              'hover:bg-muted/50'
                            }`}
                          >
                            {isEditable && onUpdateMilestone ? (
                              <Checkbox
                                checked={milestone.status === 'achieved'}
                                onCheckedChange={() => handleMilestoneToggle(milestone)}
                              />
                            ) : (
                              <div className={`p-1 rounded ${statusConfig.color}`}>
                                {statusConfig.icon}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${milestone.status === 'achieved' ? 'line-through text-muted-foreground' : ''}`}>
                                  {milestone.name}
                                </span>
                                <Badge variant="outline" className={`text-xs shrink-0 ${categoryConfig.color}`}>
                                  {categoryConfig.label}
                                </Badge>
                              </div>
                              {milestone.achieved_at && (
                                <div className="text-xs text-muted-foreground">
                                  Alcançado em {format(parseISO(milestone.achieved_at), 'dd/MM/yyyy', { locale: ptBR })}
                                </div>
                              )}
                            </div>
                            {isExpected && milestone.status === 'pending' && (
                              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {filteredMilestones.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum marco cadastrado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Add Measurement Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Registrar Medidas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="measurement-date">Data</Label>
              <Input
                id="measurement-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 10.5"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.0"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hc">Perímetro Cefálico (cm)</Label>
                <Input
                  id="hc"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 45.0"
                  value={formData.head_circumference_cm}
                  onChange={(e) => setFormData({ ...formData, head_circumference_cm: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>IMC (automático)</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center">
                  {calculatedBMI ? calculatedBMI.toFixed(1) : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMeasurement} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CrescimentoDesenvolvimentoBlock;
