import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSubmitPreRegistration } from "@/hooks/usePreRegistration";
import { toast } from "sonner";

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cleaned[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(cleaned[10]) === check;
}

const schema = z.object({
  full_name: z.string().min(3, "Nome obrigatório (mínimo 3 caracteres)").max(200),
  birth_date: z.string().optional(),
  cpf: z.string().optional().refine(
    (val) => !val || val.replace(/\D/g, "").length === 0 || isValidCPF(val),
    "CPF inválido"
  ),
  gender: z.string().optional(),
  phone: z.string().min(8, "Telefone obrigatório").max(20),
  email: z.string().optional().refine(
    (val) => !val || val.length === 0 || z.string().email().safeParse(val).success,
    "E-mail inválido"
  ),
  address_zip: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  insurance_name: z.string().optional(),
  insurance_card_number: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_cpf: z.string().optional(),
  guardian_phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PreRegistrationFormProps {
  link: {
    token: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    clinic_name: string;
    patient_data?: {
      full_name: string | null;
      birth_date: string | null;
      cpf: string | null;
      gender: string | null;
      phone: string | null;
      email: string | null;
      address_street: string | null;
      address_number: string | null;
      address_complement: string | null;
      address_neighborhood: string | null;
      address_city: string | null;
      address_state: string | null;
      address_zip: string | null;
      notes: string | null;
    } | null;
    insurance_data?: {
      insurance_name: string | null;
      card_number: string | null;
    } | null;
    guardian_data?: {
      guardian_name: string | null;
      guardian_cpf: string | null;
      guardian_phone: string | null;
      guardian_relationship: string | null;
    } | null;
  };
}

/** Map gender from DB (M/F/O) to form values */
function mapGenderToForm(gender: string | null | undefined): string {
  if (!gender) return "";
  const map: Record<string, string> = { M: "masculino", F: "feminino", O: "outro" };
  return map[gender] || gender;
}

/** Build initial values prioritizing patient_data > link snapshot > empty */
function buildInitialValues(link: PreRegistrationFormProps["link"]): FormData {
  const p = link.patient_data;
  const ins = link.insurance_data;
  const g = link.guardian_data;

  return {
    full_name: p?.full_name || link.full_name || "",
    birth_date: p?.birth_date || "",
    cpf: p?.cpf || "",
    gender: mapGenderToForm(p?.gender),
    phone: p?.phone || link.phone || "",
    email: p?.email || link.email || "",
    address_zip: p?.address_zip || "",
    address_street: p?.address_street || "",
    address_number: p?.address_number || "",
    address_complement: p?.address_complement || "",
    address_neighborhood: p?.address_neighborhood || "",
    address_city: p?.address_city || "",
    address_state: p?.address_state || "",
    insurance_name: ins?.insurance_name || "",
    insurance_card_number: ins?.card_number || "",
    guardian_name: g?.guardian_name || "",
    guardian_cpf: g?.guardian_cpf || "",
    guardian_phone: g?.guardian_phone || "",
    notes: p?.notes || "",
  };
}

export function PreRegistrationForm({ link }: PreRegistrationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = useSubmitPreRegistration();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildInitialValues(link),
  });

  // Reset form when link data changes (e.g. after async load)
  useEffect(() => {
    form.reset(buildInitialValues(link));
  }, [link.patient_data, link.insurance_data, link.guardian_data]);

  const onSubmit = async (values: FormData) => {
    try {
      await submitMutation.mutateAsync({
        token: link.token,
        data: values,
      });
      setSubmitted(true);
      toast.success("Pré-cadastro enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar pré-cadastro");
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Pré-cadastro enviado!</h2>
          <p className="text-muted-foreground">
            Obrigado por preencher seus dados. A clínica {link.clinic_name} já recebeu suas informações.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pré-cadastro</CardTitle>
        <CardDescription>
          Preencha seus dados para agilizar seu atendimento na {link.clinic_name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados pessoais */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground mb-2">Dados Pessoais</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome completo *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="birth_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cpf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="nao_informado">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </fieldset>

            {/* Endereço */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground mb-2">Endereço</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="address_zip" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address_street" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address_complement" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address_neighborhood" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address_city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address_state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl><Input placeholder="UF" maxLength={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </fieldset>

            {/* Convênio */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground mb-2">Convênio (opcional)</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="insurance_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Convênio</FormLabel>
                    <FormControl><Input placeholder="Nome do convênio" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="insurance_card_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº da carteirinha</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </fieldset>

            {/* Responsável Legal */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground mb-2">Responsável Legal (se aplicável)</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="guardian_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_cpf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do responsável</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="guardian_phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do responsável</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </fieldset>

            {/* Observações */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Informações adicionais que deseja compartilhar..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
              {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Pré-cadastro
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
