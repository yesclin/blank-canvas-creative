/**
 * NewAnamnesisModelDialog — Construtor avançado de modelos de anamnese
 * 
 * 6 blocos: Tipo, Estrutura Inicial, Componentes, Vínculo, Configurações, Criação
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ClipboardList, Stethoscope, Syringe, Camera, FileUp, PenTool,
  Settings2, Sparkles, Scale, Layers, FileText, Eraser,
} from 'lucide-react';

// ===== TYPES =====

type ModeloTipo = 
  | 'clinica_tradicional'
  | 'estetica'
  | 'odontologica'
  | 'nutricional'
  | 'psicologia'
  | 'pediatria'
  | 'personalizado';

interface StructureBlock {
  id: string;
  title: string;
  defaultFields: Array<{ label: string; type: string; required?: boolean }>;
}

interface NewAnamnesisModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialtyId: string | null;
  procedures: Array<{ id: string; name: string }>;
  saving: boolean;
  onCreateModel: (config: CreateModelConfig) => Promise<void>;
}

export interface CreateModelConfig {
  name: string;
  description: string;
  tipo: ModeloTipo;
  selectedBlocks: string[];
  components: {
    registroFotografico: boolean;
    uploadExames: boolean;
    assinaturaDigital: boolean;
    camposCondicionais: boolean;
    escalasClinicas: boolean;
  };
  procedureId: string | null;
  settings: {
    ativo: boolean;
    padrao: boolean;
    editavelAposFinalizar: boolean;
    preenchimentoObrigatorio: boolean;
  };
}

// ===== STRUCTURE PRESETS =====

const COMMON_BLOCKS: StructureBlock[] = [
  {
    id: 'identificacao',
    title: 'Identificação',
    defaultFields: [
      { label: 'Nome completo', type: 'text', required: true },
      { label: 'Data de nascimento', type: 'date', required: true },
      { label: 'Sexo', type: 'select', required: true },
      { label: 'Profissão', type: 'text' },
      { label: 'Estado civil', type: 'select' },
    ],
  },
  {
    id: 'queixa_principal',
    title: 'Queixa Principal',
    defaultFields: [
      { label: 'Queixa principal', type: 'textarea', required: true },
      { label: 'Duração dos sintomas', type: 'text' },
    ],
  },
  {
    id: 'hda',
    title: 'História da Doença Atual',
    defaultFields: [
      { label: 'Início dos sintomas', type: 'text' },
      { label: 'Evolução', type: 'textarea' },
      { label: 'Fatores de melhora', type: 'textarea' },
      { label: 'Fatores de piora', type: 'textarea' },
      { label: 'Tratamentos anteriores', type: 'textarea' },
    ],
  },
  {
    id: 'historico_familiar',
    title: 'Histórico Familiar',
    defaultFields: [
      { label: 'Doenças na família', type: 'textarea' },
      { label: 'Observações familiares', type: 'textarea' },
    ],
  },
  {
    id: 'medicamentos',
    title: 'Uso de Medicamentos',
    defaultFields: [
      { label: 'Medicamentos em uso', type: 'textarea' },
      { label: 'Uso contínuo?', type: 'checkbox' },
      { label: 'Suplementos', type: 'textarea' },
    ],
  },
  {
    id: 'alergias',
    title: 'Alergias',
    defaultFields: [
      { label: 'Alergias medicamentosas', type: 'textarea' },
      { label: 'Alergias alimentares', type: 'textarea' },
      { label: 'Outras alergias', type: 'textarea' },
    ],
  },
  {
    id: 'exame_fisico',
    title: 'Exame Físico',
    defaultFields: [
      { label: 'Pressão arterial', type: 'text' },
      { label: 'Frequência cardíaca', type: 'number' },
      { label: 'Temperatura', type: 'number' },
      { label: 'Peso (kg)', type: 'number' },
      { label: 'Altura (cm)', type: 'number' },
      { label: 'Inspeção geral', type: 'textarea' },
    ],
  },
  {
    id: 'conduta',
    title: 'Plano / Conduta',
    defaultFields: [
      { label: 'Plano terapêutico', type: 'textarea' },
      { label: 'Encaminhamentos', type: 'textarea' },
      { label: 'Retorno', type: 'text' },
    ],
  },
  {
    id: 'observacoes',
    title: 'Observações',
    defaultFields: [
      { label: 'Observações gerais', type: 'textarea' },
    ],
  },
];

// Specialty-specific blocks
const SPECIALTY_BLOCKS: Record<ModeloTipo, StructureBlock[]> = {
  clinica_tradicional: [
    {
      id: 'hpp',
      title: 'História Patológica Pregressa',
      defaultFields: [
        { label: 'Internações anteriores', type: 'textarea' },
        { label: 'Cirurgias prévias', type: 'textarea' },
        { label: 'Doenças crônicas', type: 'textarea' },
        { label: 'Transfusões sanguíneas', type: 'checkbox' },
      ],
    },
    {
      id: 'habitos',
      title: 'Hábitos de Vida',
      defaultFields: [
        { label: 'Tabagismo', type: 'select' },
        { label: 'Etilismo', type: 'select' },
        { label: 'Atividade física', type: 'select' },
        { label: 'Alimentação', type: 'textarea' },
        { label: 'Sono', type: 'textarea' },
      ],
    },
    {
      id: 'revisao_sistemas',
      title: 'Revisão dos Sistemas',
      defaultFields: [
        { label: 'Cardiovascular', type: 'textarea' },
        { label: 'Respiratório', type: 'textarea' },
        { label: 'Digestivo', type: 'textarea' },
        { label: 'Geniturinário', type: 'textarea' },
        { label: 'Neurológico', type: 'textarea' },
        { label: 'Musculoesquelético', type: 'textarea' },
      ],
    },
  ],
  estetica: [
    {
      id: 'historico_estetico',
      title: 'Histórico Estético',
      defaultFields: [
        { label: 'Procedimentos estéticos anteriores', type: 'textarea' },
        { label: 'Uso de cosméticos/ácidos', type: 'textarea' },
        { label: 'Exposição solar', type: 'select' },
        { label: 'Tipo de pele (Fitzpatrick)', type: 'select' },
      ],
    },
    {
      id: 'expectativas',
      title: 'Expectativas e Objetivos',
      defaultFields: [
        { label: 'Principal queixa estética', type: 'textarea', required: true },
        { label: 'Expectativas com o tratamento', type: 'textarea' },
        { label: 'Contraindicações conhecidas', type: 'textarea' },
      ],
    },
  ],
  odontologica: [
    {
      id: 'historico_dental',
      title: 'Histórico Dental',
      defaultFields: [
        { label: 'Última visita ao dentista', type: 'date' },
        { label: 'Tratamentos odontológicos anteriores', type: 'textarea' },
        { label: 'Hábitos parafuncionais (bruxismo, etc.)', type: 'textarea' },
        { label: 'Higiene bucal (frequência de escovação)', type: 'select' },
        { label: 'Uso de fio dental', type: 'select' },
      ],
    },
    {
      id: 'saude_bucal',
      title: 'Condição de Saúde Bucal',
      defaultFields: [
        { label: 'Sangramento gengival', type: 'checkbox' },
        { label: 'Sensibilidade dental', type: 'checkbox' },
        { label: 'Dor ao mastigar', type: 'checkbox' },
        { label: 'Próteses em uso', type: 'textarea' },
      ],
    },
  ],
  nutricional: [
    {
      id: 'recordatorio',
      title: 'Recordatório Alimentar 24h',
      defaultFields: [
        { label: 'Café da manhã', type: 'textarea' },
        { label: 'Lanche da manhã', type: 'textarea' },
        { label: 'Almoço', type: 'textarea' },
        { label: 'Lanche da tarde', type: 'textarea' },
        { label: 'Jantar', type: 'textarea' },
        { label: 'Ceia', type: 'textarea' },
      ],
    },
    {
      id: 'avaliacao_nutricional',
      title: 'Avaliação Nutricional',
      defaultFields: [
        { label: 'Peso atual (kg)', type: 'number', required: true },
        { label: 'Altura (cm)', type: 'number', required: true },
        { label: 'IMC', type: 'calculated' },
        { label: 'Circunferência abdominal (cm)', type: 'number' },
        { label: 'Objetivo nutricional', type: 'textarea' },
        { label: 'Intolerâncias/restrições alimentares', type: 'textarea' },
      ],
    },
  ],
  psicologia: [
    {
      id: 'demanda_terapeutica',
      title: 'Demanda Terapêutica',
      defaultFields: [
        { label: 'Motivo da busca por terapia', type: 'textarea', required: true },
        { label: 'Tratamentos psicológicos anteriores', type: 'textarea' },
        { label: 'Uso de medicação psiquiátrica', type: 'textarea' },
        { label: 'Rede de apoio', type: 'textarea' },
      ],
    },
    {
      id: 'historia_vida',
      title: 'História de Vida',
      defaultFields: [
        { label: 'Infância e desenvolvimento', type: 'textarea' },
        { label: 'Relacionamentos significativos', type: 'textarea' },
        { label: 'Eventos traumáticos', type: 'textarea' },
        { label: 'Dinâmica familiar atual', type: 'textarea' },
      ],
    },
    {
      id: 'saude_mental',
      title: 'Saúde Mental',
      defaultFields: [
        { label: 'Humor predominante', type: 'select' },
        { label: 'Qualidade do sono', type: 'select' },
        { label: 'Ideação suicida', type: 'select' },
        { label: 'Uso de substâncias', type: 'textarea' },
        { label: 'Impressão clínica inicial', type: 'textarea' },
      ],
    },
  ],
  pediatria: [
    {
      id: 'gestacao_parto',
      title: 'Gestação e Parto',
      defaultFields: [
        { label: 'Tipo de parto', type: 'select' },
        { label: 'Idade gestacional', type: 'text' },
        { label: 'Peso ao nascer (g)', type: 'number' },
        { label: 'Comprimento ao nascer (cm)', type: 'number' },
        { label: 'Intercorrências neonatais', type: 'textarea' },
        { label: 'Apgar', type: 'text' },
      ],
    },
    {
      id: 'desenvolvimento',
      title: 'Desenvolvimento Neuropsicomotor',
      defaultFields: [
        { label: 'Sustento cefálico', type: 'text' },
        { label: 'Sentou sem apoio', type: 'text' },
        { label: 'Primeiros passos', type: 'text' },
        { label: 'Primeiras palavras', type: 'text' },
        { label: 'Controle esfincteriano', type: 'text' },
      ],
    },
    {
      id: 'alimentacao_pediatrica',
      title: 'Alimentação',
      defaultFields: [
        { label: 'Aleitamento materno', type: 'select' },
        { label: 'Introdução alimentar', type: 'text' },
        { label: 'Alimentação atual', type: 'textarea' },
        { label: 'Dificuldades alimentares', type: 'textarea' },
      ],
    },
    {
      id: 'vacinacao',
      title: 'Vacinação',
      defaultFields: [
        { label: 'Cartão vacinal em dia?', type: 'select' },
        { label: 'Vacinas em atraso', type: 'textarea' },
      ],
    },
  ],
  personalizado: [],
};

const TIPO_LABELS: Record<ModeloTipo, string> = {
  clinica_tradicional: 'Anamnese Clínica Tradicional',
  estetica: 'Estética',
  odontologica: 'Odontológica',
  nutricional: 'Nutricional',
  psicologia: 'Psicologia',
  pediatria: 'Pediatria',
  personalizado: 'Personalizado (vazio)',
};

const TIPO_ICONS: Record<ModeloTipo, typeof Stethoscope> = {
  clinica_tradicional: Stethoscope,
  estetica: Sparkles,
  odontologica: ClipboardList,
  nutricional: Scale,
  psicologia: FileText,
  pediatria: ClipboardList,
  personalizado: Layers,
};

// ===== COMPONENT =====

export function NewAnamnesisModelDialog({
  open,
  onOpenChange,
  specialtyId,
  procedures,
  saving,
  onCreateModel,
}: NewAnamnesisModelDialogProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tipo, setTipo] = useState<ModeloTipo>('clinica_tradicional');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [emptyMode, setEmptyMode] = useState(false);
  
  // Components
  const [registroFotografico, setRegistroFotografico] = useState(false);
  const [uploadExames, setUploadExames] = useState(false);
  const [assinaturaDigital, setAssinaturaDigital] = useState(false);
  const [camposCondicionais, setCamposCondicionais] = useState(false);
  const [escalasClinicas, setEscalasClinicas] = useState(false);
  
  // Binding
  const [bindingType, setBindingType] = useState<'specialty' | 'procedure'>('specialty');
  const [procedureId, setProcedureId] = useState('');
  
  // Settings
  const [ativo, setAtivo] = useState(true);
  const [padrao, setPadrao] = useState(false);
  const [editavelApos, setEditavelApos] = useState(false);
  const [preenchimentoObrigatorio, setPreenchimentoObrigatorio] = useState(false);

  // Available blocks for selected type
  const availableBlocks = useMemo(() => {
    const specialtySpecific = SPECIALTY_BLOCKS[tipo] || [];
    return [...COMMON_BLOCKS, ...specialtySpecific];
  }, [tipo]);

  // Auto-select blocks when type changes
  useEffect(() => {
    if (emptyMode) return;
    const specialtySpecific = SPECIALTY_BLOCKS[tipo] || [];
    const allBlockIds = [...COMMON_BLOCKS, ...specialtySpecific].map(b => b.id);
    
    if (tipo === 'personalizado') {
      setSelectedBlocks([]);
    } else {
      setSelectedBlocks(allBlockIds);
    }
  }, [tipo, emptyMode]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setTipo('clinica_tradicional');
      setSelectedBlocks(COMMON_BLOCKS.map(b => b.id));
      setEmptyMode(false);
      setRegistroFotografico(false);
      setUploadExames(false);
      setAssinaturaDigital(false);
      setCamposCondicionais(false);
      setEscalasClinicas(false);
      setBindingType('specialty');
      setProcedureId('');
      setAtivo(true);
      setPadrao(false);
      setEditavelApos(false);
      setPreenchimentoObrigatorio(false);
    }
  }, [open]);

  const toggleBlock = (id: string) => {
    setEmptyMode(false);
    setSelectedBlocks(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleEmptyMode = () => {
    setEmptyMode(true);
    setSelectedBlocks([]);
  };

  const handleSelectAll = () => {
    setEmptyMode(false);
    setSelectedBlocks(availableBlocks.map(b => b.id));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await onCreateModel({
      name: name.trim(),
      description: description.trim(),
      tipo,
      selectedBlocks: emptyMode ? [] : selectedBlocks,
      components: {
        registroFotografico,
        uploadExames,
        assinaturaDigital,
        camposCondicionais,
        escalasClinicas,
      },
      procedureId: bindingType === 'procedure' ? procedureId || null : null,
      settings: {
        ativo,
        padrao,
        editavelAposFinalizar: editavelApos,
        preenchimentoObrigatorio,
      },
    });

    onOpenChange(false);
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Novo Modelo de Anamnese
          </DialogTitle>
          <DialogDescription>
            Configure o tipo, estrutura e componentes do modelo. Após criar, você poderá editar detalhadamente cada campo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="space-y-6 pr-4">
            {/* ─── Identificação ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Modelo *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Anamnese Completa - Clínica Geral"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>

            <Separator />

            {/* ─── 1️⃣ Tipo do Modelo ────────────────────────── */}
            <Accordion type="multiple" defaultValue={['tipo', 'estrutura', 'componentes', 'vinculo', 'configuracoes']}>
              <AccordionItem value="tipo" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">1</Badge>
                    Tipo do Modelo
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Object.keys(TIPO_LABELS) as ModeloTipo[]).map(key => {
                      const Icon = TIPO_ICONS[key];
                      const isSelected = tipo === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTipo(key)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={isSelected ? 'font-medium' : ''}>{TIPO_LABELS[key]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    O tipo define a estrutura base sugerida. Você poderá personalizar após a criação.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* ─── 2️⃣ Estrutura Inicial ─────────────────────── */}
              <AccordionItem value="estrutura" className="border rounded-lg px-4 mt-2">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">2</Badge>
                    Estrutura Inicial
                    {!emptyMode && selectedBlocks.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">{selectedBlocks.length} seções</Badge>
                    )}
                    {emptyMode && (
                      <Badge variant="secondary" className="text-xs ml-1">Vazio</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">
                      Selecione os blocos para gerar automaticamente:
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={handleSelectAll}
                      >
                        Selecionar todos
                      </Button>
                      <Button
                        variant={emptyMode ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={handleEmptyMode}
                      >
                        <Eraser className="h-3 w-3 mr-1" />
                        Criar totalmente vazio
                      </Button>
                    </div>
                  </div>

                  {!emptyMode && (
                    <div className="space-y-4">
                      {/* Common blocks */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Seções Gerais</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {COMMON_BLOCKS.map(block => (
                            <label
                              key={block.id}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-all ${
                                selectedBlocks.includes(block.id)
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                checked={selectedBlocks.includes(block.id)}
                                onCheckedChange={() => toggleBlock(block.id)}
                              />
                              <span>{block.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Specialty-specific blocks */}
                      {tipo !== 'personalizado' && SPECIALTY_BLOCKS[tipo]?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                            Específico: {TIPO_LABELS[tipo]}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {SPECIALTY_BLOCKS[tipo].map(block => (
                              <label
                                key={block.id}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-all ${
                                  selectedBlocks.includes(block.id)
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox
                                  checked={selectedBlocks.includes(block.id)}
                                  onCheckedChange={() => toggleBlock(block.id)}
                                />
                                <span>{block.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {emptyMode && (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">O modelo será criado sem seções pré-definidas.</p>
                      <p className="text-xs mt-1">Você adicionará as seções manualmente no editor.</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ─── 3️⃣ Componentes Adicionais ────────────────── */}
              <AccordionItem value="componentes" className="border rounded-lg px-4 mt-2">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">3</Badge>
                    Componentes Adicionais
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={registroFotografico} onCheckedChange={v => setRegistroFotografico(!!v)} />
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Registro Fotográfico</span>
                        <p className="text-xs text-muted-foreground">Permitir captura de fotos durante a anamnese</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={uploadExames} onCheckedChange={v => setUploadExames(!!v)} />
                      <FileUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Upload de Exames</span>
                        <p className="text-xs text-muted-foreground">Permitir anexar exames e documentos</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={assinaturaDigital} onCheckedChange={v => setAssinaturaDigital(!!v)} />
                      <PenTool className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Assinatura Digital</span>
                        <p className="text-xs text-muted-foreground">Captura de assinatura do paciente ou profissional</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={camposCondicionais} onCheckedChange={v => setCamposCondicionais(!!v)} />
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Campos Condicionais</span>
                        <p className="text-xs text-muted-foreground">Exibir campos com base em respostas anteriores</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={escalasClinicas} onCheckedChange={v => setEscalasClinicas(!!v)} />
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">Escalas Clínicas</span>
                        <p className="text-xs text-muted-foreground">Incluir escalas como EVA, Glasgow, etc.</p>
                      </div>
                    </label>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ─── 4️⃣ Vínculo ───────────────────────────────── */}
              <AccordionItem value="vinculo" className="border rounded-lg px-4 mt-2">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">4</Badge>
                    Vínculo
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBindingType('specialty')}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                          bindingType === 'specialty'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Stethoscope className="h-4 w-4" />
                        Especialidade inteira
                      </button>
                      <button
                        type="button"
                        onClick={() => setBindingType('procedure')}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                          bindingType === 'procedure'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Syringe className="h-4 w-4" />
                        Procedimento específico
                      </button>
                    </div>

                    {bindingType === 'procedure' && (
                      <Select value={procedureId} onValueChange={setProcedureId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o procedimento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {procedures.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                          {procedures.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              Nenhum procedimento cadastrado
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Modelos vinculados a procedimentos têm prioridade sobre o modelo padrão da especialidade.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ─── 5️⃣ Configurações Avançadas ───────────────── */}
              <AccordionItem value="configuracoes" className="border rounded-lg px-4 mt-2">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">5</Badge>
                    Configurações Avançadas
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="text-sm font-medium">Modelo ativo ao criar?</span>
                        <p className="text-xs text-muted-foreground">Disponível imediatamente para uso</p>
                      </div>
                      <Switch checked={ativo} onCheckedChange={setAtivo} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="text-sm font-medium">Definir como padrão da especialidade?</span>
                        <p className="text-xs text-muted-foreground">Será o modelo utilizado quando nenhum outro for selecionado</p>
                      </div>
                      <Switch checked={padrao} onCheckedChange={setPadrao} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="text-sm font-medium">Permitir edição após atendimento finalizado?</span>
                        <p className="text-xs text-muted-foreground">Registros poderão ser alterados após a sessão</p>
                      </div>
                      <Switch checked={editavelApos} onCheckedChange={setEditavelApos} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="text-sm font-medium">Exigir preenchimento completo?</span>
                        <p className="text-xs text-muted-foreground">Todos os campos obrigatórios devem ser preenchidos antes de finalizar</p>
                      </div>
                      <Switch checked={preenchimentoObrigatorio} onCheckedChange={setPreenchimentoObrigatorio} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {!emptyMode && selectedBlocks.length > 0
              ? `${selectedBlocks.length} seções serão criadas automaticamente`
              : 'Modelo será criado vazio'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !isValid}>
              {saving ? 'Criando...' : 'Criar Modelo'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== STRUCTURE GENERATOR =====

/**
 * Build the sections/fields structure from the dialog config
 * Returns the JSON structure compatible with anamnesis_template_versions
 */
export function generateStructureFromConfig(config: CreateModelConfig): any[] {
  if (config.selectedBlocks.length === 0) return [];

  const allBlocks = [...COMMON_BLOCKS, ...(SPECIALTY_BLOCKS[config.tipo] || [])];
  
  const sections = config.selectedBlocks
    .map(blockId => allBlocks.find(b => b.id === blockId))
    .filter(Boolean)
    .map((block, idx) => ({
      id: `section_${block!.id}`,
      type: 'section' as const,
      title: block!.title,
      fields: block!.defaultFields.map((f, fIdx) => ({
        id: `field_${block!.id}_${fIdx}`,
        type: f.type,
        label: f.label,
        required: f.required || false,
        ...(f.type === 'select' || f.type === 'multiselect' || f.type === 'radio'
          ? { options: [] }
          : {}),
      })),
    }));

  // Add component sections
  if (config.components.registroFotografico) {
    sections.push({
      id: 'section_fotos',
      type: 'section',
      title: 'Registro Fotográfico',
      fields: [
        { id: 'field_fotos_1', type: 'gallery', label: 'Fotos do paciente', required: false },
      ],
    });
  }

  if (config.components.uploadExames) {
    sections.push({
      id: 'section_exames',
      type: 'section',
      title: 'Exames Anexados',
      fields: [
        { id: 'field_exames_1', type: 'file', label: 'Upload de exames', required: false },
      ],
    });
  }

  if (config.components.assinaturaDigital) {
    sections.push({
      id: 'section_assinatura',
      type: 'section',
      title: 'Assinatura',
      fields: [
        { id: 'field_assinatura_1', type: 'signature', label: 'Assinatura do paciente', required: false },
      ],
    });
  }

  if (config.components.escalasClinicas) {
    sections.push({
      id: 'section_escalas',
      type: 'section',
      title: 'Escalas Clínicas',
      fields: [
        { id: 'field_escala_1', type: 'scale', label: 'Escala de Dor (EVA)', required: false },
      ],
    });
  }

  return sections;
}
