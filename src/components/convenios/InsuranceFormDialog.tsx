import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Insurance, TissGuideType } from "@/types/convenios";
import { guideTypeLabels, feeTypeLabels } from "@/types/convenios";
import { toast } from "sonner";
import { useCreateInsurance, useUpdateInsurance } from "@/hooks/useConveniosData";

interface InsuranceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurance?: Insurance | null;
}

const guideTypes: TissGuideType[] = ['consulta', 'sp_sadt', 'internacao', 'honorarios', 'outras_despesas'];

export function InsuranceFormDialog({ open, onOpenChange, insurance }: InsuranceFormDialogProps) {
  const createInsurance = useCreateInsurance();
  const updateInsurance = useUpdateInsurance();
  const isSubmitting = createInsurance.isPending || updateInsurance.isPending;
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    ans_code: '',
    tiss_code: '',
    contact_phone: '',
    contact_email: '',
    requires_authorization: false,
    return_allowed: true,
    return_days: 30,
    allowed_guide_types: ['consulta', 'sp_sadt'] as string[],
    default_fee_type: 'percentage',
    default_fee_value: 50,
    default_payment_deadline_days: 30,
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (insurance) {
      setFormData({
        name: insurance.name || '',
        code: insurance.code || '',
        ans_code: insurance.ans_code || '',
        tiss_code: insurance.tiss_code || '',
        contact_phone: insurance.contact_phone || '',
        contact_email: insurance.contact_email || '',
        requires_authorization: insurance.requires_authorization || false,
        return_allowed: insurance.return_allowed ?? true,
        return_days: insurance.return_days || 30,
        allowed_guide_types: insurance.allowed_guide_types || ['consulta', 'sp_sadt'],
        default_fee_type: insurance.default_fee_type || 'percentage',
        default_fee_value: insurance.default_fee_value || 50,
        default_payment_deadline_days: insurance.default_payment_deadline_days || 30,
        notes: insurance.notes || '',
        is_active: insurance.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        ans_code: '',
        tiss_code: '',
        contact_phone: '',
        contact_email: '',
        requires_authorization: false,
        return_allowed: true,
        return_days: 30,
        allowed_guide_types: ['consulta', 'sp_sadt'],
        default_fee_type: 'percentage',
        default_fee_value: 50,
        default_payment_deadline_days: 30,
        notes: '',
        is_active: true,
      });
    }
  }, [insurance, open]);

  const handleGuideTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_guide_types: prev.allowed_guide_types.includes(type)
        ? prev.allowed_guide_types.filter(t => t !== type)
        : [...prev.allowed_guide_types, type]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do convênio é obrigatório');
      return;
    }
    
    try {
      if (insurance) {
        await updateInsurance.mutateAsync({ id: insurance.id, formData });
      } else {
        await createInsurance.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{insurance ? 'Editar Convênio' : 'Novo Convênio'}</DialogTitle>
          <DialogDescription>
            {insurance ? 'Altere os dados do convênio' : 'Cadastre um novo convênio ou operadora'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Identificação */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Convênio *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Unimed" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código Interno</Label>
              <Input 
                id="code" 
                placeholder="Ex: UNI001" 
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ans_code">Código ANS</Label>
              <Input 
                id="ans_code" 
                placeholder="Ex: 359017" 
                value={formData.ans_code}
                onChange={(e) => setFormData(prev => ({ ...prev, ans_code: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tiss_code">Código TISS</Label>
              <Input 
                id="tiss_code" 
                placeholder="Ex: 359017" 
                value={formData.tiss_code}
                onChange={(e) => setFormData(prev => ({ ...prev, tiss_code: e.target.value }))}
              />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input 
                id="contact_phone" 
                placeholder="(00) 0000-0000" 
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_email">E-mail</Label>
              <Input 
                id="contact_email" 
                type="email" 
                placeholder="contato@convenio.com" 
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>
          </div>

          {/* Tipos de Guia Permitidos */}
          <div className="grid gap-2">
            <Label>Tipos de Guia Permitidos</Label>
            <div className="flex flex-wrap gap-4 p-3 border rounded-lg">
              {guideTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`guide-${type}`}
                    checked={formData.allowed_guide_types.includes(type)}
                    onCheckedChange={() => handleGuideTypeToggle(type)}
                  />
                  <Label htmlFor={`guide-${type}`} className="text-sm font-normal cursor-pointer">
                    {guideTypeLabels[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Regras de Autorização e Retorno */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exige Autorização</Label>
                <p className="text-xs text-muted-foreground">
                  Procedimentos precisam de autorização prévia
                </p>
              </div>
              <Switch 
                checked={formData.requires_authorization}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_authorization: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permite Retorno</Label>
                <p className="text-xs text-muted-foreground">
                  Retorno gratuito dentro do prazo
                </p>
              </div>
              <Switch 
                checked={formData.return_allowed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, return_allowed: checked }))}
              />
            </div>

            {formData.return_allowed && (
              <div className="grid gap-2">
                <Label htmlFor="return_days">Prazo de Retorno (dias)</Label>
                <Input 
                  id="return_days" 
                  type="number" 
                  min="0" 
                  value={formData.return_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, return_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>

          {/* Regras de Repasse */}
          <div className="space-y-4 pt-2 border-t">
            <h4 className="font-medium">Repasse Padrão</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Repasse</Label>
                <Select 
                  value={formData.default_fee_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, default_fee_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>
                  {formData.default_fee_type === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
                </Label>
                <Input 
                  type="number" 
                  min="0"
                  step={formData.default_fee_type === 'percentage' ? '1' : '0.01'}
                  value={formData.default_fee_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_fee_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Prazo Repasse (dias)</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={formData.default_payment_deadline_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_payment_deadline_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="grid gap-2 pt-2 border-t">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              placeholder="Observações adicionais..." 
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {insurance ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
