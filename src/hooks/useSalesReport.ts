import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SalesReportFilters } from "@/types/salesReport";

// =============================================
// TYPES
// =============================================

interface SaleRow {
  id: string;
  sale_date: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: number;
  discount_amount: number | null;
  patient_id: string | null;
  professional_id: string | null;
  created_by: string | null;
  canceled_by: string | null;
  patients: { id: string; full_name: string } | null;
  professionals: { id: string; full_name: string } | null;
  sale_items: { id: string; product_id: string }[];
}

interface ProfileRow {
  id: string;
  full_name: string;
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useSalesReport(filters: SalesReportFilters) {
  const startDate = format(filters.startDate, "yyyy-MM-dd");
  const endDate = format(filters.endDate, "yyyy-MM-dd");

  // Query vendas com todos os filtros
  const salesQuery = useQuery({
    queryKey: [
      "sales-report",
      startDate,
      endDate,
      filters.status,
      filters.productId,
      filters.patientId,
      filters.paymentMethod,
      filters.responsibleUserId,
    ],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          payment_status,
          payment_method,
          total_amount,
          discount_amount,
          patient_id,
          professional_id,
          created_by,
          canceled_by,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(id, product_id)
        `)
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`)
        .order("sale_date", { ascending: false });

      // Filtro de status
      if (filters.status === "active") {
        query = query.neq("payment_status", "cancelado");
      } else if (filters.status === "canceled") {
        query = query.eq("payment_status", "cancelado");
      }

      // Filtro por paciente
      if (filters.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      // Filtro por forma de pagamento
      if (filters.paymentMethod) {
        query = query.eq("payment_method", filters.paymentMethod);
      }

      // Filtro por usuário responsável (criou ou cancelou)
      if (filters.responsibleUserId) {
        query = query.or(`created_by.eq.${filters.responsibleUserId},canceled_by.eq.${filters.responsibleUserId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let sales = (data || []) as SaleRow[];

      // Filtro por produto (precisa ser feito client-side devido ao join)
      if (filters.productId) {
        sales = sales.filter((sale) =>
          sale.sale_items?.some((item) => item.product_id === filters.productId)
        );
      }

      // Coletar IDs únicos de usuários para buscar perfis
      const userIds = new Set<string>();
      sales.forEach((sale) => {
        if (sale.created_by) userIds.add(sale.created_by);
        if (sale.canceled_by) userIds.add(sale.canceled_by);
      });

      // Buscar perfis dos usuários
      let profilesMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(userIds));

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || "";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return { sales, profilesMap };
    },
  });

  // Processar dados
  const isLoading = salesQuery.isLoading;
  const isError = salesQuery.isError;

  const allSales = salesQuery.data?.sales || [];
  const profilesMap = salesQuery.data?.profilesMap || {};
  const activeSales = allSales.filter((s) => s.payment_status !== "cancelado");
  const canceledSales = allSales.filter((s) => s.payment_status === "cancelado");

  // Sumário
  const summary = {
    totalVendas: activeSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
    totalEstornos: canceledSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
    vendasAtivas: activeSales.length,
    vendasCanceladas: canceledSales.length,
    quantidadeVendas: activeSales.length,
    quantidadeEstornos: canceledSales.length,
    descontosConcedidos: activeSales.reduce((sum, s) => sum + (Number(s.discount_amount) || 0), 0),
    ticketMedio: activeSales.length > 0
      ? activeSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) / activeSales.length
      : 0,
  };

  // Dados por período
  const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
  const salesByPeriod = days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayActive = activeSales.filter((s) => s.sale_date.startsWith(dateStr));
    const dayCanceled = canceledSales.filter((s) => s.sale_date.startsWith(dateStr));

    const vendas = dayActive.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const estornos = dayCanceled.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    return {
      period: format(day, "dd/MM", { locale: ptBR }),
      vendas,
      estornos,
      liquido: vendas - estornos,
    };
  });

  // Por forma de pagamento
  const paymentMethodMap: Record<string, { label: string; total: number; count: number }> = {};
  const paymentLabels: Record<string, string> = {
    pix: "PIX",
    credito: "Cartão de Crédito",
    debito: "Cartão de Débito",
    dinheiro: "Dinheiro",
    convenio: "Convênio",
    boleto: "Boleto",
    transferencia: "Transferência",
  };

  activeSales.forEach((sale) => {
    const method = sale.payment_method || "outros";
    if (!paymentMethodMap[method]) {
      paymentMethodMap[method] = { label: paymentLabels[method] || method, total: 0, count: 0 };
    }
    paymentMethodMap[method].total += Number(sale.total_amount) || 0;
    paymentMethodMap[method].count += 1;
  });

  const totalSalesAmount = summary.totalVendas;
  const salesByPaymentMethod = Object.entries(paymentMethodMap)
    .map(([method, data]) => ({
      method,
      label: data.label,
      totalAmount: data.total,
      count: data.count,
      percentage: totalSalesAmount > 0 ? Math.round((data.total / totalSalesAmount) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Lista de vendas formatada
  const salesList = allSales.map((sale) => ({
    id: sale.id,
    saleDate: sale.sale_date,
    status: sale.payment_status === "cancelado" ? ("canceled" as const) : ("active" as const),
    patientId: sale.patient_id,
    patientName: sale.patients?.full_name || null,
    totalAmount: Number(sale.total_amount) || 0,
    discountAmount: Number(sale.discount_amount) || 0,
    netAmount: (Number(sale.total_amount) || 0) - (Number(sale.discount_amount) || 0),
    paymentMethod: sale.payment_method,
    paymentStatus: sale.payment_status,
    itemCount: sale.sale_items?.length || 0,
    professionalId: sale.professional_id,
    professionalName: sale.professionals?.full_name || null,
    createdBy: sale.created_by,
    createdByName: sale.created_by ? profilesMap[sale.created_by] || null : null,
    canceledBy: sale.canceled_by,
    canceledByName: sale.canceled_by ? profilesMap[sale.canceled_by] || null : null,
  }));

  return {
    isLoading,
    isError,
    summary,
    salesByPeriod,
    salesByPaymentMethod,
    salesList,
    activeSales: activeSales.length,
    canceledSales: canceledSales.length,
  };
}
