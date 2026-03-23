import { useState, useEffect } from 'react';
import { Plus, FileText, Copy, Trash2, Edit, Star, Power, PowerOff, ChevronDown, Filter, Download, Syringe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTemplates, useDefaultTemplates, type Template, type TemplateType } from '@/hooks/prontuario';
import { TemplateDialog } from './TemplateDialog';
import { Link } from 'react-router-dom';

const TYPES: { value: TemplateType; label: string; category?: string }[] = [
  // General
  { value: 'anamnese', label: 'Anamnese', category: 'Geral' },
  { value: 'vital_signs', label: 'Sinais Vitais', category: 'Geral' },
  { value: 'evolution', label: 'Evolução', category: 'Geral' },
  { value: 'diagnosis', label: 'Diagnóstico (CID)', category: 'Geral' },
  { value: 'exam_request', label: 'Solicitação de Exames', category: 'Geral' },
  { value: 'conduct', label: 'Plano/Conduta', category: 'Geral' },
  { value: 'procedure', label: 'Procedimento', category: 'Geral' },
  { value: 'prescription', label: 'Prescrição', category: 'Geral' },
  // Dentistry
  { value: 'odontogram', label: 'Odontograma', category: 'Odontologia' },
  { value: 'tooth_procedure', label: 'Procedimento por Dente', category: 'Odontologia' },
  { value: 'dental_session', label: 'Sessão Odontológica', category: 'Odontologia' },
  // Psychology
  { value: 'session_record', label: 'Registro de Sessão', category: 'Psicologia' },
  { value: 'therapeutic_goals', label: 'Objetivos Terapêuticos', category: 'Psicologia' },
  { value: 'therapeutic_plan', label: 'Plano Terapêutico', category: 'Psicologia' },
  // Psychiatry
  { value: 'diagnosis_dsm', label: 'Diagnóstico (CID/DSM)', category: 'Psiquiatria' },
  { value: 'psychiatric_prescription', label: 'Prescrição Medicamentosa', category: 'Psiquiatria' },
  { value: 'symptom_evolution', label: 'Evolução de Sintomas', category: 'Psiquiatria' },
  { value: 'medication_history', label: 'Histórico de Medicamentos', category: 'Psiquiatria' },
  // Nutrition
  { value: 'nutritional_assessment', label: 'Avaliação Nutricional', category: 'Nutrição' },
  { value: 'body_measurements', label: 'Medidas Corporais', category: 'Nutrição' },
  { value: 'meal_plan', label: 'Plano Alimentar', category: 'Nutrição' },
  { value: 'nutritional_evolution', label: 'Evolução Nutricional', category: 'Nutrição' },
  // Aesthetics
  { value: 'aesthetic_assessment', label: 'Avaliação Estética', category: 'Estética' },
  { value: 'aesthetic_procedure', label: 'Procedimento Realizado', category: 'Estética' },
  { value: 'products_used', label: 'Produtos Utilizados', category: 'Estética' },
  { value: 'before_after_photos', label: 'Fotos Antes/Depois', category: 'Estética' },
  { value: 'consent_form', label: 'Termo de Consentimento', category: 'Estética' },
  // Physiotherapy
  { value: 'functional_assessment', label: 'Avaliação Funcional', category: 'Fisioterapia' },
  { value: 'chief_complaint', label: 'Queixa Principal', category: 'Fisioterapia' },
  { value: 'pain_scale', label: 'Escala de Dor', category: 'Fisioterapia' },
  { value: 'range_of_motion', label: 'Amplitude de Movimento', category: 'Fisioterapia' },
  { value: 'physio_therapeutic_plan', label: 'Plano Terapêutico', category: 'Fisioterapia' },
  { value: 'applied_exercises', label: 'Exercícios Aplicados', category: 'Fisioterapia' },
  { value: 'session_evolution', label: 'Evolução por Sessão', category: 'Fisioterapia' },
  // Pediatrics
  { value: 'pediatric_anamnesis', label: 'Anamnese Pediátrica', category: 'Pediatria' },
  { value: 'gestational_history', label: 'Histórico Gestacional', category: 'Pediatria' },
  { value: 'growth_data', label: 'Dados de Crescimento', category: 'Pediatria' },
  { value: 'growth_curve', label: 'Curva de Crescimento', category: 'Pediatria' },
  { value: 'neuropsychomotor_development', label: 'Desenvolvimento DNPM', category: 'Pediatria' },
  { value: 'vaccines', label: 'Vacinas', category: 'Pediatria' },
  { value: 'pediatric_diagnosis', label: 'Diagnóstico', category: 'Pediatria' },
  { value: 'pediatric_conduct', label: 'Conduta/Orientações', category: 'Pediatria' },
  { value: 'pediatric_evolution', label: 'Evolução Clínica', category: 'Pediatria' },
  // Gynecology
  { value: 'gyneco_anamnesis', label: 'Anamnese Ginecológica', category: 'Ginecologia' },
  { value: 'gyneco_data', label: 'Dados Ginecológicos', category: 'Ginecologia' },
  { value: 'obstetric_history', label: 'Histórico Obstétrico (G/P/A)', category: 'Ginecologia' },
  { value: 'gyneco_exam', label: 'Exame Ginecológico', category: 'Ginecologia' },
  { value: 'gyneco_exams_results', label: 'Exames/Resultados', category: 'Ginecologia' },
  { value: 'gyneco_diagnosis', label: 'Diagnóstico', category: 'Ginecologia' },
  { value: 'gyneco_conduct', label: 'Conduta/Prescrição', category: 'Ginecologia' },
  { value: 'gyneco_evolution', label: 'Evolução Clínica', category: 'Ginecologia' },
  // Ophthalmology
  { value: 'ophthalmo_anamnesis', label: 'Anamnese Oftalmológica', category: 'Oftalmologia' },
  { value: 'visual_acuity', label: 'Acuidade Visual (OD/OE)', category: 'Oftalmologia' },
  { value: 'ophthalmo_exam', label: 'Exame Oftalmológico', category: 'Oftalmologia' },
  { value: 'intraocular_pressure', label: 'Pressão Intraocular (OD/OE)', category: 'Oftalmologia' },
  { value: 'ophthalmo_diagnosis', label: 'Diagnóstico (OD/OE)', category: 'Oftalmologia' },
  { value: 'ophthalmo_complementary_exams', label: 'Exames Complementares', category: 'Oftalmologia' },
  { value: 'ophthalmo_conduct', label: 'Conduta/Prescrição', category: 'Oftalmologia' },
  { value: 'ophthalmo_evolution', label: 'Evolução Clínica', category: 'Oftalmologia' },
  // Cardiology
  { value: 'cardio_anamnesis', label: 'Anamnese Cardiológica', category: 'Cardiologia' },
  { value: 'cardio_vital_signs', label: 'Sinais Vitais Cardiológicos', category: 'Cardiologia' },
  { value: 'cardio_risk_factors', label: 'Fatores de Risco CV', category: 'Cardiologia' },
  { value: 'cardio_exams', label: 'Exames Cardiológicos', category: 'Cardiologia' },
  { value: 'cardio_diagnosis', label: 'Diagnóstico Cardiológico', category: 'Cardiologia' },
  { value: 'cardio_conduct', label: 'Conduta Cardiológica', category: 'Cardiologia' },
  { value: 'cardio_evolution', label: 'Evolução Cardiológica', category: 'Cardiologia' },
  // Custom / Personalized
  { value: 'custom_block', label: 'Bloco Personalizado', category: 'Personalizado' },
  { value: 'custom_form', label: 'Formulário Personalizado', category: 'Personalizado' },
  { value: 'custom_checklist', label: 'Checklist Personalizado', category: 'Personalizado' },
  { value: 'custom_notes', label: 'Anotações Personalizadas', category: 'Personalizado' },
];

