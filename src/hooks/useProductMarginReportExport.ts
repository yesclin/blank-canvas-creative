import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ProductMarginItem, ProductMarginSummary } from '@/hooks/useProductMarginReport';
import type { ProductMarginFilters } from '@/types/productMarginReport';

interface ExportData {
  items: ProductMarginItem[];
  summary: ProductMarginSummary;
  filters: ProductMarginFilters;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getMarginLevel(margin: number): string {
  if (margin >= 30) return 'Alta';
  if (margin >= 15) return 'Média';
  if (margin > 0) return 'Baixa';
  return 'Negativa';
}

function getFilterPeriodLabel(filters: ProductMarginFilters): string {
  return `${format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Ativas';
    case 'canceled': return 'Canceladas';
    default: return 'Todas';
  }
}

/**
 * Export product margin data to CSV
 */
export function exportProductMarginCSV({ items, summary, filters }: ExportData): void {
  try {
    const headers = [
      'Produto',
      'Categoria',
      'Qtd. Vendida',
      'Faturamento (R$)',
      'Custo Total (R$)',
      'Lucro (R$)',
      'Margem (%)',
      'Nível',
    ];

    const rows = items.map((item) => [
      item.productName,
      item.category || '-',
      item.quantitySold.toString(),
      item.totalRevenue.toFixed(2).replace('.', ','),
      item.totalCost.toFixed(2).replace('.', ','),
      item.totalProfit.toFixed(2).replace('.', ','),
      item.marginPercent.toFixed(1).replace('.', ','),
      getMarginLevel(item.marginPercent),
    ]);

    // Add summary at the end
    const summaryRows = [
      [],
      ['=== RESUMO ==='],
      ['Período', getFilterPeriodLabel(filters)],
      ['Status das Vendas', getStatusLabel(filters.status)],
      ['Total de Produtos', summary.totalProducts.toString()],
      ['Quantidade Vendida', summary.totalQuantitySold.toString()],
      ['Faturamento Total', formatCurrency(summary.totalRevenue)],
      ['Custo Total', formatCurrency(summary.totalCost)],
      ['Lucro Total', formatCurrency(summary.totalProfit)],
      ['Margem Média', formatPercent(summary.averageMargin)],
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
    link.download = `relatorio-margem-produtos-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
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
 * Export product margin data to PDF
 */
export function exportProductMarginPDF({ items, summary, filters }: ExportData): void {
  try {
    const periodLabel = getFilterPeriodLabel(filters);
    const statusLabel = getStatusLabel(filters.status);

    // Build HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Margem por Produto</title>
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
            border-bottom: 2px solid #8b5cf6;
          }
          .header h1 { 
            color: #8b5cf6; 
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
            min-width: 120px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 3px solid #8b5cf6;
          }
          .summary-item.green { border-left-color: #10b981; }
          .summary-item.red { border-left-color: #ef4444; }
          .summary-item.blue { border-left-color: #3b82f6; }
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
          .summary-item.blue .value { color: #3b82f6; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            font-size: 10px;
          }
          th { 
            background: #8b5cf6; 
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
          .margin-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
          }
          .margin-high { 
            background: #dcfce7; 
            color: #166534; 
          }
          .margin-medium { 
            background: #fef9c3; 
            color: #854d0e; 
          }
          .margin-low { 
            background: #ffedd5; 
            color: #9a3412; 
          }
          .margin-negative { 
            background: #fee2e2; 
            color: #dc2626; 
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-green { color: #10b981; }
          .text-red { color: #ef4444; }
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
          <h1>Relatório de Margem por Produto</h1>
          <p>Período: ${periodLabel} | Vendas: ${statusLabel}</p>
        </div>

        <div class="summary">
          <div class="summary-item blue">
            <div class="label">Produtos</div>
            <div class="value">${summary.totalProducts}</div>
          </div>
          <div class="summary-item">
            <div class="label">Qtd. Vendida</div>
            <div class="value">${summary.totalQuantitySold}</div>
          </div>
          <div class="summary-item green">
            <div class="label">Faturamento</div>
            <div class="value">${formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div class="summary-item red">
            <div class="label">Custo Total</div>
            <div class="value">${formatCurrency(summary.totalCost)}</div>
          </div>
          <div class="summary-item ${summary.totalProfit >= 0 ? 'green' : 'red'}">
            <div class="label">Lucro Total</div>
            <div class="value">${formatCurrency(summary.totalProfit)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Margem Média</div>
            <div class="value">${formatPercent(summary.averageMargin)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th class="text-right">Qtd.</th>
              <th class="text-right">Faturamento</th>
              <th class="text-right">Custo</th>
              <th class="text-right">Lucro</th>
              <th class="text-right">Margem</th>
              <th class="text-center">Nível</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => {
              const marginClass = item.marginPercent >= 30 ? 'margin-high' 
                : item.marginPercent >= 15 ? 'margin-medium' 
                : item.marginPercent > 0 ? 'margin-low' 
                : 'margin-negative';
              
              return `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.category || '-'}</td>
                  <td class="text-right">${item.quantitySold}</td>
                  <td class="text-right text-green">${formatCurrency(item.totalRevenue)}</td>
                  <td class="text-right text-red">${formatCurrency(item.totalCost)}</td>
                  <td class="text-right ${item.totalProfit >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(item.totalProfit)}</td>
                  <td class="text-right">${formatPercent(item.marginPercent)}</td>
                  <td class="text-center">
                    <span class="margin-badge ${marginClass}">${getMarginLevel(item.marginPercent)}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | 
          Total de produtos: ${items.length}
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
 * Hook for product margin report export functionality
 */
export function useProductMarginReportExport() {
  return {
    exportCSV: exportProductMarginCSV,
    exportPDF: exportProductMarginPDF,
  };
}
