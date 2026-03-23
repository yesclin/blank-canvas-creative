/**
 * Hook para exportação do Mapa Facial em PDF
 * Utiliza a API de impressão do navegador com layout otimizado
 */

import { useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FacialMapApplication, FacialMap } from './types';
import { PROCEDURE_TYPE_LABELS, FACIAL_MUSCLES, VIEW_TYPE_LABELS } from './types';

interface UseFacialMapPdfParams {
  patientName?: string;
  patientId: string;
  facialMap?: FacialMap | null;
  applications: FacialMapApplication[];
}

export function useFacialMapPdf({
  patientName,
  patientId,
  facialMap,
  applications,
}: UseFacialMapPdfParams) {
  
  const generatePdf = useCallback(() => {
    // Group applications by view type
    const byView = applications.reduce<Record<string, FacialMapApplication[]>>((acc, app) => {
      if (!acc[app.view_type]) acc[app.view_type] = [];
      acc[app.view_type].push(app);
      return acc;
    }, {});

    // Calculate totals by procedure type
    const totals = applications.reduce<Record<string, number>>((acc, app) => {
      if (!acc[app.procedure_type]) acc[app.procedure_type] = 0;
      acc[app.procedure_type] += app.quantity;
      return acc;
    }, {});

    // Group by muscle
    const byMuscle = applications.reduce<Record<string, FacialMapApplication[]>>((acc, app) => {
      const muscleKey = app.muscle || 'outros';
      if (!acc[muscleKey]) acc[muscleKey] = [];
      acc[muscleKey].push(app);
      return acc;
    }, {});

    const getMuscleName = (id: string) => 
      FACIAL_MUSCLES.find(m => m.id === id)?.name || id;

    const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const mapDate = facialMap?.created_at 
      ? format(new Date(facialMap.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      : dateStr;

    // Build HTML for print
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mapa Facial - ${patientName || 'Paciente'}</title>
        <style>
          @media print {
            @page { margin: 15mm; size: A4; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            font-size: 11px; 
            line-height: 1.4;
            color: #1a1a1a;
          }
          .header { 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 12px; 
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header h1 { font-size: 18px; color: #2563eb; margin-bottom: 4px; }
          .header .subtitle { color: #666; font-size: 12px; }
          .header .date { text-align: right; color: #666; font-size: 10px; }
          
          .summary { 
            display: flex; 
            gap: 16px; 
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
          }
          .summary-item { 
            flex: 1;
            text-align: center;
            padding: 8px;
          }
          .summary-item .value { 
            font-size: 20px; 
            font-weight: 700; 
            color: #2563eb;
          }
          .summary-item .label { 
            font-size: 10px; 
            color: #666; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section { margin-bottom: 20px; }
          .section-title { 
            font-size: 13px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin-bottom: 10px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 10px;
          }
          th { 
            background: #f1f5f9; 
            padding: 8px 6px; 
            text-align: left;
            font-weight: 600;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
          }
          td { 
            padding: 6px; 
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          
          .badge { 
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 500;
          }
          .badge-toxin { background: #fef2f2; color: #dc2626; }
          .badge-filler { background: #eff6ff; color: #2563eb; }
          .badge-biostimulator { background: #f0fdf4; color: #16a34a; }
          
          .notes-section {
            background: #fefce8;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
          }
          .notes-section h4 { 
            font-size: 11px; 
            margin-bottom: 6px;
            color: #854d0e;
          }
          .notes-section p { color: #713f12; }
          
          .footer { 
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
          }
          .signature { 
            width: 200px;
            text-align: center;
          }
          .signature-line { 
            border-top: 1px solid #1a1a1a;
            margin-top: 40px;
            padding-top: 4px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Mapa Facial - Harmonização</h1>
            <div class="subtitle">${patientName || 'Paciente'}</div>
          </div>
          <div class="date">
            Gerado em ${dateStr}<br>
            Sessão: ${mapDate}
          </div>
        </div>
        
        <div class="summary">
          ${Object.entries(totals).map(([type, qty]) => `
            <div class="summary-item">
              <div class="value">${qty}${type === 'toxin' ? ' UI' : ' ml'}</div>
              <div class="label">${PROCEDURE_TYPE_LABELS[type as keyof typeof PROCEDURE_TYPE_LABELS] || type}</div>
            </div>
          `).join('')}
          <div class="summary-item">
            <div class="value">${applications.length}</div>
            <div class="label">Pontos Aplicados</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Detalhamento por Região</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Músculo / Região</th>
                <th style="width: 15%">Tipo</th>
                <th style="width: 20%">Produto</th>
                <th style="width: 10%">Qtd</th>
                <th style="width: 10%">Vista</th>
                <th style="width: 20%">Observações</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => `
                <tr>
                  <td><strong>${getMuscleName(app.muscle || 'outros')}</strong></td>
                  <td>
                    <span class="badge badge-${app.procedure_type}">
                      ${PROCEDURE_TYPE_LABELS[app.procedure_type]}
                    </span>
                  </td>
                  <td>${app.product_name}</td>
                  <td><strong>${app.quantity}</strong> ${app.unit}</td>
                  <td>${VIEW_TYPE_LABELS[app.view_type] || app.view_type}</td>
                  <td>${app.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${facialMap?.general_notes ? `
          <div class="notes-section">
            <h4>Observações Clínicas</h4>
            <p>${facialMap.general_notes}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="signature">
            <div class="signature-line">Profissional Responsável</div>
          </div>
          <div class="signature">
            <div class="signature-line">Paciente</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [patientName, patientId, facialMap, applications]);

  return { generatePdf };
}
