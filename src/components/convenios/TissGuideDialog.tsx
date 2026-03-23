import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Send, CheckCircle, XCircle, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { TissGuide, Insurance, TissGuideType } from "@/types/convenios";
import { guideTypeLabels, guideStatusLabels, guideStatusColors } from "@/types/convenios";
import { mockProcedures } from "@/hooks/useConveniosMockData";
import { DocumentHeader } from "@/components/documents/DocumentHeader";
import { toast } from "sonner";

interface TissGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide?: TissGuide | null;
  insurances: Insurance[];
  patients: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string }>;
}

interface GuideItem {
  id: string;
  procedure_id: string;
  procedure_code: string;
  procedure_description: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}

export function TissGuideDialog({ 
  open, 
  onOpenChange, 
  guide,
  insurances,
  patients,
  professionals 
}: TissGuideDialogProps) {
  const isNew = !guide;
  const isEditable = !guide || ['rascunho', 'aberta'].includes(guide.status);

  const [formData, setFormData] = useState({
    guide_type: 'consulta' as TissGuideType,
    patient_id: '',
    insurance_id: '',
    professional_id: '',
    service_date: new Date().toISOString().split('T')[0],
    main_authorization_number: '',
    beneficiary_card_number: '',
    notes: '',
  });

  const [items, setItems] = useState<GuideItem[]>([]);
  const [newItemProcedure, setNewItemProcedure] = useState('');

  useEffect(() => {
    if (guide) {
      setFormData({
        guide_type: guide.guide_type,
        patient_id: guide.patient_id,
        insurance_id: guide.insurance_id,
        professional_id: guide.professional_id || '',
        service_date: guide.service_date,
        main_authorization_number: guide.main_authorization_number || '',
        beneficiary_card_number: guide.beneficiary_card_number || '',
        notes: guide.notes || '',
      });
      // In real implementation, load items from guide
      setItems([]);
    } else {
      setFormData({
        guide_type: 'consulta',
        patient_id: '',
        insurance_id: '',
        professional_id: '',
        service_date: new Date().toISOString().split('T')[0],
        main_authorization_number: '',
        beneficiary_card_number: '',
        notes: '',
      });
      setItems([]);
    }
  }, [guide, open]);

  const handleAddItem = () => {
    if (!newItemProcedure) return;
    
    const procedure = mockProcedures.find(p => p.id === newItemProcedure);
    if (!procedure) return;

    const newItem: GuideItem = {
      id: Date.now().toString(),
      procedure_id: procedure.id,
      procedure_code: procedure.code,
      procedure_description: procedure.name,
      quantity: 1,
      unit_value: procedure.price,
      total_value: procedure.price,
    };

    setItems([...items, newItem]);
    setNewItemProcedure('');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total_value: item.unit_value * quantity,
        };
      }
      return item;
    }));
  };

  const totalValue = items.reduce((sum, item) => sum + item.total_value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSave = () => {
    if (!formData.patient_id || !formData.insurance_id) {
      toast.error('Paciente e Convênio são obrigatórios');
      return;
    }
    
    toast.success(isNew ? 'Guia criada como rascunho!' : 'Guia atualizada!');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um procedimento');
      return;
    }
    
    toast.success('Guia enviada para o convênio!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isNew ? 'Nova Guia TISS' : `Guia ${guide?.guide_number}`}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {isNew ? 'Crie uma nova guia de atendimento' : (
              <>
                <Badge className={guideStatusColors[guide!.status]}>
                  {guideStatusLabels[guide!.status]}
                </Badge>
                <span>•</span>
                <span>{guideTypeLabels[guide!.guide_type]}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Institutional Header for Document/Print */}
        <div className="border rounded-lg p-4 bg-muted/30 print:bg-white">
          <DocumentHeader showAddress={true} showContact={true} />
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados da Guia</TabsTrigger>
            <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
            {!isNew && <TabsTrigger value="historico">Histórico</TabsTrigger>}
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Guia *</Label>
                <Select 
                  value={formData.guide_type}
                  onValueChange={(value: TissGuideType) => setFormData(prev => ({ ...prev, guide_type: value }))}
                  disabled={!isEditable}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="sp_sadt">SP/SADT</SelectItem>
                    <SelectItem value="internacao">Internação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Data do Atendimento *</Label>
                <Input 
                  type="date" 
                  value={formData.service_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_date: e.target.value }))}
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Paciente *</Label>
              <Select 
                value={formData.patient_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
                disabled={!isEditable}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Convênio *</Label>
                <Select 
                  value={formData.insurance_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, insurance_id: value }))}
                  disabled={!isEditable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    {insurances.filter(i => i.is_active).map((insurance) => (
                      <SelectItem key={insurance.id} value={insurance.id}>
                        {insurance.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Nº Carteirinha</Label>
                <Input 
                  value={formData.beneficiary_card_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, beneficiary_card_number: e.target.value }))}
                  placeholder="Número da carteirinha"
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Profissional Executante</Label>
                <Select 
                  value={formData.professional_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, professional_id: value }))}
                  disabled={!isEditable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Nº Autorização (se houver)</Label>
                <Input 
                  value={formData.main_authorization_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, main_authorization_number: e.target.value }))}
                  placeholder="Número da autorização prévia"
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                disabled={!isEditable}
              />
            </div>

            {guide?.rejection_reason && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <Label className="text-red-700">Motivo da Negativa:</Label>
                <p className="text-sm text-red-600 mt-1">{guide.rejection_reason}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="procedimentos" className="space-y-4 mt-4">
            {isEditable && (
              <div className="flex gap-2">
                <Select value={newItemProcedure} onValueChange={setNewItemProcedure}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um procedimento para adicionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProcedures.map((proc) => (
                      <SelectItem key={proc.id} value={proc.id}>
                        {proc.code} - {proc.name} ({formatCurrency(proc.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddItem} disabled={!newItemProcedure}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isEditable && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isEditable ? 6 : 5} className="text-center text-muted-foreground py-8">
                      Nenhum procedimento adicionado
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.procedure_code}</TableCell>
                      <TableCell>{item.procedure_description}</TableCell>
                      <TableCell className="text-center">
                        {isEditable ? (
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_value)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total_value)}</TableCell>
                      {isEditable && (
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex justify-end border-t pt-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total da Guia</div>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              </div>
            </div>
          </TabsContent>

          {!isNew && (
            <TabsContent value="historico" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <History className="h-4 w-4" />
                  <span className="text-sm">Histórico de alterações da guia</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Status alterado para Aprovada</div>
                      <div className="text-xs text-muted-foreground">21/01/2024 às 14:00 • Sistema</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Send className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Guia enviada para o convênio</div>
                      <div className="text-xs text-muted-foreground">20/01/2024 às 10:00 • Recepcionista Maria</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Guia criada</div>
                      <div className="text-xs text-muted-foreground">20/01/2024 às 09:00 • Recepcionista Maria</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isEditable ? 'Cancelar' : 'Fechar'}
          </Button>
          {isEditable && (
            <>
              <Button variant="secondary" onClick={handleSave}>
                Salvar Rascunho
              </Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Guia
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
