import { useState, useCallback, useMemo } from "react";
import { DollarSign, Plus, Search, TrendingUp, TrendingDown, Wallet, Package, ArrowUpCircle, ArrowDownCircle, Edit, Calendar, CreditCard, Users, Loader2, ExternalLink, User } from "lucide-react";
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
  type TransactionType,
} from "@/hooks/useFinanceTransactions";
import { transactionTypeLabels, paymentMethods, transactionOrigins, packageStatusLabels, packageStatusColors } from "@/types/gestao";
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

export default function Financas() {
  const { data: transactions = [], isLoading } = useTodayTransactions();
  const { data: categories = [] } = useFinanceCategories();
  const { data: stats = { todayRevenue: 0, todayExpenses: 0, todayBalance: 0, transactionCount: 0 } } = useFinanceStats();
  const createTransaction = useCreateTransaction();
  const createSale = useCreateSale();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [patientFilter, setPatientFilter] = useState<string | null>(null);
  const [patientFilterOpen, setPatientFilterOpen] = useState(false);
  const [patientFilterSearch, setPatientFilterSearch] = useState("");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("entrada");
  
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
  const saleByTransactionId = new Map(
    linkedSales.map((s) => [s.transaction_id, s])
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
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesPatient = !patientFilter || transaction.patient_id === patientFilter;
    return matchesSearch && matchesType && matchesPatient;
  });

  const handleSubmitTransaction = async () => {
    const isProductSale = transactionType === 'entrada' && formData.origin === 'produto';
    
    // For product sales, require selected products
    if (isProductSale) {
      if (selectedProducts.length === 0) return;
      
      // Create sale with products (this handles stock updates and transaction creation)
      // Patient and appointment are optional for manual sales
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
      // Regular transaction
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

    // Reset form
    resetTransactionForm();
    setIsTransactionDialogOpen(false);
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
                          placeholder="Ex: Consulta - Maria Silva"
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
                          {categories.filter(c => c.type === transactionType).map((cat) => (
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
                          // Reset product, patient, and appointment selection when origin changes
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
                                      // Clear appointment when patient changes
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
                  
                  {/* Appointment Selector for Product Sales (only shows when patient is selected) */}
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
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                              variant={transaction.type === 'entrada' ? 'default' : 'destructive'}
                            >
                              {transaction.type === 'entrada' && <ArrowDownCircle className="h-3 w-3 mr-1" />}
                              {transaction.type === 'saida' && <ArrowUpCircle className="h-3 w-3 mr-1" />}
                              {transactionTypeLabels[transaction.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              {getPaymentMethodLabel(transaction.payment_method)}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'saida' ? '- ' : '+ '}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
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
                    <Label htmlFor="patient">Paciente *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Maria Silva</SelectItem>
                        <SelectItem value="2">João Santos</SelectItem>
                        <SelectItem value="3">Ana Costa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="package_name">Nome do Pacote *</Label>
                    <Input id="package_name" placeholder="Ex: Pacote 10 sessões de Limpeza" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="total_sessions">Total de Sessões *</Label>
                      <Input id="total_sessions" type="number" min="1" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="total_amount">Valor Total (R$) *</Label>
                      <Input id="total_amount" type="number" min="0" step="0.01" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="paid_amount">Valor Pago (R$)</Label>
                      <Input id="paid_amount" type="number" min="0" step="0.01" defaultValue="0" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valid_until">Validade</Label>
                      <Input id="valid_until" type="date" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pkg_payment_method">Forma de Pagamento</Label>
                    <Select>
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
                    <Label htmlFor="pkg_notes">Observações</Label>
                    <Textarea id="pkg_notes" placeholder="Observações adicionais..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsPackageDialogOpen(false)}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Funcionalidade de pacotes em desenvolvimento</p>
            <p className="text-sm mt-2">Em breve você poderá criar pacotes de sessões para seus pacientes.</p>
          </div>
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
                    {categories.filter(c => c.type === 'entrada').map((category) => (
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
                    {categories.filter(c => c.type === 'saida').map((category) => (
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
      
      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        saleId={selectedSaleId}
        open={isSaleDialogOpen}
        onOpenChange={setIsSaleDialogOpen}
      />
    </div>
  );
}
