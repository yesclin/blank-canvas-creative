import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Pill, 
  Plus, 
  FileDown,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  Prescricao, 
  TipoReceita, 
  StatusPrescricao,
  ViaAdministracao,
  NewPrescricaoItem,
} from '@/hooks/prontuario/clinica-geral/usePrescricoesData';
import { generatePrescricaoPDF } from '@/lib/prescricaoPdfExport';

export type { Prescricao, TipoReceita, StatusPrescricao, ViaAdministracao };

interface PrescricoesBlockProps {
  prescricoes: Prescricao[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  patientName?: string;
  clinicName?: string;
  clinicAddress?: string;
  onSave: (data: {
    tipo_receita: TipoReceita;
    observacoes?: string;
    validade_dias?: number;
    itens: NewPrescricaoItem[];
  }) => Promise<string | null>;
  onSign: (prescricaoId: string) => Promise<void>;
}

const tipoReceitaConfig: Record<TipoReceita, { label: string; color: string }> = {
  simples: { label: 'Receita Simples', color: 'bg-blue-100 text-blue-800' },
  controle_especial: { label: 'Controle Especial', color: 'bg-yellow-100 text-yellow-800' },
  antimicrobiano: { label: 'Antimicrobiano', color: 'bg-orange-100 text-orange-800' },
  entorpecente: { label: 'Entorpecente', color: 'bg-red-100 text-red-800' },
};

const statusConfig: Record<StatusPrescricao, { label: string; icon: React.ReactNode }> = {
  rascunho: { label: 'Rascunho', icon: <Clock className="h-3 w-3" /> },
  assinada: { label: 'Assinada', icon: <CheckCircle2 className="h-3 w-3" /> },
  enviada: { label: 'Enviada', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelada: { label: 'Cancelada', icon: <AlertTriangle className="h-3 w-3" /> },
};

const viaAdministracaoLabels: Record<ViaAdministracao, string> = {
  oral: 'Via Oral',
  topica: 'Uso Tópico',
  injetavel: 'Injetável',
  inalatoria: 'Inalatória',
  sublingual: 'Sublingual',
  retal: 'Retal',
  oftalmico: 'Oftálmico',
  nasal: 'Nasal',
  otologico: 'Otológico',
  transdermico: 'Transdérmico',
  outra: 'Outra',
};

const emptyItem: NewPrescricaoItem = {
  medicamento_nome: '',
  medicamento_principio_ativo: '',
  medicamento_concentracao: '',
  medicamento_forma_farmaceutica: '',
  dose: '',
  unidade_dose: '',
  posologia: '',
  frequencia: '',
  duracao_dias: undefined,
  via_administracao: 'oral',
  instrucoes_especiais: '',
  uso_continuo: false,
};

export function PrescricoesBlock({
  prescricoes,
  loading,
  saving,
  canEdit,
  patientName,
  clinicName,
  clinicAddress,
  onSave,
  onSign,
}: PrescricoesBlockProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoReceita, setTipoReceita] = useState<TipoReceita>('simples');
  const [observacoes, setObservacoes] = useState('');
  const [validadeDias, setValidadeDias] = useState(30);
  const [itens, setItens] = useState<NewPrescricaoItem[]>([{ ...emptyItem }]);

  const handleAddItem = () => {
    setItens(prev => [...prev, { ...emptyItem }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof NewPrescricaoItem, value: unknown) => {
    setItens(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    const validItens = itens.filter(item => 
      item.medicamento_nome.trim() && item.dose.trim() && item.posologia.trim()
    );

    if (validItens.length === 0) {
      return;
    }

    const prescricaoId = await onSave({
      tipo_receita: tipoReceita,
      observacoes: observacoes || undefined,
      validade_dias: validadeDias,
      itens: validItens,
    });

    if (prescricaoId) {
      setDialogOpen(false);
      setTipoReceita('simples');
      setObservacoes('');
      setValidadeDias(30);
      setItens([{ ...emptyItem }]);
    }
  };

  const handleExportPDF = (prescricao: Prescricao) => {
    generatePrescricaoPDF(prescricao, {
      patientName,
      clinicName,
      clinicAddress,
    });
  };

  const handleDuplicatePrescricao = (prescricao: Prescricao) => {
    setTipoReceita(prescricao.tipo_receita);
    setObservacoes(prescricao.observacoes || '');
    setValidadeDias(prescricao.validade_dias);
    setItens(prescricao.itens.map(item => ({
      medicamento_nome: item.medicamento_nome,
      medicamento_principio_ativo: item.medicamento_principio_ativo || '',
      medicamento_concentracao: item.medicamento_concentracao || '',
      medicamento_forma_farmaceutica: item.medicamento_forma_farmaceutica || '',
      dose: item.dose,
      unidade_dose: item.unidade_dose || '',
      posologia: item.posologia,
      frequencia: item.frequencia || '',
      duracao_dias: item.duracao_dias || undefined,
      via_administracao: item.via_administracao,
      instrucoes_especiais: item.instrucoes_especiais || '',
      uso_continuo: item.uso_continuo,
    })));
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            Prescrições
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Prescrição
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {prescricoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma prescrição registrada</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Accordion type="single" collapsible className="space-y-2">
                {prescricoes.map((prescricao) => (
                  <AccordionItem 
                    key={prescricao.id} 
                    value={prescricao.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left flex-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={tipoReceitaConfig[prescricao.tipo_receita].color}>
                              {tipoReceitaConfig[prescricao.tipo_receita].label}
                            </Badge>
                            <Badge variant={prescricao.status === 'assinada' ? 'default' : 'secondary'}>
                              {statusConfig[prescricao.status].icon}
                              <span className="ml-1">{statusConfig[prescricao.status].label}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {prescricao.itens.length} {prescricao.itens.length === 1 ? 'medicamento' : 'medicamentos'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(prescricao.data_prescricao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {' • '}{prescricao.profissional_nome}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4">
                        {/* Medication list */}
                        <div className="space-y-3">
                          {prescricao.itens.map((item, idx) => (
                            <div 
                              key={item.id} 
                              className="bg-muted/50 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {idx + 1}
                                    </span>
                                    <span className="font-semibold">
                                      {item.medicamento_nome}
                                    </span>
                                    {item.medicamento_concentracao && (
                                      <span className="text-muted-foreground">
                                        {item.medicamento_concentracao}
                                      </span>
                                    )}
                                    {item.uso_continuo && (
                                      <Badge variant="outline" className="text-xs">
                                        Uso Contínuo
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-2">
                                    <div>
                                      <span className="text-muted-foreground">Dose: </span>
                                      <span className="font-medium">
                                        {item.dose} {item.unidade_dose}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Posologia: </span>
                                      <span className="font-medium">{item.posologia}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Via: </span>
                                      <span className="font-medium">
                                        {viaAdministracaoLabels[item.via_administracao]}
                                      </span>
                                    </div>
                                  </div>

                                  {item.frequencia && (
                                    <div className="text-sm mt-1">
                                      <span className="text-muted-foreground">Frequência: </span>
                                      <span>{item.frequencia}</span>
                                    </div>
                                  )}

                                  {item.duracao_dias && (
                                    <div className="text-sm mt-1">
                                      <span className="text-muted-foreground">Duração: </span>
                                      <span>{item.duracao_dias} dias</span>
                                    </div>
                                  )}

                                  {item.instrucoes_especiais && (
                                    <div className="text-sm mt-2 text-muted-foreground italic">
                                      {item.instrucoes_especiais}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {prescricao.observacoes && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Observações: </span>
                            {prescricao.observacoes}
                          </div>
                        )}

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportPDF(prescricao)}
                          >
                            <FileDown className="h-4 w-4 mr-1" />
                            Exportar PDF
                          </Button>

                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicatePrescricao(prescricao)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Duplicar
                            </Button>
                          )}

                          {canEdit && prescricao.status === 'rascunho' && (
                            <Button
                              size="sm"
                              onClick={() => onSign(prescricao.id)}
                              disabled={saving}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Assinar
                            </Button>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
          {/* Disclaimer - always visible, cannot be hidden */}
          <div className="mt-4 p-3 bg-muted/60 border border-border rounded-md">
            <p className="text-xs text-muted-foreground text-center italic">
              As informações exibidas são apenas auxiliares. A prescrição é de responsabilidade exclusiva do profissional de saúde.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New Prescription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Nova Prescrição
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Prescription Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Receita</Label>
                <Select value={tipoReceita} onValueChange={(v) => setTipoReceita(v as TipoReceita)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Receita Simples</SelectItem>
                    <SelectItem value="controle_especial">Controle Especial</SelectItem>
                    <SelectItem value="antimicrobiano">Antimicrobiano</SelectItem>
                    <SelectItem value="entorpecente">Entorpecente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validade (dias)</Label>
                <Input
                  type="number"
                  value={validadeDias}
                  onChange={(e) => setValidadeDias(parseInt(e.target.value) || 30)}
                  min={1}
                  max={365}
                />
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Medicamentos</Label>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {itens.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline">Medicamento {index + 1}</Badge>
                    {itens.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nome do Medicamento *</Label>
                      <Input
                        placeholder="Ex: Amoxicilina"
                        value={item.medicamento_nome}
                        onChange={(e) => handleItemChange(index, 'medicamento_nome', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Princípio Ativo</Label>
                      <Input
                        placeholder="Ex: Amoxicilina tri-hidratada"
                        value={item.medicamento_principio_ativo || ''}
                        onChange={(e) => handleItemChange(index, 'medicamento_principio_ativo', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Concentração</Label>
                      <Input
                        placeholder="Ex: 500mg"
                        value={item.medicamento_concentracao || ''}
                        onChange={(e) => handleItemChange(index, 'medicamento_concentracao', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Forma Farmacêutica</Label>
                      <Input
                        placeholder="Ex: Cápsula, Comprimido, Suspensão"
                        value={item.medicamento_forma_farmaceutica || ''}
                        onChange={(e) => handleItemChange(index, 'medicamento_forma_farmaceutica', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Via de Administração</Label>
                      <Select 
                        value={item.via_administracao || 'oral'}
                        onValueChange={(v) => handleItemChange(index, 'via_administracao', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(viaAdministracaoLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dose *</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: 1"
                          value={item.dose}
                          onChange={(e) => handleItemChange(index, 'dose', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="unidade"
                          value={item.unidade_dose || ''}
                          onChange={(e) => handleItemChange(index, 'unidade_dose', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Input
                        placeholder="Ex: 8 em 8 horas"
                        value={item.frequencia || ''}
                        onChange={(e) => handleItemChange(index, 'frequencia', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Posologia *</Label>
                      <Textarea
                        placeholder="Ex: Tomar 1 cápsula de 8 em 8 horas por 7 dias"
                        value={item.posologia}
                        onChange={(e) => handleItemChange(index, 'posologia', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Duração (dias)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 7"
                        value={item.duracao_dias || ''}
                        onChange={(e) => handleItemChange(index, 'duracao_dias', parseInt(e.target.value) || undefined)}
                        min={1}
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id={`uso-continuo-${index}`}
                        checked={item.uso_continuo || false}
                        onCheckedChange={(checked) => handleItemChange(index, 'uso_continuo', checked)}
                      />
                      <Label htmlFor={`uso-continuo-${index}`} className="cursor-pointer">
                        Uso Contínuo
                      </Label>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Instruções Especiais</Label>
                      <Textarea
                        placeholder="Ex: Tomar após as refeições. Evitar exposição solar."
                        value={item.instrucoes_especiais || ''}
                        onChange={(e) => handleItemChange(index, 'instrucoes_especiais', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* General Observations */}
            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea
                placeholder="Observações adicionais para a prescrição..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Disclaimer - always visible in dialog */}
          <div className="p-3 bg-muted/60 border border-border rounded-md">
            <p className="text-xs text-muted-foreground text-center italic">
              As informações exibidas são apenas auxiliares. A prescrição é de responsabilidade exclusiva do profissional de saúde.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving || itens.every(i => !i.medicamento_nome.trim() || !i.dose.trim() || !i.posologia.trim())}
            >
              {saving ? 'Salvando...' : 'Criar Prescrição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
