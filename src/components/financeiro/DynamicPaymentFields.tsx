import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PIX_KEY_TYPES,
  ACCOUNT_TYPES,
  CARD_BRANDS,
  type PaymentMethodFormData,
} from "@/hooks/usePaymentMethods";

interface Props {
  form: PaymentMethodFormData;
  set: (key: string, value: any) => void;
}

export default function DynamicPaymentFields({ form, set }: Props) {
  const t = form.method_type;

  // Helper for bank fields
  const bankFields = (
    requireAll = false,
    showAccountType = false,
    showHolder = false
  ) => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Banco</Label>
          <Input
            value={form.bank_name || ""}
            onChange={(e) => set("bank_name", e.target.value)}
            placeholder="Nome do banco"
          />
        </div>
        <div>
          <Label>Código do Banco</Label>
          <Input
            value={form.bank_code || ""}
            onChange={(e) => set("bank_code", e.target.value)}
            placeholder="Ex: 001"
            maxLength={10}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Agência {requireAll && "*"}</Label>
          <Input
            value={form.agency || ""}
            onChange={(e) => set("agency", e.target.value)}
            placeholder="0001"
          />
        </div>
        <div>
          <Label>Conta {requireAll && "*"}</Label>
          <Input
            value={form.account_number || ""}
            onChange={(e) => set("account_number", e.target.value)}
            placeholder="12345"
          />
        </div>
        <div>
          <Label>Dígito</Label>
          <Input
            value={form.account_digit || ""}
            onChange={(e) => set("account_digit", e.target.value)}
            maxLength={2}
            placeholder="0"
          />
        </div>
      </div>
      {showAccountType && (
        <div>
          <Label>Tipo de Conta</Label>
          <Select
            value={form.account_type || "none"}
            onValueChange={(v) => set("account_type", v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Selecione</SelectItem>
              {ACCOUNT_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showHolder && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Titular</Label>
            <Input
              value={form.account_holder_name || ""}
              onChange={(e) => set("account_holder_name", e.target.value)}
            />
          </div>
          <div>
            <Label>CPF/CNPJ do Titular</Label>
            <Input
              value={form.account_holder_document || ""}
              onChange={(e) => set("account_holder_document", e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  );

  const feeFields = (showInstallments = false) => (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Taxa (%)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.fee_percent || 0}
            onChange={(e) => set("fee_percent", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Taxa Fixa (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.fixed_fee || 0}
            onChange={(e) => set("fixed_fee", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Prazo Repasse (dias)</Label>
          <Input
            type="number"
            min={0}
            value={form.settlement_days || 0}
            onChange={(e) =>
              set("settlement_days", parseInt(e.target.value) || 0)
            }
          />
        </div>
      </div>
      {showInstallments && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="allows_installments"
              checked={form.allows_installments}
              onCheckedChange={(c) => set("allows_installments", !!c)}
            />
            <Label
              htmlFor="allows_installments"
              className="text-sm font-normal cursor-pointer"
            >
              Permite parcelamento
            </Label>
          </div>
          {form.allows_installments && (
            <div>
              <Label>Máx. Parcelas</Label>
              <Input
                type="number"
                min={1}
                max={48}
                value={form.max_installments}
                onChange={(e) =>
                  set("max_installments", parseInt(e.target.value) || 1)
                }
              />
            </div>
          )}
        </div>
      )}
    </>
  );

  const acquirerFields = () => (
    <>
      <div>
        <Label>Adquirente / Operadora</Label>
        <Input
          value={form.acquirer_name || ""}
          onChange={(e) => set("acquirer_name", e.target.value)}
          placeholder="Ex: Cielo, Stone, PagSeguro"
        />
      </div>
      <div>
        <Label>Bandeiras Aceitas</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CARD_BRANDS.map((brand) => {
            const selected = form.card_brands?.includes(brand) || false;
            return (
              <label
                key={brand}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer transition-colors ${
                  selected
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const current = form.card_brands || [];
                    set(
                      "card_brands",
                      checked
                        ? [...current, brand]
                        : current.filter((b) => b !== brand)
                    );
                  }}
                  className="h-3 w-3"
                />
                {brand}
              </label>
            );
          })}
        </div>
      </div>
    </>
  );

  const entryAccountField = () => (
    <div>
      <Label>Conta Padrão de Entrada</Label>
      <Input
        value={form.default_entry_account || ""}
        onChange={(e) => set("default_entry_account", e.target.value)}
        placeholder="Nome ou identificador da conta"
      />
    </div>
  );

  switch (t) {
    case "dinheiro":
      return null; // Only name + description + active

    case "pix":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Chave PIX *</Label>
              <Select
                value={form.pix_key_type || "none"}
                onValueChange={(v) =>
                  set("pix_key_type", v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione</SelectItem>
                  {PIX_KEY_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chave PIX *</Label>
              <Input
                value={form.pix_key || ""}
                onChange={(e) => set("pix_key", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Favorecido</Label>
              <Input
                value={form.account_holder_name || ""}
                onChange={(e) => set("account_holder_name", e.target.value)}
              />
            </div>
            <div>
              <Label>CPF/CNPJ do Favorecido</Label>
              <Input
                value={form.account_holder_document || ""}
                onChange={(e) =>
                  set("account_holder_document", e.target.value)
                }
              />
            </div>
          </div>
          {bankFields(false)}
        </div>
      );

    case "transferencia_bancaria":
      return (
        <div className="space-y-3">
          {bankFields(true, true, true)}
        </div>
      );

    case "boleto":
      return (
        <div className="space-y-3">
          {bankFields(false, false, true)}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      );

    case "cartao_credito":
      return (
        <div className="space-y-3">
          {acquirerFields()}
          {feeFields(true)}
          {entryAccountField()}
        </div>
      );

    case "cartao_debito":
      return (
        <div className="space-y-3">
          {acquirerFields()}
          {feeFields(false)}
          {entryAccountField()}
        </div>
      );

    case "carteira_digital":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provedor</Label>
              <Input
                value={form.wallet_provider || ""}
                onChange={(e) => set("wallet_provider", e.target.value)}
                placeholder="Ex: PicPay, Mercado Pago"
              />
            </div>
            <div>
              <Label>Taxa (%)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.fee_percent || 0}
                onChange={(e) =>
                  set("fee_percent", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          {entryAccountField()}
        </div>
      );

    case "link_pagamento":
      return (
        <div className="space-y-3">
          <div>
            <Label>Provedor</Label>
            <Input
              value={form.wallet_provider || ""}
              onChange={(e) => set("wallet_provider", e.target.value)}
              placeholder="Ex: PagSeguro, Stripe"
            />
          </div>
          {feeFields(true)}
          {entryAccountField()}
        </div>
      );

    case "cheque":
      return (
        <div className="space-y-3">
          <div>
            <Label>Favorecido</Label>
            <Input
              value={form.account_holder_name || ""}
              onChange={(e) => set("account_holder_name", e.target.value)}
            />
          </div>
          {bankFields(false)}
          <div>
            <Label>Prazo de Compensação (dias)</Label>
            <Input
              type="number"
              min={0}
              value={form.settlement_days || 0}
              onChange={(e) =>
                set("settlement_days", parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
      );

    case "convenio":
      return (
        <div className="space-y-3">
          <div>
            <Label>Prazo Médio de Recebimento (dias)</Label>
            <Input
              type="number"
              min={0}
              value={form.settlement_days || 0}
              onChange={(e) =>
                set("settlement_days", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      );

    default:
      return (
        <div>
          <Label>Observações</Label>
          <Textarea
            value={form.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
          />
        </div>
      );
  }
}
