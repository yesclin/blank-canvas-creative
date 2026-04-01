import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { FacialMapApplication, ProcedureType } from "./types";
import { COMMON_PRODUCTS, getRegionsForProcedure, getDefaultUnit, getRegionLabel } from "./types";

interface ApplicationPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point?: Partial<FacialMapApplication> | null;
  onSave: (data: Partial<FacialMapApplication>) => void;
  onDelete?: () => void;
  isNew?: boolean;
  preselectedMuscle?: string | null;
  preselectedProduct?: string | null;
  preselectedType?: ProcedureType;
}

export function ApplicationPointDialog({
  open,
  onOpenChange,
  point,
  onSave,
  onDelete,
  isNew = false,
  preselectedMuscle,
  preselectedProduct,
  preselectedType = 'toxin',
}: ApplicationPointDialogProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<string>('UI');
  const [procedureType, setProcedureType] = useState<ProcedureType>(preselectedType);
  const [productName, setProductName] = useState<string>(preselectedProduct || '');
  const [muscle, setMuscle] = useState<string>(preselectedMuscle || '');
  const [notes, setNotes] = useState<string>('');
  const [side, setSide] = useState<string>('');
  const [applicationDate, setApplicationDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // Extended fields
  const [manufacturer, setManufacturer] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [dilution, setDilution] = useState('');
  const [technique, setTechnique] = useState('');
  const [depth, setDepth] = useState('');
  const [plannedVolume, setPlannedVolume] = useState<number>(0);
  const [appliedVolume, setAppliedVolume] = useState<number>(0);
  const [applicationPlan, setApplicationPlan] = useState('');
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [totalSessions, setTotalSessions] = useState<number>(1);
  const [sessionInterval, setSessionInterval] = useState('');
  const [protocol, setProtocol] = useState('');

  useEffect(() => {
    if (point) {
      const type = (point.procedure_type as ProcedureType) || preselectedType;
      setQuantity(point.quantity || 0);
      setUnit(point.unit || getDefaultUnit(type));
      setProcedureType(type);
      setProductName(point.product_name || preselectedProduct || '');
      setMuscle(point.muscle || preselectedMuscle || '');
      setNotes(point.notes || '');
      setSide(point.side || '');
      setApplicationDate(
        point.created_at 
          ? format(new Date(point.created_at), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd')
      );
      setManufacturer(point.manufacturer || '');
      setLotNumber(point.lot_number || '');
      setExpiryDate(point.expiry_date || '');
      setDilution(point.dilution || '');
      setTechnique(point.technique || '');
      setDepth(point.depth || '');
      setPlannedVolume(point.planned_volume || 0);
      setAppliedVolume(point.applied_volume || 0);
      setApplicationPlan(point.application_plan || '');
      setSessionNumber(point.session_number || 1);
      setTotalSessions(point.total_sessions || 1);
      setSessionInterval(point.session_interval || '');
      setProtocol(point.protocol || '');
    } else {
      setQuantity(0);
      setUnit(getDefaultUnit(preselectedType));
      setProcedureType(preselectedType);
      setProductName(preselectedProduct || '');
      setMuscle(preselectedMuscle || '');
      setNotes('');
      setSide('');
      setApplicationDate(format(new Date(), 'yyyy-MM-dd'));
      setManufacturer('');
      setLotNumber('');
      setExpiryDate('');
      setDilution('');
      setTechnique('');
      setDepth('');
      setPlannedVolume(0);
      setAppliedVolume(0);
      setApplicationPlan('');
      setSessionNumber(1);
      setTotalSessions(1);
      setSessionInterval('');
      setProtocol('');
    }
  }, [point, preselectedMuscle, preselectedProduct, preselectedType]);

  const handleSave = () => {
    if (!productName) return;
    onSave({
      ...point,
      procedure_type: procedureType,
      product_name: productName,
      quantity,
      unit,
      muscle: muscle || null,
      notes: notes || null,
      side: (side as any) || null,
      manufacturer: manufacturer || null,
      lot_number: lotNumber || null,
      expiry_date: expiryDate || null,
      dilution: dilution || null,
      technique: technique || null,
      depth: depth || null,
      planned_volume: plannedVolume || null,
      applied_volume: appliedVolume || null,
      application_plan: applicationPlan || null,
      session_number: sessionNumber || null,
      total_sessions: totalSessions || null,
      session_interval: sessionInterval || null,
      protocol: protocol || null,
    });
    onOpenChange(false);
  };

  const regions = getRegionsForProcedure(procedureType);
  const regionLabel = getRegionLabel(procedureType);
  const muscleName = regions.find(m => m.id === muscle)?.name || muscle;
  const products = COMMON_PRODUCTS[procedureType] || [];

  const procedureTitle = procedureType === 'toxin' ? 'Toxina' : procedureType === 'filler' ? 'Preenchimento' : 'Bioestimulador';
  const procedureColor = procedureType === 'toxin' ? 'text-red-600' : procedureType === 'filler' ? 'text-blue-600' : 'text-green-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            {isNew ? 'Registrar Aplicação' : 'Editar Ponto'}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              procedureType === 'toxin' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
              procedureType === 'filler' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
              'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
            }`}>
              {procedureTitle}
            </span>
          </DialogTitle>
          {isNew && muscleName && (
            <p className="text-sm text-muted-foreground mt-1">
              {regionLabel}: <span className="font-medium text-foreground">{muscleName}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Region selector if not preselected */}
          {!preselectedMuscle && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{regionLabel}</Label>
              <Select value={muscle} onValueChange={setMuscle}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} <span className="text-muted-foreground">({m.region})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Lado</Label>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Automático" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerdo</SelectItem>
                  <SelectItem value="right">Direito</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="bilateral">Bilateral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
            </div>
          </div>

          {/* Product + Manufacturer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Produto</Label>
              <Select value={productName} onValueChange={setProductName}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Fabricante</Label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Ex: Allergan"
                className="h-9"
              />
            </div>
          </div>

          {/* Lot + Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Lote</Label>
              <Input
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Nº do lote"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Validade</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* === TOXIN-SPECIFIC FIELDS === */}
          {procedureType === 'toxin' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Diluição</Label>
                  <Input
                    value={dilution}
                    onChange={(e) => setDilution(e.target.value)}
                    placeholder="Ex: 2ml SF 0.9%"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Unidades (UI)</Label>
                  <Input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                    className="h-10 text-lg font-medium"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Profundidade / Técnica</Label>
                <Input
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  placeholder="Ex: Intramuscular, subdérmico"
                  className="h-9"
                />
              </div>
            </>
          )}

          {/* === FILLER-SPECIFIC FIELDS === */}
          {procedureType === 'filler' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Volume Planejado (ml)</Label>
                  <Input
                    type="number"
                    value={plannedVolume || ''}
                    onChange={(e) => setPlannedVolume(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="h-9"
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Volume Aplicado (ml)</Label>
                  <Input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="h-10 text-lg font-medium"
                    placeholder="0.0"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Técnica</Label>
                <Select value={technique} onValueChange={setTechnique}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione a técnica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canula">Cânula</SelectItem>
                    <SelectItem value="agulha">Agulha</SelectItem>
                    <SelectItem value="mista">Mista (Cânula + Agulha)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Plano de Aplicação</Label>
                <Textarea
                  value={applicationPlan}
                  onChange={(e) => setApplicationPlan(e.target.value)}
                  placeholder="Descreva o plano: camadas, pontos de entrada, retroinjeção..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* === BIOSTIMULATOR-SPECIFIC FIELDS === */}
          {procedureType === 'biostimulator' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quantidade Aplicada</Label>
                  <Input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="h-10 text-lg font-medium"
                    placeholder="0.0"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Protocolo</Label>
                  <Input
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    placeholder="Ex: Sculptra 2 frascos"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Sessão Nº</Label>
                  <Input
                    type="number"
                    value={sessionNumber || ''}
                    onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Total Previsto</Label>
                  <Input
                    type="number"
                    value={totalSessions || ''}
                    onChange={(e) => setTotalSessions(parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Intervalo</Label>
                  <Input
                    value={sessionInterval}
                    onChange={(e) => setSessionInterval(e.target.value)}
                    placeholder="Ex: 30 dias"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Técnica / Protocolo</Label>
                <Select value={technique} onValueChange={setTechnique}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canula">Cânula</SelectItem>
                    <SelectItem value="agulha">Agulha</SelectItem>
                    <SelectItem value="mista">Mista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Notes - common */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                procedureType === 'toxin' 
                  ? "Assimetrias, reações, recomendações de retoque..." 
                  : procedureType === 'filler'
                  ? "Intercorrências, resposta tecidual, próximos passos..."
                  : "Resposta esperada, cuidados pós, observações clínicas..."
              }
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {!isNew && onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-destructive hover:text-destructive mr-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!productName}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