const TYPE_COLORS: Record<TemplateType, string> = {
  anamnese: 'bg-blue-100 text-blue-800',
  vital_signs: 'bg-red-100 text-red-800',
  evolution: 'bg-green-100 text-green-800',
  diagnosis: 'bg-purple-100 text-purple-800',
  exam_request: 'bg-cyan-100 text-cyan-800',
  conduct: 'bg-amber-100 text-amber-800',
  procedure: 'bg-orange-100 text-orange-800',
  prescription: 'bg-pink-100 text-pink-800',
  odontogram: 'bg-teal-100 text-teal-800',
  tooth_procedure: 'bg-indigo-100 text-indigo-800',
  dental_session: 'bg-emerald-100 text-emerald-800',
  // Psychology
  session_record: 'bg-violet-100 text-violet-800',
  therapeutic_goals: 'bg-fuchsia-100 text-fuchsia-800',
  therapeutic_plan: 'bg-rose-100 text-rose-800',
  // Psychiatry
  diagnosis_dsm: 'bg-purple-100 text-purple-800',
  psychiatric_prescription: 'bg-pink-100 text-pink-800',
  symptom_evolution: 'bg-sky-100 text-sky-800',
  medication_history: 'bg-slate-100 text-slate-800',
  // Nutrition
  nutritional_assessment: 'bg-lime-100 text-lime-800',
  body_measurements: 'bg-orange-100 text-orange-800',
  meal_plan: 'bg-green-100 text-green-800',
  nutritional_evolution: 'bg-emerald-100 text-emerald-800',
  // Aesthetics
  aesthetic_assessment: 'bg-pink-100 text-pink-800',
  aesthetic_procedure: 'bg-fuchsia-100 text-fuchsia-800',
  products_used: 'bg-amber-100 text-amber-800',
  before_after_photos: 'bg-violet-100 text-violet-800',
  consent_form: 'bg-slate-100 text-slate-800',
  // Physiotherapy
  functional_assessment: 'bg-blue-100 text-blue-800',
  chief_complaint: 'bg-yellow-100 text-yellow-800',
  pain_scale: 'bg-red-100 text-red-800',
  range_of_motion: 'bg-cyan-100 text-cyan-800',
  physio_therapeutic_plan: 'bg-indigo-100 text-indigo-800',
  applied_exercises: 'bg-green-100 text-green-800',
  session_evolution: 'bg-teal-100 text-teal-800',
  // Pediatrics
  pediatric_anamnesis: 'bg-sky-100 text-sky-800',
  gestational_history: 'bg-pink-100 text-pink-800',
  growth_data: 'bg-emerald-100 text-emerald-800',
  growth_curve: 'bg-lime-100 text-lime-800',
  neuropsychomotor_development: 'bg-violet-100 text-violet-800',
  vaccines: 'bg-amber-100 text-amber-800',
  pediatric_diagnosis: 'bg-purple-100 text-purple-800',
  pediatric_conduct: 'bg-orange-100 text-orange-800',
  pediatric_evolution: 'bg-teal-100 text-teal-800',
  // Gynecology
  gyneco_anamnesis: 'bg-rose-100 text-rose-800',
  gyneco_data: 'bg-pink-100 text-pink-800',
  obstetric_history: 'bg-fuchsia-100 text-fuchsia-800',
  gyneco_exam: 'bg-purple-100 text-purple-800',
  gyneco_exams_results: 'bg-cyan-100 text-cyan-800',
  gyneco_diagnosis: 'bg-violet-100 text-violet-800',
  gyneco_conduct: 'bg-amber-100 text-amber-800',
  gyneco_evolution: 'bg-teal-100 text-teal-800',
  // Ophthalmology
  ophthalmo_anamnesis: 'bg-sky-100 text-sky-800',
  visual_acuity: 'bg-blue-100 text-blue-800',
  ophthalmo_exam: 'bg-indigo-100 text-indigo-800',
  intraocular_pressure: 'bg-cyan-100 text-cyan-800',
  ophthalmo_diagnosis: 'bg-purple-100 text-purple-800',
  ophthalmo_complementary_exams: 'bg-teal-100 text-teal-800',
  ophthalmo_conduct: 'bg-amber-100 text-amber-800',
  ophthalmo_evolution: 'bg-green-100 text-green-800',
  // Cardiology
  cardio_anamnesis: 'bg-red-100 text-red-800',
  cardio_vital_signs: 'bg-rose-100 text-rose-800',
  cardio_risk_factors: 'bg-orange-100 text-orange-800',
  cardio_exams: 'bg-amber-100 text-amber-800',
  cardio_diagnosis: 'bg-purple-100 text-purple-800',
  cardio_conduct: 'bg-indigo-100 text-indigo-800',
  cardio_evolution: 'bg-teal-100 text-teal-800',
  // Custom / Personalized
  custom_block: 'bg-gray-100 text-gray-800',
  custom_form: 'bg-slate-100 text-slate-800',
  custom_checklist: 'bg-zinc-100 text-zinc-800',
  custom_notes: 'bg-stone-100 text-stone-800',
};

