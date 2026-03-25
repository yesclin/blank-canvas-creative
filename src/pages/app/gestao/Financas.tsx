import { useState, useCallback, useMemo } from "react";
import { DollarSign, Plus, Search, TrendingUp, TrendingDown, Wallet, Package, ArrowUpCircle, ArrowDownCircle, Edit, Calendar, CreditCard, Users, Loader2, ExternalLink, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  useTodayTransactions, 
  useFinanceCategories, 
  useFinanceStats,
  useCreateTransaction,
  useUpdateTransaction,
  useMarkTransactionPaid,
  useTreatmentPackages,
  useCreateTreatmentPackage,
  type TransactionType,
  type FinanceTransaction,
} from "@/hooks/useFinanceTransactions";
import { paymentMethods, transactionOrigins, packageStatusLabels, packageStatusColors } from "@/types/gestao";
import { getTypeLabel } from "@/utils/financeEnumMapper";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarginAlertSettings } from "@/components/config/MarginAlertSettings";
import { ProductSaleSelector, type SelectedProduct } from "@/components/gestao/ProductSaleSelector";
import { AppointmentSaleSelector } from "@/components/gestao/AppointmentSaleSelector";
import { useCreateSale } from "@/hooks/useSales";
import { SaleDetailsDialog } from "@/components/gestao/SaleDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePatients } from "@/hooks/usePatients";
import { cn } from "@/lib/utils";
import type { PackageStatus } from "@/types/gestao";

