import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { SaleReportItem, SalesReportSummary } from '@/types/relatorios';
import type { SalesReportFilters } from '@/types/salesReport';

interface ExportData {
  salesList: SaleReportItem[];
  summary: SalesReportSummary;
  filters: SalesReportFilters;
}

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  convenio: 'Convênio',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return '-';
  return paymentLabels[method] || method;
}

function getStatusLabel(status: string): string {
  return status === 'canceled' ? 'Cancelada' : 'Ativa';
}

function getFilterPeriodLabel(filters: SalesReportFilters): string {
  return `${format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
}

/**
 * Export sales data to CSV
 */
export function exportSalesCSV({ salesList, summary, filters }: ExportData): void {
  try {
    const headers = [
      'Data da Venda',
      'Status',
      'Paciente',
      'Valor Total',
      'Desconto',
      'Valor Líquido',
      'Forma de Pagamento',
      'Criado por',
      'Cancelado por',
    ];

    const rows = salesList.map((sale) => [
      formatDate(sale.saleDate),
      getStatusLabel(sale.status),
      sale.patientName || 'Sem paciente',
      sale.totalAmount.toFixed(2).replace('.', ','),
      sale.discountAmount.toFixed(2).replace('.', ','),
      sale.netAmount.toFixed(2).replace('.', ','),
      formatPaymentMethod(sale.paymentMethod),
      sale.createdByName || '-',
      sale.canceledByName || '-',
    ]);

    // Add summary at the end
    const summaryRows = [
      [],
      ['=== RESUMO ==='],
      ['Período', getFilterPeriodLabel(filters)],
      ['Total de Vendas Ativas', formatCurrency(summary.totalVendas)],
      ['Total de Estornos', formatCurrency(summary.totalEstornos)],
      ['Valor Líquido', formatCurrency(summary.totalVendas - summary.totalEstornos)],
      ['Quantidade de Vendas', summary.quantidadeVendas.toString()],
      ['Quantidade de Estornos', summary.quantidadeEstornos.toString()],
      ['Ticket Médio', formatCurrency(summary.ticketMedio)],
      ['Descontos Concedidos', formatCurrency(summary.descontosConcedidos)],
    ];

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
      ...summaryRows.map((row) => row.join(';')),
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Relatório CSV exportado com sucesso!');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error('Erro ao exportar CSV');
  }
}

/**
 * Export sales data to PDF
 */
export function exportSalesPDF({ salesList, summary, filters }: ExportData): void {
  try {
    const periodLabel = getFilterPeriodLabel(filters);
    const valorLiquido = summary.totalVendas - summary.totalEstornos;

    // Build HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Vendas e Estornos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 11px; 
            color: #333;
            padding: 20px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px;
            border-bottom: 2px solid #4f46e5;
          }
          .header h1 { 
            color: #4f46e5; 
            font-size: 20px;
            margin-bottom: 5px;
          }
          .header p { 
            color: #666; 
            font-size: 12px;
          }
          .summary { 
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
          }
          .summary-item { 
            flex: 1;
            min-width: 150px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 3px solid #4f46e5;
          }
          .summary-item.green { border-left-color: #10b981; }
          .summary-item.red { border-left-color: #ef4444; }
          .summary-item .label { 
            font-size: 10px; 
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-item .value { 
            font-size: 16px; 
            font-weight: bold;
            color: #1e293b;
            margin-top: 3px;
          }
          .summary-item.green .value { color: #10b981; }
          .summary-item.red .value { color: #ef4444; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            font-size: 10px;
          }
          th { 
            background: #4f46e5; 
            color: white; 
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 8px; 
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) { background: #f8fafc; }
          tr.canceled { 
            background: #fef2f2 !important;
            color: #dc2626;
          }
          tr.canceled td { 
            text-decoration: line-through;
            opacity: 0.8;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
            text-decoration: none !important;
          }
          .status-active { 
            background: #dcfce7; 
            color: #166534; 
          }
          .status-canceled { 
            background: #fee2e2; 
            color: #dc2626; 
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer { 
            margin-top: 20px; 
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px; 
            color: #666;
            text-align: center;
          }
          @media print {
            body { padding: 10px; }
            .summary-item { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Vendas e Estornos</h1>
          <p>Período: ${periodLabel}</p>
        </div>

        <div class="summary">
          <div class="summary-item green">
            <div class="label">Vendas Ativas</div>
            <div class="value">${formatCurrency(summary.totalVendas)}</div>
          </div>
          <div class="summary-item red">
            <div class="label">Estornos</div>
            <div class="value">${formatCurrency(summary.totalEstornos)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Valor Líquido</div>
            <div class="value">${formatCurrency(valorLiquido)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Ticket Médio</div>
            <div class="value">${formatCurrency(summary.ticketMedio)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th class="text-center">Status</th>
              <th>Paciente</th>
              <th class="text-right">Valor</th>
              <th>Pagamento</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            ${salesList.map((sale) => `
              <tr class="${sale.status === 'canceled' ? 'canceled' : ''}">
                <td>${formatDate(sale.saleDate)}</td>
                <td class="text-center">
                  <span class="status-badge ${sale.status === 'canceled' ? 'status-canceled' : 'status-active'}">
                    ${getStatusLabel(sale.status)}
                  </span>
                </td>
                <td>${sale.patientName || 'Sem paciente'}</td>
                <td class="text-right">${formatCurrency(sale.totalAmount)}</td>
                <td>${formatPaymentMethod(sale.paymentMethod)}</td>
                <td>${sale.createdByName || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | 
          Total de registros: ${salesList.length}
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      toast.success('Relatório PDF gerado com sucesso!');
    } else {
      toast.error('Não foi possível abrir a janela de impressão. Verifique se popups estão bloqueados.');
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Erro ao exportar PDF');
  }
}

/**
 * Hook for sales report export functionality
 */
export function useSalesReportExport() {
  return {
    exportCSV: exportSalesCSV,
    exportPDF: exportSalesPDF,
  };
}