export function TemplatesSection({ specialtyId }: { specialtyId?: string | null }) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [availableCount, setAvailableCount] = useState(0);

  const { templates, loading, saving, fetchTemplates, remove, duplicate, toggleActive } = useTemplates(
    typeFilter !== 'all' ? (typeFilter as TemplateType) : undefined
  );
  const { importing, importDefaultTemplates, getAvailableTemplateCount, totalDefaultTemplates } = useDefaultTemplates();

  useEffect(() => {
    getAvailableTemplateCount().then(setAvailableCount);
  }, [getAvailableTemplateCount, templates.length]);

  const handleImport = async () => {
    const success = await importDefaultTemplates();
    if (success) {
      await fetchTemplates();
    }
  };

  const handleEdit = (t: Template) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (toDelete) {
      await remove(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Modelos de Prontuário
              </CardTitle>
              <CardDescription>Crie modelos de anamnese, evolução e outros</CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {availableCount > 0 && (
                <Button variant="outline" onClick={handleImport} disabled={importing}>
                  <Download className="h-4 w-4 mr-2" />
                  {importing ? 'Importando...' : `Importar Padrão (${availableCount}/${totalDefaultTemplates})`}
                </Button>
              )}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link para Modelos de Anamnese Estética */}
          <Link to="/app/config/modelos-anamnese">
            <Card className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Syringe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Modelos de Anamnese Estética</p>
                  <p className="text-sm text-muted-foreground">
                    Gerencie modelos de anamnese para procedimentos estéticos (Toxina, Preenchimento, Bioestimuladores)
                  </p>
                </div>
                <Badge variant="secondary">Configurável</Badge>
              </CardContent>
            </Card>
          </Link>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum modelo encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div
                  key={t.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    !t.is_active ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{t.name}</span>
                      <Badge className={TYPE_COLORS[t.type]}>{TYPES.find(x => x.value === t.type)?.label}</Badge>
                      {t.is_default && <Badge variant="outline"><Star className="h-3 w-3 mr-1" />Padrão</Badge>}
                      {t.is_system && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Sistema</Badge>}
                      {!t.is_active && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{t.fields_count || 0} campos</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">Ações<ChevronDown className="h-4 w-4 ml-2" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(t)}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(t.id)} disabled={saving}>
                        <Copy className="h-4 w-4 mr-2" />Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(t.id, !t.is_active)} disabled={saving}>
                        {t.is_active ? <><PowerOff className="h-4 w-4 mr-2" />Desativar</> : <><Power className="h-4 w-4 mr-2" />Ativar</>}
                      </DropdownMenuItem>
                      {!t.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setToDelete(t); setDeleteOpen(true); }} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} template={editing} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
