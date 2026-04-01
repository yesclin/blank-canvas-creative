/**
 * Hook para exportação consolidada do PDF de Preenchimento com Ácido Hialurônico.
 * 
 * Une em um único documento:
 * - Dados do paciente
 * - Plano clínico (anamnese estética)
 * - Mapa facial com marcações
 * - Resumo de aplicações
 * - Produtos utilizados
 * - Observações finais
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { escapeHtml } from '@/lib/htmlEscape';
import {
  PROCEDURE_TYPE_LABELS,
  FACIAL_MUSCLES,
  VIEW_TYPE_LABELS,
  SIDE_LABELS,
} from '@/components/prontuario/aesthetics/types';
import type { FacialMapApplication } from '@/components/prontuario/aesthetics/types';
import type { AestheticProductUsed } from '@/hooks/aesthetics/useProdutosUtilizadosData';

// Import the filler base image
import fillerFrontalImg from '@/assets/facial-map-filler-frontal.png';

interface PatientForPdf {
  full_name: string;
  birth_date?: string | null;
  phone?: string | null;
  cpf?: string | null;
}

interface ConsolidatedPdfParams {
  patientId: string;
  appointmentId?: string | null;
  patient: PatientForPdf;
  professionalName?: string | null;
  professionalRegistration?: string | null;
  /** Pass the current record's responses directly so the PDF reads from the active record */
  recordResponses?: Record<string, any> | null;
  /** Pass the current record's data directly */
  recordData?: Record<string, any> | null;
}

function getMuscleName(id: string): string {
  return FACIAL_MUSCLES.find(m => m.id === id)?.name || id;
}

function calcAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '';
  try {
    const diff = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${diff} anos`;
  } catch { return ''; }
}

export function useConsolidatedFillerPdf() {
  const [exporting, setExporting] = useState(false);
  const { clinic } = useClinicData();

  const generateConsolidatedPdf = useCallback(async ({
    patientId,
    appointmentId,
    patient,
    professionalName,
    professionalRegistration,
    recordResponses,
    recordData,
  }: ConsolidatedPdfParams) => {
    setExporting(true);
    try {
      // 1. Fetch document settings
      let docSettings: any = null;
      if (clinic?.id) {
        const { data } = await supabase
          .from('clinic_document_settings')
          .select('*')
          .eq('clinic_id', clinic.id)
          .maybeSingle();
        docSettings = data;
      }

      // 2. Build anamnesis data from the current record's responses/data (passed directly)
      //    Falls back to fetching latest record only if nothing was passed.
      let anamnesisData: Record<string, any> = {};
      if (recordResponses || recordData) {
        anamnesisData = {
          ...(typeof recordData === 'object' && recordData ? recordData : {}),
          ...(typeof recordResponses === 'object' && recordResponses ? recordResponses : {}),
        };
      } else if (clinic?.id) {
        const { data: anamnesisRecords } = await supabase
          .from('anamnesis_records')
          .select('data, responses')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (anamnesisRecords?.[0]) {
          anamnesisData = {
            ...(typeof anamnesisRecords[0].data === 'object' ? anamnesisRecords[0].data as Record<string, any> : {}),
            ...(typeof anamnesisRecords[0].responses === 'object' ? anamnesisRecords[0].responses as Record<string, any> : {}),
          };
        }
      }

      // 3. Fetch facial map + applications
      let applications: FacialMapApplication[] = [];
      let generalNotes = '';
      if (clinic?.id) {
        const mapQuery = supabase
          .from('facial_maps')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (appointmentId) {
          mapQuery.eq('appointment_id', appointmentId);
        }

        const { data: maps } = await mapQuery;
        const map = maps?.[0];
        
        if (map) {
          generalNotes = (map as any).general_notes || '';
          const { data: apps } = await supabase
            .from('facial_map_applications')
            .select('*')
            .eq('facial_map_id', map.id)
            .order('created_at', { ascending: true });
          
          if (apps) {
            applications = apps.map((a: any) => ({
              id: a.id,
              clinic_id: a.clinic_id,
              patient_id: a.patient_id,
              appointment_id: a.appointment_id,
              professional_id: a.professional_id,
              facial_map_id: a.facial_map_id,
              procedure_type: a.procedure_type,
              view_type: a.view_type,
              position_x: a.position_x,
              position_y: a.position_y,
              muscle: a.muscle,
              product_name: a.product_name,
              quantity: a.quantity,
              unit: a.unit,
              side: a.side,
              notes: a.notes,
              created_at: a.created_at,
              created_by: a.created_by,
              updated_at: a.updated_at,
            }));
          }
        }
      }

      // Filter filler applications
      const fillerApps = applications.filter(a => a.procedure_type === 'filler');

      // 4. Fetch products used
      let products: AestheticProductUsed[] = [];
      if (clinic?.id) {
        const prodQuery = supabase
          .from('aesthetic_products_used')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (appointmentId) {
          prodQuery.eq('appointment_id', appointmentId);
        }

        const { data: prods } = await prodQuery;
        if (prods) {
          products = prods as unknown as AestheticProductUsed[];
        }
      }

      // 5. Calculate totals
      const totalVolume = fillerApps.reduce((sum, a) => sum + (a.quantity || 0), 0);
      const treatedRegions = [...new Set(fillerApps.map(a => getMuscleName(a.muscle || 'outros')))];

      const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const clinicName = docSettings?.clinic_name || clinic?.name || '';
      const primaryColor = docSettings?.primary_color || '#2563eb';
      const footerText = docSettings?.footer_text || '';
      const showFooter = docSettings?.show_footer ?? true;
      const logoUrl = docSettings?.logo_url || clinic?.logo_url || '';
      const profName = professionalName || docSettings?.responsible_name || '';
      const profReg = professionalRegistration || docSettings?.responsible_crm || '';

      // 6. Build HTML
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Plano de Preenchimento com Ácido Hialurônico - ${escapeHtml(patient.full_name)}</title>
  <style>
    @media print { @page { margin: 12mm; size: A4; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #1a1a1a; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-logo { max-height: 50px; max-width: 120px; }
    .header h1 { font-size: 16px; color: ${primaryColor}; margin-bottom: 2px; }
    .header .doc-title { font-size: 13px; color: #475569; font-weight: 600; }
    .header .meta { text-align: right; font-size: 10px; color: #64748b; }

    .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .patient-box .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .patient-box .value { font-size: 11px; font-weight: 500; }

    .section { margin-bottom: 18px; }
    .section-title { font-size: 13px; font-weight: 700; color: ${primaryColor}; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .section-content { font-size: 11px; }
    .field-row { margin-bottom: 6px; }
    .field-label { font-weight: 600; color: #334155; }
    .field-value { color: #1e293b; }

    .map-container { text-align: center; margin: 12px 0; position: relative; }
    .map-container img { max-width: 320px; max-height: 400px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .map-marker { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: rgba(37, 99, 235, 0.85); color: white; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translate(-50%, -50%); }

    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    th { background: #f1f5f9; padding: 6px 5px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 5px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 500; }
    .badge-filler { background: #eff6ff; color: #2563eb; }

    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
    .summary-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 10px; text-align: center; }
    .summary-card .val { font-size: 18px; font-weight: 700; color: ${primaryColor}; }
    .summary-card .lbl { font-size: 9px; color: #64748b; text-transform: uppercase; }

    .notes-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin: 10px 0; }
    .notes-box h4 { font-size: 11px; color: #854d0e; margin-bottom: 4px; }
    .notes-box p { color: #713f12; font-size: 11px; }

    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-block { width: 200px; text-align: center; }
    .sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; font-size: 10px; color: #475569; }
    .footer-text { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 16px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; color: rgba(0,0,0,0.03); font-weight: 700; pointer-events: none; z-index: -1; }
  </style>
</head>
<body>
  ${docSettings?.watermark_type === 'text' && docSettings?.watermark_text ? `<div class="watermark">${escapeHtml(docSettings.watermark_text)}</div>` : ''}

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" class="header-logo" crossorigin="anonymous" />` : ''}
      <div>
        <h1>${escapeHtml(clinicName)}</h1>
        <div class="doc-title">Plano de Preenchimento com Ácido Hialurônico</div>
      </div>
    </div>
    <div class="meta">
      Emitido em ${dateStr}<br/>
      ${profName ? `Prof.: ${escapeHtml(profName)}` : ''}
      ${profReg ? `<br/>${escapeHtml(profReg)}` : ''}
    </div>
  </div>

  <!-- PATIENT DATA -->
  <div class="patient-box">
    <div><span class="label">Paciente</span><div class="value">${escapeHtml(patient.full_name)}</div></div>
    <div><span class="label">Data de Nascimento / Idade</span><div class="value">${patient.birth_date ? escapeHtml(format(new Date(patient.birth_date), 'dd/MM/yyyy')) + ' (' + calcAge(patient.birth_date) + ')' : '-'}</div></div>
    ${patient.cpf ? `<div><span class="label">CPF</span><div class="value">${escapeHtml(patient.cpf)}</div></div>` : ''}
    ${patient.phone ? `<div><span class="label">Telefone</span><div class="value">${escapeHtml(patient.phone)}</div></div>` : ''}
  </div>

  <!-- CLINICAL PLAN DATA -->
  <div class="section">
    <div class="section-title">Dados Clínicos do Plano</div>
    <div class="section-content">
      ${buildFieldRow('Objetivo do procedimento', anamnesisData.objetivo_procedimento_ah || anamnesisData.objetivo_procedimento)}
      ${buildFieldRow('Queixa principal', anamnesisData.queixa_principal)}
      ${buildFieldRow('Áreas de interesse', anamnesisData.areas_interesse_ah || anamnesisData.areas_interesse)}
      ${buildFieldRow('Contraindicações', anamnesisData.contraindicacoes)}
      ${buildFieldRow('Histórico prévio', anamnesisData.historico_previo || anamnesisData.historico_estetico)}
      ${buildFieldRow('Observações clínicas', anamnesisData.observacoes_clinicas)}
      ${buildFieldRow('Plano terapêutico inicial', anamnesisData.plano_terapeutico_ah || anamnesisData.plano_terapeutico)}
    </div>
  </div>

  <!-- FACIAL MAP -->
  <div class="section">
    <div class="section-title">Mapa Facial</div>
    <div class="map-container" style="display: inline-block; position: relative;">
      <img src="${fillerFrontalImg}" alt="Mapa Facial Frontal" />
      ${fillerApps.map((app, i) => {
        const x = app.position_x ?? 50;
        const y = app.position_y ?? 50;
        return `<div class="map-marker" style="left: ${x}%; top: ${y}%;" title="${escapeHtml(getMuscleName(app.muscle || ''))}">${i + 1}</div>`;
      }).join('')}
    </div>
    ${fillerApps.length > 0 ? `<p style="font-size:10px; color:#64748b; text-align:center; margin-top:4px;">Os números correspondem às aplicações listadas abaixo.</p>` : '<p style="font-size:10px; color:#94a3b8; text-align:center;">Nenhuma marcação registrada.</p>'}
  </div>

  <!-- APPLICATIONS SUMMARY -->
  ${fillerApps.length > 0 ? `
  <div class="section">
    <div class="section-title">Resumo das Aplicações</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Região</th>
          <th>Lado</th>
          <th>Produto</th>
          <th>Qtd</th>
          <th>Unidade</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
        ${fillerApps.map((app, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${escapeHtml(getMuscleName(app.muscle || 'outros'))}</strong></td>
          <td>${escapeHtml(app.side ? SIDE_LABELS[app.side] || app.side : '-')}</td>
          <td>${escapeHtml(app.product_name || '-')}</td>
          <td><strong>${app.quantity}</strong></td>
          <td>${escapeHtml(app.unit)}</td>
          <td>${escapeHtml(app.notes) || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- PRODUCTS USED -->
  ${products.length > 0 ? `
  <div class="section">
    <div class="section-title">Produtos Utilizados — Rastreabilidade</div>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Fabricante</th>
          <th>Lote</th>
          <th>Validade</th>
          <th>Qtd</th>
          <th>Área</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.product_name)}</strong></td>
          <td>${escapeHtml(p.manufacturer) || '-'}</td>
          <td>${escapeHtml(p.batch_number) || '-'}</td>
          <td>${p.expiry_date ? format(new Date(p.expiry_date), 'dd/MM/yyyy') : '-'}</td>
          <td>${p.quantity} ${escapeHtml(p.unit)}</td>
          <td>${escapeHtml(p.application_area) || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- FINAL SUMMARY -->
  <div class="section">
    <div class="section-title">Resumo Final</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="val">${totalVolume.toFixed(1)} ml</div>
        <div class="lbl">Volume Total</div>
      </div>
      <div class="summary-card">
        <div class="val">${fillerApps.length}</div>
        <div class="lbl">Pontos Aplicados</div>
      </div>
      <div class="summary-card">
        <div class="val">${treatedRegions.length}</div>
        <div class="lbl">Regiões Tratadas</div>
      </div>
    </div>
    ${treatedRegions.length > 0 ? `<p style="margin-top:6px;"><strong>Regiões:</strong> ${treatedRegions.map(r => escapeHtml(r)).join(', ')}</p>` : ''}
  </div>

  ${generalNotes ? `
  <div class="notes-box">
    <h4>Observações Clínicas Finais</h4>
    <p>${escapeHtml(generalNotes)}</p>
  </div>
  ` : ''}

  <!-- SIGNATURES & FOOTER -->
  <div class="footer">
    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Profissional Responsável${profName ? `<br/>${escapeHtml(profName)}` : ''}${profReg ? `<br/>${escapeHtml(profReg)}` : ''}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Paciente<br/>${escapeHtml(patient.full_name)}</div>
      </div>
    </div>
    ${showFooter && footerText ? `<div class="footer-text">${escapeHtml(footerText)}</div>` : ''}
    <div class="footer-text">Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
  </div>
</body>
</html>`;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF consolidado gerado com sucesso!');
      } else {
        toast.error('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
      }
    } catch (error) {
      console.error('Consolidated PDF error:', error);
      toast.error('Erro ao gerar PDF consolidado. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, [clinic]);

  return { generateConsolidatedPdf, exporting };
}

function buildFieldRow(label: string, value: unknown): string {
  const val = typeof value === 'string' ? value : '';
  if (!val) return '';
  return `<div class="field-row"><span class="field-label">${escapeHtml(label)}:</span> <span class="field-value">${escapeHtml(val)}</span></div>`;
}
