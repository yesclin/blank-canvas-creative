/**
 * NUTRIÇÃO - Plano Alimentar
 * 
 * Bloco para visualização e criação de planos alimentares.
 * Exibe refeições, macros e orientações nutricionais.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Utensils, 
  Plus, 
  Calendar,
  Save,
  History,
  Target,
  Flame,
  FileText,
  X,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TIPO_REFEICAO_LABELS } from '@/hooks/prontuario/nutricao';
import type { PlanoAlimentar, PlanoAlimentarFormData, RefeicaoPlano, MacrosPlano, DEFAULT_REFEICOES } from '@/hooks/prontuario/nutricao';

interface PlanoAlimentarBlockProps {
  planos: PlanoAlimentar[];
  planoAtivo: PlanoAlimentar | null;
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: PlanoAlimentarFormData, status?: 'ativo' | 'rascunho') => Promise<unknown>;
  onDeactivate?: (planoId: string) => Promise<boolean>;
}

const defaultMacros: MacrosPlano = {
  calorias_totais_kcal: null,
  proteinas_g: null,
  proteinas_percent: null,
  carboidratos_g: null,
  carboidratos_percent: null,
  gorduras_g: null,
  gorduras_percent: null,
  fibras_g: null,
};

const defaultRefeicoes: RefeicaoPlano[] = [
  { id: '1', horario: '07:00', tipo: 'cafe_manha', opcoes: [] },
  { id: '2', horario: '10:00', tipo: 'lanche_manha', opcoes: [] },
  { id: '3', horario: '12:30', tipo: 'almoco', opcoes: [] },
  { id: '4', horario: '15:30', tipo: 'lanche_tarde', opcoes: [] },
  { id: '5', horario: '19:30', tipo: 'jantar', opcoes: [] },
  { id: '6', horario: '22:00', tipo: 'ceia', opcoes: [] },
];

const initialFormData: PlanoAlimentarFormData = {
  titulo: '',
  objetivo: null,
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: null,
  macros: defaultMacros,
  refeicoes: defaultRefeicoes,
  orientacoes: [],
  alimentos_evitar: [],
  alimentos_preferir: [],
  suplementos: [],
  observacoes: null,
};

export function PlanoAlimentarBlock({
  planos,
  planoAtivo,
  loading,
  saving,
  canEdit,
  onSave,
  onDeactivate,
}: PlanoAlimentarBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PlanoAlimentarFormData>(initialFormData);
  const [showHistory, setShowHistory] = useState(false);
  const [newOrientacao, setNewOrientacao] = useState('');
  const [newAlimentoEvitar, setNewAlimentoEvitar] = useState('');
  const [newAlimentoPreferir, setNewAlimentoPreferir] = useState('');
  const [newSuplemento, setNewSuplemento] = useState({ nome: '', dosagem: '', horario: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSave(formData, 'ativo');
    if (result) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof PlanoAlimentarFormData>(field: K, value: PlanoAlimentarFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMacro = (field: keyof MacrosPlano, value: number | null) => {
    setFormData(prev => ({
      ...prev,
      macros: { ...prev.macros, [field]: value },
    }));
  };

  const addOrientacao = () => {
    if (newOrientacao.trim()) {
      updateField('orientacoes', [...formData.orientacoes, newOrientacao.trim()]);
      setNewOrientacao('');
    }
  };

  const removeOrientacao = (index: number) => {
    updateField('orientacoes', formData.orientacoes.filter((_, i) => i !== index));
  };

  const addAlimentoEvitar = () => {
    if (newAlimentoEvitar.trim()) {
      updateField('alimentos_evitar', [...formData.alimentos_evitar, newAlimentoEvitar.trim()]);
      setNewAlimentoEvitar('');
    }
  };

  const removeAlimentoEvitar = (index: number) => {
    updateField('alimentos_evitar', formData.alimentos_evitar.filter((_, i) => i !== index));
  };

  const addAlimentoPreferir = () => {
    if (newAlimentoPreferir.trim()) {
      updateField('alimentos_preferir', [...formData.alimentos_preferir, newAlimentoPreferir.trim()]);
      setNewAlimentoPreferir('');
    }
  };

  const removeAlimentoPreferir = (index: number) => {
    updateField('alimentos_preferir', formData.alimentos_preferir.filter((_, i) => i !== index));
  };

  const updateRefeicaoDescricao = (refeicaoId: string, descricao: string) => {
    setFormData(prev => ({
      ...prev,
      refeicoes: prev.refeicoes.map(r => 
        r.id === refeicaoId 
          ? { ...r, opcoes: [{ ...r.opcoes[0], descricao }] }
          : r
      ),
    }));
  };

  const updateRefeicaoSubstituicao = (refeicaoId: string, substituicao: string) => {
    setFormData(prev => ({
      ...prev,
      refeicoes: prev.refeicoes.map(r => 
        r.id === refeicaoId 
          ? { ...r, opcoes: [{ ...r.opcoes[0], observacoes: substituicao }] }
          : r
      ),
    }));
  };

  const addSuplemento = () => {
    if (newSuplemento.nome.trim()) {
      const suplementoStr = `${newSuplemento.nome}${newSuplemento.dosagem ? ` - ${newSuplemento.dosagem}` : ''}${newSuplemento.horario ? ` (${newSuplemento.horario})` : ''}`;
      updateField('suplementos', [...formData.suplementos, suplementoStr]);
      setNewSuplemento({ nome: '', dosagem: '', horario: '' });
    }
  };

  const removeSuplemento = (index: number) => {
    updateField('suplementos', formData.suplementos.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Plano Alimentar</h2>
        </div>
        <div className="flex gap-2">
          {planos.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
          )}
          {canEdit && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && canEdit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Novo Plano Alimentar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identificação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="titulo">Título do Plano</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Plano de Reeducação Alimentar"
                    value={formData.titulo}
                    onChange={(e) => updateField('titulo', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => updateField('data_inicio', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="objetivo">Objetivo</Label>
                <Textarea
                  id="objetivo"
                  placeholder="Descreva o objetivo deste plano alimentar..."
                  value={formData.objetivo ?? ''}
                  onChange={(e) => updateField('objetivo', e.target.value || null)}
                  rows={2}
                />
              </div>

              {/* Macros */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-accent-foreground" />
                  Metas de Macronutrientes (diárias)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="calorias" className="text-xs text-muted-foreground">Calorias (kcal)</Label>
                    <Input
                      id="calorias"
                      type="number"
                      placeholder="Ex: 1800"
                      value={formData.macros.calorias_totais_kcal ?? ''}
                      onChange={(e) => updateMacro('calorias_totais_kcal', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proteinas" className="text-xs text-muted-foreground">Proteínas (g)</Label>
                    <Input
                      id="proteinas"
                      type="number"
                      placeholder="Ex: 120"
                      value={formData.macros.proteinas_g ?? ''}
                      onChange={(e) => updateMacro('proteinas_g', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="carboidratos" className="text-xs text-muted-foreground">Carboidratos (g)</Label>
                    <Input
                      id="carboidratos"
                      type="number"
                      placeholder="Ex: 200"
                      value={formData.macros.carboidratos_g ?? ''}
                      onChange={(e) => updateMacro('carboidratos_g', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gorduras" className="text-xs text-muted-foreground">Gorduras (g)</Label>
                    <Input
                      id="gorduras"
                      type="number"
                      placeholder="Ex: 60"
                      value={formData.macros.gorduras_g ?? ''}
                      onChange={(e) => updateMacro('gorduras_g', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Refeições */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  Refeições
                </Label>
                <div className="space-y-4">
                  {formData.refeicoes.map((refeicao) => (
                    <div key={refeicao.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex gap-3 items-start">
                        <div className="w-24 shrink-0">
                          <Input
                            type="time"
                            value={refeicao.horario}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                refeicoes: prev.refeicoes.map(r =>
                                  r.id === refeicao.id ? { ...r, horario: e.target.value } : r
                                ),
                              }));
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">{TIPO_REFEICAO_LABELS[refeicao.tipo]}</Label>
                          <Textarea
                            placeholder="Descreva os alimentos desta refeição..."
                            value={refeicao.opcoes[0]?.descricao ?? ''}
                            onChange={(e) => updateRefeicaoDescricao(refeicao.id, e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="pl-[104px]">
                        <Input
                          placeholder="Substituições possíveis (ex: trocar pão por tapioca, banana por maçã...)"
                          value={refeicao.opcoes[0]?.observacoes ?? ''}
                          onChange={(e) => updateRefeicaoSubstituicao(refeicao.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orientações */}
              <div>
                <Label className="mb-2">Orientações Gerais</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Adicionar orientação..."
                    value={newOrientacao}
                    onChange={(e) => setNewOrientacao(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrientacao())}
                  />
                  <Button type="button" variant="outline" onClick={addOrientacao}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.orientacoes.map((orientacao, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {orientacao}
                      <button
                        type="button"
                        onClick={() => removeOrientacao(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Alimentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 text-destructive">Alimentos a Evitar</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Adicionar alimento..."
                      value={newAlimentoEvitar}
                      onChange={(e) => setNewAlimentoEvitar(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlimentoEvitar())}
                    />
                    <Button type="button" variant="outline" onClick={addAlimentoEvitar}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.alimentos_evitar.map((alimento, index) => (
                      <Badge key={index} variant="destructive" className="pr-1">
                        {alimento}
                        <button
                          type="button"
                          onClick={() => removeAlimentoEvitar(index)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 text-primary">Alimentos a Preferir</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Adicionar alimento..."
                      value={newAlimentoPreferir}
                      onChange={(e) => setNewAlimentoPreferir(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlimentoPreferir())}
                    />
                    <Button type="button" variant="outline" onClick={addAlimentoPreferir}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.alimentos_preferir.map((alimento, index) => (
                      <Badge key={index} className="bg-primary/20 text-primary pr-1">
                        {alimento}
                        <button
                          type="button"
                          onClick={() => removeAlimentoPreferir(index)}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suplementação */}
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <span className="text-primary">💊</span>
                  Suplementação (se houver)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <Input
                    placeholder="Suplemento"
                    value={newSuplemento.nome}
                    onChange={(e) => setNewSuplemento(prev => ({ ...prev, nome: e.target.value }))}
                  />
                  <Input
                    placeholder="Dosagem (ex: 1000mg)"
                    value={newSuplemento.dosagem}
                    onChange={(e) => setNewSuplemento(prev => ({ ...prev, dosagem: e.target.value }))}
                  />
                  <Input
                    placeholder="Horário (ex: após almoço)"
                    value={newSuplemento.horario}
                    onChange={(e) => setNewSuplemento(prev => ({ ...prev, horario: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={addSuplemento}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {formData.suplementos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.suplementos.map((suplemento, index) => (
                      <Badge key={index} variant="outline" className="pr-1 bg-primary/10">
                        {suplemento}
                        <button
                          type="button"
                          onClick={() => removeSuplemento(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações do Nutricionista</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações, recomendações e orientações adicionais..."
                  value={formData.observacoes ?? ''}
                  onChange={(e) => updateField('observacoes', e.target.value || null)}
                  rows={3}
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !formData.titulo}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Plano'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plano Ativo */}
      {planoAtivo && !showForm && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="default" className="mb-2">Plano Ativo</Badge>
                <CardTitle className="text-base">{planoAtivo.titulo}</CardTitle>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Início: {format(new Date(planoAtivo.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Objetivo */}
            {planoAtivo.objetivo && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Objetivo
                </p>
                <p className="text-sm text-muted-foreground mt-1">{planoAtivo.objetivo}</p>
              </div>
            )}

            {/* Macros */}
            {planoAtivo.macros.calorias_totais_kcal && (
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-accent/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Calorias</p>
                  <p className="font-semibold text-accent-foreground">{planoAtivo.macros.calorias_totais_kcal} kcal</p>
                </div>
                {planoAtivo.macros.proteinas_g && (
                  <div className="p-3 bg-destructive/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Proteínas</p>
                    <p className="font-semibold text-destructive">{planoAtivo.macros.proteinas_g}g</p>
                  </div>
                )}
                {planoAtivo.macros.carboidratos_g && (
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Carboidratos</p>
                    <p className="font-semibold text-primary">{planoAtivo.macros.carboidratos_g}g</p>
                  </div>
                )}
                {planoAtivo.macros.gorduras_g && (
                  <div className="p-3 bg-secondary rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Gorduras</p>
                    <p className="font-semibold text-secondary-foreground">{planoAtivo.macros.gorduras_g}g</p>
                  </div>
                )}
              </div>
            )}

            {/* Refeições */}
            <div>
              <p className="text-sm font-medium mb-2">Refeições</p>
              <div className="space-y-2">
                {planoAtivo.refeicoes.filter(r => r.opcoes.length > 0 && r.opcoes[0].descricao).map((refeicao) => (
                  <div key={refeicao.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex gap-3">
                      <div className="text-sm font-medium text-muted-foreground w-16">
                        {refeicao.horario}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{TIPO_REFEICAO_LABELS[refeicao.tipo]}</p>
                        <p className="text-sm">{refeicao.opcoes[0]?.descricao}</p>
                        {refeicao.opcoes[0]?.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            ↔ Substituições: {refeicao.opcoes[0].observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orientações */}
            {planoAtivo.orientacoes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Orientações</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {planoAtivo.orientacoes.map((orientacao, index) => (
                    <li key={index}>{orientacao}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alimentos */}
            <div className="grid grid-cols-2 gap-4">
              {planoAtivo.alimentos_evitar.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-destructive mb-2">Evitar</p>
                  <div className="flex flex-wrap gap-1">
                    {planoAtivo.alimentos_evitar.map((alimento, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {alimento}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {planoAtivo.alimentos_preferir.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-primary mb-2">Preferir</p>
                  <div className="flex flex-wrap gap-1">
                    {planoAtivo.alimentos_preferir.map((alimento, index) => (
                      <Badge key={index} variant="outline" className="bg-primary/10 text-primary text-xs">
                        {alimento}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suplementos */}
            {planoAtivo.suplementos && planoAtivo.suplementos.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">💊 Suplementação</p>
                <div className="flex flex-wrap gap-2">
                  {planoAtivo.suplementos.map((suplemento, index) => (
                    <Badge key={index} variant="outline" className="bg-secondary">
                      {suplemento}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {planoAtivo.observacoes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Observações do Nutricionista</p>
                <p className="text-sm text-muted-foreground">{planoAtivo.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!planoAtivo && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum plano alimentar ativo.</p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