export default function Financas() {
  const { data: transactions = [], isLoading } = useTodayTransactions();
  const { data: categories = [] } = useFinanceCategories();
  const { data: stats = { todayRevenue: 0, todayExpenses: 0, todayBalance: 0, transactionCount: 0 } } = useFinanceStats();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const markPaid = useMarkTransactionPaid();
  const createSale = useCreateSale();
  const { data: packages = [] } = useTreatmentPackages();
  const createPackage = useCreateTreatmentPackage();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [patientFilter, setPatientFilter] = useState<string | null>(null);
  const [patientFilterOpen, setPatientFilterOpen] = useState(false);
  const [patientFilterSearch, setPatientFilterSearch] = useState("");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("entrada");
  
  // Edit state
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Payment dialog state
  const [payingTransaction, setPayingTransaction] = useState<FinanceTransaction | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Sale details dialog state
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  
  // Form state for new transaction
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category_id: "",
    payment_method: "",
    origin: "",
    notes: "",
  });
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    description: "",
    amount: "",
    date: "",
    category_id: "",
    payment_method: "",
    origin: "",
    notes: "",
  });

  // Package form state
  const [packageForm, setPackageForm] = useState({
    patient_id: "",
    name: "",
    total_sessions: "",
    total_amount: "",
    paid_amount: "0",
    payment_method: "",
    valid_until: "",
    notes: "",
  });
  const [packagePatientOpen, setPackagePatientOpen] = useState(false);
  const [packagePatientSearch, setPackagePatientSearch] = useState("");

  // Product sale state
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSaleTotal, setProductSaleTotal] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  
  // Fetch patients for selector
  const { data: patients = [] } = usePatients();
  
  // Filter patients by search query
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery) return patients.slice(0, 50);
    const query = patientSearchQuery.toLowerCase();
    return patients.filter(p => 
      p.full_name.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [patients, patientSearchQuery]);
  
  // Get selected patient name
  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // Package patient filtering
  const filteredPackagePatients = useMemo(() => {
    if (!packagePatientSearch) return patients.slice(0, 50);
    const q = packagePatientSearch.toLowerCase();
    return patients.filter(p => p.full_name.toLowerCase().includes(q)).slice(0, 50);
  }, [patients, packagePatientSearch]);

  const selectedPackagePatient = useMemo(() => 
    patients.find(p => p.id === packageForm.patient_id),
    [patients, packageForm.patient_id]
  );
  
  // Fetch sales linked to current transactions
  const transactionIds = transactions.map(t => t.id);
  const { data: linkedSales = [] } = useQuery({
    queryKey: ["linked-sales", transactionIds],
    queryFn: async () => {
      if (transactionIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("sales")
        .select("id, transaction_id, sale_number")
        .in("transaction_id", transactionIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: transactionIds.length > 0,
  });
  
  // Create a map of transaction_id -> sale for quick lookup
  const saleByTransactionId = new Map<string, any>(
    linkedSales.map((s: any) => [s.transaction_id, s])
  );
  
  const handleViewSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    setIsSaleDialogOpen(true);
  };

  const handleProductTotalChange = useCallback((total: number) => {
    setProductSaleTotal(total);
    setFormData(prev => ({ ...prev, amount: total.toString() }));
  }, []);

  // Filter patients for the filter dropdown
  const filteredPatientsForFilter = useMemo(() => {
    if (!patientFilterSearch) return patients.slice(0, 50);
    const query = patientFilterSearch.toLowerCase();
    return patients.filter(p => 
      p.full_name.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [patients, patientFilterSearch]);
  
  // Get selected patient name for filter display
  const selectedFilterPatient = useMemo(() => 
    patients.find(p => p.id === patientFilter),
    [patients, patientFilter]
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.uiType === typeFilter;
    const matchesPatient = !patientFilter || transaction.patient_id === patientFilter;
    return matchesSearch && matchesType && matchesPatient;
  });

  // --- Edit handlers ---
  const handleEditTransaction = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      description: transaction.description,
      amount: String(transaction.amount),
      date: transaction.transaction_date,
      category_id: transaction.category_id || "",
      payment_method: transaction.payment_method || "",
      origin: transaction.origin || "",
      notes: transaction.notes || "",
    });
    setTransactionType(transaction.uiType);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    await updateTransaction.mutateAsync({
      id: editingTransaction.id,
      data: {
        type: transactionType,
        description: editFormData.description,
        amount: parseFloat(editFormData.amount),
        transaction_date: editFormData.date,
        category_id: editFormData.category_id || undefined,
        payment_method: editFormData.payment_method || undefined,
        origin: editFormData.origin || undefined,
        notes: editFormData.notes || undefined,
      },
    });
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
  };

  // --- Payment/baixa handlers ---
  const handleOpenPayment = (transaction: FinanceTransaction) => {
    setPayingTransaction(transaction);
    setPaymentMethod(transaction.payment_method || "");
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!payingTransaction) return;
    await markPaid.mutateAsync({
      id: payingTransaction.id,
      payment_method: paymentMethod || undefined,
    });
    setIsPaymentDialogOpen(false);
    setPayingTransaction(null);
    setPaymentMethod("");
  };

  const handleSubmitTransaction = async () => {
    const isProductSale = transactionType === 'entrada' && formData.origin === 'produto';
    
    if (isProductSale) {
      if (selectedProducts.length === 0) return;
      
      await createSale.mutateAsync({
        sale_date: formData.date,
        patient_id: selectedPatientId || undefined,
        appointment_id: selectedAppointmentId || undefined,
        payment_method: formData.payment_method || undefined,
        payment_status: 'pago',
        notes: formData.notes || undefined,
        items: selectedProducts.map(sp => ({
          product_id: sp.product.id,
          product_name: sp.product.name,
          quantity: sp.quantity,
          unit_price: sp.product.sale_price,
        })),
      });
    } else {
      if (!formData.description || !formData.amount) return;
      
      await createTransaction.mutateAsync({
        type: transactionType,
        description: formData.description,
        amount: parseFloat(formData.amount),
        transaction_date: formData.date,
        category_id: formData.category_id || undefined,
        payment_method: formData.payment_method || undefined,
        origin: formData.origin || undefined,
        notes: formData.notes || undefined,
      });
    }

    resetTransactionForm();
    setIsTransactionDialogOpen(false);
  };

  // --- Package handlers ---
  const handleSubmitPackage = async () => {
    if (!packageForm.patient_id || !packageForm.name || !packageForm.total_sessions || !packageForm.total_amount) return;
    
    await createPackage.mutateAsync({
      patient_id: packageForm.patient_id,
      name: packageForm.name,
      total_sessions: parseInt(packageForm.total_sessions),
      total_amount: parseFloat(packageForm.total_amount),
      paid_amount: parseFloat(packageForm.paid_amount) || 0,
      payment_method: packageForm.payment_method || undefined,
      valid_until: packageForm.valid_until || undefined,
      notes: packageForm.notes || undefined,
    });
    
    setPackageForm({
      patient_id: "",
      name: "",
      total_sessions: "",
      total_amount: "",
      paid_amount: "0",
      payment_method: "",
      valid_until: "",
      notes: "",
    });
    setIsPackageDialogOpen(false);
  };

  const resetTransactionForm = () => {
    setFormData({
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      category_id: "",
      payment_method: "",
      origin: "",
      notes: "",
    });
    setSelectedProducts([]);
    setProductSaleTotal(0);
    setSelectedPatientId(null);
    setSelectedAppointmentId(null);
    setPatientSearchQuery("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodLabel = (method?: string) => {
    return paymentMethods.find(m => m.value === method)?.label || method || "-";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Financeiro
        </h1>
        <p className="text-muted-foreground mt-1">
          Controle financeiro operacional da clínica
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">recebido no dia</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas Hoje</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.todayExpenses)}</div>
            <p className="text-xs text-muted-foreground">pago no dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Dia</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.todayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.todayBalance)}
            </div>
            <p className="text-xs text-muted-foreground">entradas - saídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              registradas hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Movimentações</TabsTrigger>
          <TabsTrigger value="packages">Pacotes</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transação..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Patient Filter */}
              <Popover open={patientFilterOpen} onOpenChange={setPatientFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={patientFilterOpen}
                    className={cn(
                      "w-[200px] justify-between",
                      patientFilter && "text-foreground"
                    )}
                  >
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedFilterPatient ? selectedFilterPatient.full_name : "Paciente"}
                    {patientFilter && (
                      <span
                        className="ml-auto text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientFilter(null);
                          setPatientFilterSearch("");
                        }}
                      >
                        ×
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar paciente..." 
                      value={patientFilterSearch}
                      onValueChange={setPatientFilterSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {filteredPatientsForFilter.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            value={patient.id}
                            onSelect={() => {
                              setPatientFilter(patient.id);
                              setPatientFilterOpen(false);
                              setPatientFilterSearch("");
                            }}
                          >
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {patient.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                  <DialogDescription>
                    Registre uma entrada ou saída financeira
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Tipo *</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant={transactionType === 'entrada' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setTransactionType('entrada')}
                      >
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        Entrada
                      </Button>
                      <Button 
                        type="button"
                        variant={transactionType === 'saida' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setTransactionType('saida')}
                      >
                        <ArrowUpCircle className="h-4 w-4 mr-2" />
                        Saída
                      </Button>
                    </div>
                  </div>
                  {/* Hide description/amount for product sales - they're auto-generated */}
                  {!(transactionType === 'entrada' && formData.origin === 'produto') && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Descrição *</Label>
                        <Input 
                          id="description" 
                          placeholder="Ex: Consulta particular"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Valor (R$) *</Label>
                          <Input 
                            id="amount" 
                            type="number" 
                            min="0" 
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="date">Data *</Label>
                          <Input 
                            id="date" 
                            type="date" 
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Date field for product sales */}
                  {transactionType === 'entrada' && formData.origin === 'produto' && (
                    <div className="grid gap-2">
                      <Label htmlFor="date">Data *</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select 
                        value={formData.category_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.uiType === transactionType).map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="payment_method">Forma de Pagamento</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {transactionType === 'entrada' && (
                    <div className="grid gap-2">
                      <Label htmlFor="origin">Origem</Label>
                      <Select
                        value={formData.origin}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, origin: value }));
                          if (value !== 'produto') {
                            setSelectedProducts([]);
                            setProductSaleTotal(0);
                            setSelectedPatientId(null);
                            setSelectedAppointmentId(null);
                            setPatientSearchQuery("");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionOrigins.map((origin) => (
                            <SelectItem key={origin.value} value={origin.value}>{origin.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Patient Selector for Product Sales */}
                  {transactionType === 'entrada' && formData.origin === 'produto' && (
                    <div className="grid gap-2">
                      <Label>Paciente (opcional)</Label>
                      <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={patientSearchOpen}
                            className="w-full justify-between font-normal"
                          >
                            {selectedPatient ? (
                              <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {selectedPatient.full_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Selecionar paciente...</span>
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar paciente por nome..."
                              value={patientSearchQuery}
                              onValueChange={setPatientSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                              <CommandGroup>
                                {selectedPatientId && (
                                  <CommandItem
                                    value="clear"
                                    onSelect={() => {
                                      setSelectedPatientId(null);
                                      setSelectedAppointmentId(null);
                                      setPatientSearchOpen(false);
                                    }}
                                    className="text-muted-foreground"
                                  >
                                    <span className="text-sm">Limpar seleção</span>
                                  </CommandItem>
                                )}
                                {filteredPatients.map((patient) => (
                                  <CommandItem
                                    key={patient.id}
                                    value={patient.id}
                                    onSelect={() => {
                                      if (selectedPatientId !== patient.id) {
                                        setSelectedAppointmentId(null);
                                      }
                                      setSelectedPatientId(patient.id);
                                      setPatientSearchOpen(false);
                                      setPatientSearchQuery("");
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className={cn(
                                        "font-medium",
                                        selectedPatientId === patient.id && "text-primary"
                                      )}>
                                        {patient.full_name}
                                      </span>
                                      {patient.phone && (
                                        <span className="text-xs text-muted-foreground">
                                          {patient.phone}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        Vincule a venda a um paciente ou deixe em branco para venda avulsa
                      </p>
                    </div>
                  )}
                  
                  {/* Appointment Selector for Product Sales */}
                  {transactionType === 'entrada' && formData.origin === 'produto' && (
                    <AppointmentSaleSelector
                      patientId={selectedPatientId}
                      selectedAppointmentId={selectedAppointmentId}
                      onSelect={setSelectedAppointmentId}
                      disabled={createSale.isPending}
                    />
                  )}
                  
                  {/* Product Sale Selector */}
                  {transactionType === 'entrada' && formData.origin === 'produto' && (
                    <ProductSaleSelector
                      selectedProducts={selectedProducts}
                      onProductsChange={setSelectedProducts}
                      onTotalChange={handleProductTotalChange}
                      disabled={createSale.isPending}
                    />
                  )}
                  <div className="grid gap-2">
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
                  <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitTransaction}
                    disabled={
                      (createTransaction.isPending || createSale.isPending) || 
                      (transactionType === 'entrada' && formData.origin === 'produto' 
                        ? selectedProducts.length === 0 
                        : (!formData.description || !formData.amount))
                    }
                  >
                    {(createTransaction.isPending || createSale.isPending) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const linkedSale = saleByTransactionId.get(transaction.id);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{transaction.description}</span>
                              {linkedSale && (
                                <button
                                  onClick={() => handleViewSale(linkedSale.id)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Ver venda {linkedSale.sale_number}
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.patients ? (
                              <a 
                                href={`/app/prontuario/${transaction.patient_id}`}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <User className="h-3 w-3" />
                                {transaction.patients.full_name}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.uiType === 'entrada' ? 'default' : 'destructive'}
                            >
                              {transaction.uiType === 'entrada' && <ArrowDownCircle className="h-3 w-3 mr-1" />}
                              {transaction.uiType === 'saida' && <ArrowUpCircle className="h-3 w-3 mr-1" />}
                              {getTypeLabel(transaction.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'pago' ? 'default' : 'secondary'}>
                              {transaction.status === 'pago' ? 'Pago' : transaction.status === 'pendente' ? 'Pendente' : transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              {getPaymentMethodLabel(transaction.payment_method)}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${transaction.uiType === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.uiType === 'saida' ? '- ' : '+ '}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {transaction.status === 'pendente' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Marcar como pago"
                                  onClick={() => handleOpenPayment(transaction)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Editar transação"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pacote
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Novo Pacote de Tratamento</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo pacote de sessões para o paciente
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Paciente *</Label>
                    <Popover open={packagePatientOpen} onOpenChange={setPackagePatientOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          {selectedPackagePatient ? (
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {selectedPackagePatient.full_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Selecionar paciente...</span>
                          )}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar paciente..."
                            value={packagePatientSearch}
                            onValueChange={setPackagePatientSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {filteredPackagePatients.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={patient.id}
                                  onSelect={() => {
                                    setPackageForm(prev => ({ ...prev, patient_id: patient.id }));
                                    setPackagePatientOpen(false);
                                    setPackagePatientSearch("");
                                  }}
                                >
                                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {patient.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="package_name">Nome do Pacote *</Label>
                    <Input 
                      id="package_name" 
                      placeholder="Ex: Pacote 10 sessões de Limpeza"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="total_sessions">Total de Sessões *</Label>
                      <Input 
                        id="total_sessions" 
                        type="number" 
                        min="1"
                        value={packageForm.total_sessions}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, total_sessions: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="total_amount">Valor Total (R$) *</Label>
                      <Input 
                        id="total_amount" 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={packageForm.total_amount}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, total_amount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="paid_amount">Valor Pago (R$)</Label>
                      <Input 
                        id="paid_amount" 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={packageForm.paid_amount}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, paid_amount: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valid_until">Validade</Label>
                      <Input 
                        id="valid_until" 
                        type="date"
                        value={packageForm.valid_until}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, valid_until: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={packageForm.payment_method}
                      onValueChange={(value) => setPackageForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea 
                      placeholder="Observações adicionais..."
                      value={packageForm.notes}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitPackage}
                    disabled={createPackage.isPending || !packageForm.patient_id || !packageForm.name || !packageForm.total_sessions || !packageForm.total_amount}
                  >
                    {createPackage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Package list from real data */}
          {packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pacote cadastrado</p>
              <p className="text-sm mt-2">Crie pacotes de sessões para seus pacientes.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Pacote</TableHead>
                      <TableHead>Sessões</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Validade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg: any) => {
                      const progress = pkg.total_sessions > 0 ? (pkg.used_sessions / pkg.total_sessions) * 100 : 0;
                      const status = (pkg.status || 'ativo') as PackageStatus;
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">
                            {pkg.patients?.full_name || '-'}
                          </TableCell>
                          <TableCell>{pkg.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{pkg.used_sessions}/{pkg.total_sessions}</span>
                              <Progress value={progress} className="w-16 h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(pkg.total_amount)}</TableCell>
                          <TableCell>{formatCurrency(pkg.paid_amount)}</TableCell>
                          <TableCell>
                            <Badge className={packageStatusColors[status] || ''}>
                              {packageStatusLabels[status] || status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pkg.valid_until ? format(new Date(pkg.valid_until), "dd/MM/yyyy") : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  Categorias de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.filter(c => c.uiType === 'entrada').map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  Categorias de Saída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.filter(c => c.uiType === 'saida').map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <MarginAlertSettings />
        </TabsContent>
      </Tabs>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>Altere os dados da transação</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={transactionType === 'entrada' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionType('entrada')}
                >
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Entrada
                </Button>
                <Button 
                  type="button"
                  variant={transactionType === 'saida' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionType('saida')}
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Saída
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descrição *</Label>
              <Input 
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valor (R$) *</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data *</Label>
                <Input 
                  type="date" 
                  value={editFormData.date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select 
                  value={editFormData.category_id}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.uiType === transactionType).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={editFormData.payment_method}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea 
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateTransaction.isPending || !editFormData.description || !editFormData.amount}
            >
              {updateTransaction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Marcar transação como paga
              {payingTransaction && (
                <span className="block mt-1 font-medium text-foreground">
                  {payingTransaction.description} — {formatCurrency(payingTransaction.amount)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleConfirmPayment}
              disabled={markPaid.isPending}
            >
              {markPaid.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        saleId={selectedSaleId}
        open={isSaleDialogOpen}
        onOpenChange={setIsSaleDialogOpen}
      />
    </div>
  );
}
