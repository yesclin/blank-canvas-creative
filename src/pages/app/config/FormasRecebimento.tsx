import { useState } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useTogglePaymentMethod,
  useDeletePaymentMethod,
  PAYMENT_CATEGORIES,
  FEE_TYPES,
  type PaymentMethod,
  type PaymentMethodFormData,
} from "@/hooks/usePaymentMethods";
import { usePermissions } from "@/hooks/usePermissions";

const emptyForm: PaymentMethodFormData = {
  name: "",
  code: "",
  category: "other",
  description: "",
  accepts_change: false,
  allows_installments: false,
  max_installments: 1,
  requires_authorization_code: false,
  requires_due_date: false,
  auto_settle: true,
  fee_type: undefined,
  fee_value: 0,
  display_order: 0,
  color: "",
  icon: "",
  is_default: false,
};

export default function FormasRecebimento() {
  const { isOwner, isAdmin, isLoading: permLoading } = usePermissions();
  const canManage = isOwner || isAdmin;
  const { data: methods, isLoading } = usePaymentMethods(true);
  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const toggleMutation = useTogglePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentMethodFormData>({ ...emptyForm });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    const nextOrder = (methods || []).length + 1;
    setForm({ ...emptyForm, display_order: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      code: m.code,
      category: m.category,
      description: m.description || "",
      accepts_change: m.accepts_change,
      allows_installments: m.allows_installments,
      max_installments: m.max_installments,
      requires_authorization_code: m.requires_authorization_code,
      requires_due_date: m.requires_due_date,
      auto_settle: m.auto_settle,
      fee_type: m.fee_type || undefined,
      fee_value: m.fee_value ?? 0,
      display_order: m.display_order,
      color: m.color || "",
      icon: m.icon || "",
      is_default: m.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const canSubmit = form.name.trim() && form.code.trim() && form.category;

  if (permLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Formas de Recebimento</h1>
            <p className="text-sm text-muted-foreground">
              Configure como a clínica recebe pagamentos
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nova Forma
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Parcela</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                {canManage && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!methods || methods.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="text-center text-muted-foreground py-8">
                    Nenhuma forma de recebimento cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                methods.map((m) => (
                  <TableRow key={m.id} className={!m.is_active ? "opacity-50" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{m.display_order}</TableCell>
                    <TableCell className="font-medium">
                      {m.name}
                      {m.is_system && (
                        <Badge variant="outline" className="ml-2 text-[10px]">Sistema</Badge>
                      )}
                      {m.is_default && (
                        <Badge variant="secondary" className="ml-1 text-[10px]">Padrão</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{m.code}</TableCell>
                    <TableCell className="text-xs">
                      {PAYMENT_CATEGORIES.find((c) => c.value === m.category)?.label || m.category}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {m.allows_installments ? `Até ${m.max_installments}x` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {canManage ? (
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: m.id, is_active: v })}
                        />
                      ) : (
                        <Badge variant={m.is_active ? "default" : "secondary"} className="text-[10px]">
                          {m.is_active ? "Sim" : "Não"}
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!m.is_system && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteMutation.mutate(m.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nova"} Forma de Recebimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label>Código *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={50}
                  placeholder="ex: cartao_credito"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" min={0} value={form.display_order} onChange={(e) => set("display_order", parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} maxLength={300} />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="accepts_change" checked={form.accepts_change} onCheckedChange={(c) => set("accepts_change", !!c)} />
                <Label htmlFor="accepts_change" className="text-sm font-normal cursor-pointer">Aceita troco</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="auto_settle" checked={form.auto_settle} onCheckedChange={(c) => set("auto_settle", !!c)} />
                <Label htmlFor="auto_settle" className="text-sm font-normal cursor-pointer">Liquidação automática</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="allows_installments" checked={form.allows_installments} onCheckedChange={(c) => set("allows_installments", !!c)} />
                <Label htmlFor="allows_installments" className="text-sm font-normal cursor-pointer">Permite parcelamento</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="requires_auth" checked={form.requires_authorization_code} onCheckedChange={(c) => set("requires_authorization_code", !!c)} />
                <Label htmlFor="requires_auth" className="text-sm font-normal cursor-pointer">Exige código/NSU</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="requires_due" checked={form.requires_due_date} onCheckedChange={(c) => set("requires_due_date", !!c)} />
                <Label htmlFor="requires_due" className="text-sm font-normal cursor-pointer">Exige vencimento</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is_default" checked={form.is_default} onCheckedChange={(c) => set("is_default", !!c)} />
                <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">Padrão</Label>
              </div>
            </div>

            {form.allows_installments && (
              <div>
                <Label>Máximo de parcelas</Label>
                <Input type="number" min={1} max={48} value={form.max_installments} onChange={(e) => set("max_installments", parseInt(e.target.value) || 1)} />
              </div>
            )}

            {/* Fee */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Taxa</Label>
                <Select value={form.fee_type || "none"} onValueChange={(v) => set("fee_type", v === "none" ? undefined : v)}>
                  <SelectTrigger><SelectValue placeholder="Sem taxa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem taxa</SelectItem>
                    {FEE_TYPES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.fee_type && (
                <div>
                  <Label>Valor da Taxa</Label>
                  <Input type="number" min={0} step="0.01" value={form.fee_value || 0} onChange={(e) => set("fee_value", parseFloat(e.target.value) || 0)} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
