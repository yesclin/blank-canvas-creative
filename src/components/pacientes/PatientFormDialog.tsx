import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Building2, AlertTriangle, Users, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { PatientFormData, Patient } from '@/types/pacientes';
import { brazilianStates, relationshipOptions, maritalStatusOptions } from '@/types/pacientes';
import { maskCEP, validateCEP, fetchAddressFromCEP } from '@/lib/validators';
import { toast } from 'sonner';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  insurances: { id: string; name: string }[];
  onSave: (data: PatientFormData) => void;
  isSaving?: boolean;
}

const initialFormData: PatientFormData = {
  full_name: '',
  birth_date: '',
  gender: '',
  cpf: '',
  rg: '',
  marital_status: '',
  phone: '',
  email: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  notes: '',
  payment_type: 'particular',
  insurance_id: '',
  card_number: '',
  valid_until: '',
  plan_name: '',
  has_guardian: false,
  guardian_name: '',
  guardian_relationship: '',
  guardian_cpf: '',
  guardian_rg: '',
  guardian_phone: '',
  guardian_email: '',
  allergies: '',
  chronic_diseases: '',
  current_medications: '',
  clinical_restrictions: '',
};

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  insurances,
  onSave,
  isSaving = false,
}: PatientFormDialogProps) {
  const buildFormData = (p: Patient | null | undefined): PatientFormData => {
    if (!p) return initialFormData;
    const pa = p as any;
    const insurance = pa.insurance || (pa.patient_insurances && pa.patient_insurances[0]) || null;
    const guardian = pa.guardian || (pa.patient_guardians && pa.patient_guardians[0]) || null;
    const clinical = pa.clinical_data || (pa.patient_clinical_data && pa.patient_clinical_data[0]) || null;

    return {
      ...initialFormData,
      full_name: p.full_name,
      birth_date: p.birth_date || '',
      gender: p.gender || '',
      cpf: p.cpf || '',
      rg: pa.rg || '',
      marital_status: pa.marital_status || '',
      phone: p.phone || '',
      email: p.email || '',
      address_street: p.address_street || '',
      address_number: p.address_number || '',
      address_complement: p.address_complement || '',
      address_neighborhood: p.address_neighborhood || '',
      address_city: p.address_city || '',
      address_state: p.address_state || '',
      address_zip: p.address_zip || '',
      notes: p.notes || '',
      payment_type: insurance ? 'insurance' : 'particular',
      insurance_id: insurance?.insurance_id || '',
      card_number: insurance?.card_number || '',
      valid_until: insurance?.valid_until || '',
      plan_name: insurance?.plan_name || '',
      has_guardian: !!guardian,
      guardian_name: guardian?.full_name || '',
      guardian_relationship: guardian?.relationship || '',
      guardian_cpf: guardian?.cpf || '',
      guardian_rg: guardian?.rg || '',
      guardian_phone: guardian?.phone || '',
      guardian_email: guardian?.email || '',
      allergies: clinical?.allergies?.join?.(', ') || '',
      chronic_diseases: clinical?.chronic_diseases?.join?.(', ') || '',
      current_medications: clinical?.current_medications?.join?.(', ') || '',
      clinical_restrictions: clinical?.clinical_restrictions || '',
    };
  };

  const [formData, setFormData] = useState<PatientFormData>(() => buildFormData(patient));

  const [activeTab, setActiveTab] = useState('identification');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Sync form data when dialog opens or patient prop changes
  useEffect(() => {
    if (open) {
      setFormData(buildFormData(patient));
      setActiveTab('identification');
    }
  }, [open, patient]);

  const handleChange = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = (value: string) => {
    const masked = maskCEP(value);
    handleChange('address_zip', masked);
  };

  const searchCEP = async () => {
    const cleanCEP = formData.address_zip.replace(/\D/g, '');
    if (!validateCEP(cleanCEP)) {
      toast.error('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setIsSearchingCep(true);
    try {
      const result = await fetchAddressFromCEP(cleanCEP);
      if (result) {
        setFormData(prev => ({
          ...prev,
          address_street: result.logradouro || prev.address_street,
          address_neighborhood: result.bairro || prev.address_neighborhood,
          address_city: result.localidade || prev.address_city,
          address_state: result.uf || prev.address_state,
        }));
        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado. Preencha manualmente.');
      }
    } catch {
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCEP = formData.address_zip.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      await searchCEP();
    }
  };

  const handleSubmit = () => {
    if (!formData.full_name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    onSave(formData);
  };

  const isEditing = !!patient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identification" className="text-xs sm:text-sm">
                <User className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Identificação
              </TabsTrigger>
              <TabsTrigger value="address" className="text-xs sm:text-sm">
                <MapPin className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs sm:text-sm">
                <Building2 className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Convênio
              </TabsTrigger>
              <TabsTrigger value="clinical" className="text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Clínico
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 pt-4 pb-6">
              {/* Identification Tab */}
              <TabsContent value="identification" className="m-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      placeholder="Nome completo do paciente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Sexo</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleChange('gender', value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleChange('rg', e.target.value)}
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marital_status">Estado Civil</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={(value) => handleChange('marital_status', value)}
                    >
                      <SelectTrigger id="marital_status">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Guardian Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Label>Responsável Legal</Label>
                    </div>
                    <Switch
                      checked={formData.has_guardian}
                      onCheckedChange={(checked) => handleChange('has_guardian', checked)}
                    />
                  </div>

                  {formData.has_guardian && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="md:col-span-2">
                        <Label htmlFor="guardian_name">Nome do Responsável</Label>
                        <Input
                          id="guardian_name"
                          value={formData.guardian_name}
                          onChange={(e) => handleChange('guardian_name', e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_relationship">Parentesco</Label>
                        <Select
                          value={formData.guardian_relationship}
                          onValueChange={(value) => handleChange('guardian_relationship', value)}
                        >
                          <SelectTrigger id="guardian_relationship">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipOptions.map((rel) => (
                              <SelectItem key={rel} value={rel}>
                                {rel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="guardian_cpf">CPF do Responsável</Label>
                        <Input
                          id="guardian_cpf"
                          value={formData.guardian_cpf}
                          onChange={(e) => handleChange('guardian_cpf', e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_rg">RG do Responsável</Label>
                        <Input
                          id="guardian_rg"
                          value={formData.guardian_rg || ''}
                          onChange={(e) => handleChange('guardian_rg', e.target.value)}
                          placeholder="00.000.000-0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_phone">Telefone</Label>
                        <Input
                          id="guardian_phone"
                          value={formData.guardian_phone}
                          onChange={(e) => handleChange('guardian_phone', e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardian_email">E-mail</Label>
                        <Input
                          id="guardian_email"
                          type="email"
                          value={formData.guardian_email}
                          onChange={(e) => handleChange('guardian_email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Address Tab */}
              <TabsContent value="address" className="m-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address_zip">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address_zip"
                        value={formData.address_zip}
                        onChange={(e) => handleCepChange(e.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        maxLength={9}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={searchCEP}
                        disabled={isSearchingCep}
                      >
                        {isSearchingCep ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite o CEP para preencher automaticamente
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="address_street">Rua / Logradouro</Label>
                    <Input
                      id="address_street"
                      value={formData.address_street}
                      onChange={(e) => handleChange('address_street', e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_number">Número</Label>
                    <Input
                      id="address_number"
                      value={formData.address_number}
                      onChange={(e) => handleChange('address_number', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_complement">Complemento</Label>
                    <Input
                      id="address_complement"
                      value={formData.address_complement}
                      onChange={(e) => handleChange('address_complement', e.target.value)}
                      placeholder="Apto, Sala, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_neighborhood">Bairro</Label>
                    <Input
                      id="address_neighborhood"
                      value={formData.address_neighborhood}
                      onChange={(e) => handleChange('address_neighborhood', e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address_city">Cidade</Label>
                    <Input
                      id="address_city"
                      value={formData.address_city}
                      onChange={(e) => handleChange('address_city', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_state">Estado</Label>
                    <Select
                      value={formData.address_state}
                      onValueChange={(value) => handleChange('address_state', value)}
                    >
                      <SelectTrigger id="address_state">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" className="m-0 space-y-4">
                <div>
                  <Label>Tipo de Atendimento</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={formData.payment_type === 'particular' ? 'default' : 'outline'}
                      onClick={() => handleChange('payment_type', 'particular')}
                      className="flex-1"
                    >
                      Particular
                    </Button>
                    <Button
                      type="button"
                      variant={formData.payment_type === 'insurance' ? 'default' : 'outline'}
                      onClick={() => handleChange('payment_type', 'insurance')}
                      className="flex-1"
                    >
                      Convênio
                    </Button>
                  </div>
                </div>

                {formData.payment_type === 'insurance' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div>
                      <Label htmlFor="insurance_id">Convênio</Label>
                      <Select
                        value={formData.insurance_id}
                        onValueChange={(value) => handleChange('insurance_id', value)}
                      >
                        <SelectTrigger id="insurance_id">
                          <SelectValue placeholder="Selecione o convênio" />
                        </SelectTrigger>
                        <SelectContent>
                          {insurances.map((ins) => (
                            <SelectItem key={ins.id} value={ins.id}>
                              {ins.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card_number">Número da Carteirinha</Label>
                        <Input
                          id="card_number"
                          value={formData.card_number}
                          onChange={(e) => handleChange('card_number', e.target.value)}
                          placeholder="Número"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valid_until">Validade</Label>
                        <Input
                          id="valid_until"
                          type="date"
                          value={formData.valid_until}
                          onChange={(e) => handleChange('valid_until', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="plan_name">Nome do Plano</Label>
                      <Input
                        id="plan_name"
                        value={formData.plan_name}
                        onChange={(e) => handleChange('plan_name', e.target.value)}
                        placeholder="Ex: Plano Ouro, Executivo, etc."
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Observações Administrativas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Observações gerais sobre o paciente..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Clinical Tab */}
              <TabsContent value="clinical" className="m-0 space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Estes dados alimentam os <strong>Alertas Clínicos</strong> exibidos no Prontuário e na Agenda.
                  </p>
                </div>

                <div>
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                    placeholder="Liste as alergias separadas por vírgula..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="chronic_diseases">Doenças Pré-existentes</Label>
                  <Textarea
                    id="chronic_diseases"
                    value={formData.chronic_diseases}
                    onChange={(e) => handleChange('chronic_diseases', e.target.value)}
                    placeholder="Liste as doenças crônicas separadas por vírgula..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="current_medications">Medicamentos em Uso</Label>
                  <Textarea
                    id="current_medications"
                    value={formData.current_medications}
                    onChange={(e) => handleChange('current_medications', e.target.value)}
                    placeholder="Liste os medicamentos separados por vírgula..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="clinical_restrictions">Restrições Clínicas Importantes</Label>
                  <Textarea
                    id="clinical_restrictions"
                    value={formData.clinical_restrictions}
                    onChange={(e) => handleChange('clinical_restrictions', e.target.value)}
                    placeholder="Outras restrições ou observações clínicas relevantes..."
                    rows={3}
                  />
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 p-6 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
