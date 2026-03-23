import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { useDocumentSettings, DOCUMENT_DEFAULTS, type DocumentSettings } from '@/hooks/useDocumentSettings';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SecaoAnamnese } from '@/hooks/prontuario/clinica-geral/anamneseTemplates';
import {
  generateHash,
  getNextDocumentNumber,
  buildDocumentReference,
  generateValidationQRCode,
  registerClinicalDocument,
} from '@/utils/documentControl';
import { logAudit } from '@/utils/auditLog';

export interface PatientInfo {
  name: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
  sex?: string;
  age?: number | string;
  insurance_name?: string;
  id?: string;
}

interface ClinicInfo {
  name: string;
  logo_url?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface ProfessionalInfo {
  name?: string;
  crm?: string;
  specialty?: string;
}

interface AnamneseForPdf {
  id: string;
  structured_data?: Record<string, unknown>;
  queixa_principal?: string;
  historia_doenca_atual?: string;
  antecedentes_pessoais?: string;
  antecedentes_familiares?: string;
  habitos_vida?: string;
  medicamentos_uso_continuo?: string;
  alergias?: string;
  comorbidades?: string;
  created_at: string;
  created_by_name?: string;
  template_id?: string;
}

// ─── Content Builder ─────────────────────────────────────────────

function buildContentHtml(
  anamnese: AnamneseForPdf,
  sections: SecaoAnamnese[],
): string {
  let html = '';

  if (anamnese.structured_data && Object.keys(anamnese.structured_data).length > 0) {
    for (const secao of sections) {
      const fields = secao.campos.filter(c => {
        const v = anamnese.structured_data![c.id];
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== '';
      });
      if (fields.length === 0) continue;

      html += `<div style="margin-bottom:20px;">
        <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#374151;margin:0 0 10px 0;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${secao.titulo}</h3>`;

      for (const campo of fields) {
        const val = anamnese.structured_data![campo.id];
        const display = Array.isArray(val) ? val.join(', ') : String(val);
        html += `<div style="margin-bottom:8px;">
          <div style="font-size:9px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">${campo.label}</div>
          <div style="font-size:11px;color:#1f2937;line-height:1.6;text-align:justify;">${display}</div>
        </div>`;
      }
      html += '</div>';
    }
  } else {
    const legacyFields = [
      { label: 'Queixa Principal', value: anamnese.queixa_principal },
      { label: 'História da Doença Atual', value: anamnese.historia_doenca_atual },
      { label: 'Antecedentes Pessoais', value: anamnese.antecedentes_pessoais },
      { label: 'Antecedentes Familiares', value: anamnese.antecedentes_familiares },
      { label: 'Hábitos de Vida', value: anamnese.habitos_vida },
      { label: 'Medicamentos em Uso', value: anamnese.medicamentos_uso_continuo },
      { label: 'Alergias', value: anamnese.alergias },
      { label: 'Comorbidades', value: anamnese.comorbidades },
    ].filter(f => f.value);

    for (const f of legacyFields) {
      html += `<div style="margin-bottom:20px;">
        <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#374151;margin:0 0 10px 0;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${f.label}</h3>
        <p style="font-size:11px;margin:0;white-space:pre-wrap;line-height:1.6;text-align:justify;color:#1f2937;">${f.value}</p>
      </div>`;
    }
  }

  return html;
}

// ─── Premium A4 HTML Builder ─────────────────────────────────────

function buildPremiumHtml(
  clinicInfo: ClinicInfo,
  patient: PatientInfo,
  professional: ProfessionalInfo,
  anamnese: AnamneseForPdf,
  sections: SecaoAnamnese[],
  settings: DocumentSettings | null,
  docReference?: string,
  docId?: string,
  qrCodeDataUrl?: string,
): string {
  const s = settings || (DOCUMENT_DEFAULTS as unknown as DocumentSettings);
  const pc = s.primary_color || '#2563eb';
  const fontFamily = s.font_family || 'Inter';
  const dateStr = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const appointmentDate = format(new Date(anamnese.created_at), "dd/MM/yyyy", { locale: ptBR });

  const contentHtml = buildContentHtml(anamnese, sections);

  // ── Institutional Header ──
  const logoHtml = clinicInfo.logo_url
    ? `<img src="${clinicInfo.logo_url}" style="height:52px;width:52px;border-radius:6px;object-fit:cover;" />`
    : `<div style="height:52px;width:52px;border-radius:6px;background:${pc};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;">${clinicInfo.name.charAt(0)}</div>`;

  const clinicDetails = [
    clinicInfo.cnpj ? `CNPJ: ${clinicInfo.cnpj}` : null,
    clinicInfo.address,
    clinicInfo.phone ? `Tel: ${clinicInfo.phone}` : null,
    clinicInfo.email,
  ].filter(Boolean).join(' • ');

  const headerHtml = `
    <div style="padding:25mm 20mm 0 20mm;">
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:2px solid ${pc};">
        ${logoHtml}
        <div style="flex:1;">
          <div style="font-size:16px;font-weight:700;color:${pc};letter-spacing:0.3px;">${clinicInfo.name}</div>
          <div style="font-size:8px;color:#6b7280;margin-top:3px;line-height:1.5;">${clinicDetails}</div>
        </div>
      </div>
    </div>`;

  // ── Patient Identification Block ──
  const patientFields = [
    { label: 'Paciente', value: patient.name, bold: true },
    { label: 'Idade', value: patient.age ? `${patient.age} anos` : null },
    { label: 'Sexo', value: patient.sex },
    { label: 'CPF', value: patient.cpf },
    { label: 'Telefone', value: patient.phone },
    { label: 'Convênio', value: patient.insurance_name },
    { label: 'Data do Atendimento', value: appointmentDate },
    { label: 'Profissional', value: professional.name },
  ].filter(f => f.value);

  const patientGridHtml = patientFields.map(f =>
    `<div style="min-width:140px;">
      <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${f.label}</div>
      <div style="font-size:10px;color:#1f2937;margin-top:1px;${f.bold ? 'font-weight:700;' : ''}">${f.value}</div>
    </div>`
  ).join('');

  const patientHtml = `
    <div style="margin:0 20mm;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-top:14px;">
      <div style="display:flex;flex-wrap:wrap;gap:12px 24px;">
        ${patientGridHtml}
      </div>
    </div>`;

  // ── Document Title ──
  const titleHtml = `
    <div style="margin:16px 20mm 0 20mm;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:${pc};letter-spacing:2px;text-transform:uppercase;">ANAMNESE CLÍNICA</div>
      ${docReference ? `<div style="font-size:8px;color:#9ca3af;margin-top:3px;">${docReference}</div>` : ''}
    </div>`;

  // ── Content ──
  const bodyHtml = `
    <div style="margin:16px 20mm 0 20mm;flex:1;">
      ${contentHtml}
    </div>`;

  // ── Professional Footer ──
  const signatureBlock = s.show_digital_signature && s.signature_image_url
    ? `<img src="${s.signature_image_url}" style="height:40px;object-fit:contain;margin-bottom:4px;" />`
    : '';

  const profLine = [
    professional.name,
    professional.crm,
    professional.specialty,
  ].filter(Boolean).join(' • ');

  const qrBlock = qrCodeDataUrl
    ? `<div style="display:flex;align-items:center;gap:8px;">
        <img src="${qrCodeDataUrl}" style="width:50px;height:50px;" />
        <div style="font-size:7px;color:#9ca3af;line-height:1.4;">
          ${docReference ? `<div>Nº ${docReference}</div>` : ''}
          ${docId ? `<div>ID: ${docId.substring(0, 8)}</div>` : ''}
          <div>Documento com validação digital</div>
        </div>
      </div>`
    : '';

  const footerHtml = `
    <div style="margin:auto 20mm 20mm 20mm;border-top:1px solid #e5e7eb;padding-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          ${qrBlock}
        </div>
        <div style="text-align:right;">
          ${signatureBlock}
          <div style="font-size:10px;font-weight:600;color:#1f2937;">${professional.name || ''}</div>
          <div style="font-size:8px;color:#6b7280;margin-top:1px;">${professional.crm || ''}</div>
          ${professional.specialty ? `<div style="font-size:8px;color:#6b7280;">${professional.specialty}</div>` : ''}
          <div style="font-size:7px;color:#9ca3af;margin-top:4px;">Emitido em: ${dateStr}</div>
          ${docId ? `<div style="font-size:7px;color:#9ca3af;">Doc: ${docId.substring(0, 12)}</div>` : ''}
        </div>
      </div>
      ${s.footer_text ? `<div style="font-size:7px;color:#b0b0b0;text-align:center;margin-top:10px;">${s.footer_text}</div>` : ''}
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: '${fontFamily}', 'Helvetica Neue', Arial, sans-serif; color:#1f2937; background:white; }
    @page { size: A4; margin: 0; }
  </style></head><body>
    <div style="min-height:297mm;display:flex;flex-direction:column;">
      ${headerHtml}
      ${patientHtml}
      ${titleHtml}
      ${bodyHtml}
      ${footerHtml}
    </div>
  </body></html>`;
}

// ─── Hook ────────────────────────────────────────────────────────

export function useInstitutionalPdf() {
  const { clinic, getFormattedAddress, getFiscalDocument } = useClinicData();
  const { settings } = useDocumentSettings();
  const [generating, setGenerating] = useState(false);

  const generateAnamnesisPdf = useCallback(async (
    patient: PatientInfo,
    anamnese: AnamneseForPdf,
    sections: SecaoAnamnese[],
    professional?: ProfessionalInfo,
  ) => {
    setGenerating(true);
    try {
      // Build clinic info from clinic data
      const clinicInfo: ClinicInfo = {
        name: settings?.clinic_name || clinic?.name || 'Clínica',
        logo_url: settings?.logo_url || clinic?.logo_url,
        cnpj: clinic?.cnpj,
        phone: clinic?.phone,
        email: clinic?.email,
        address: getFormattedAddress() || undefined,
      };

      const profInfo: ProfessionalInfo = {
        name: professional?.name || anamnese.created_by_name || settings?.responsible_name || undefined,
        crm: professional?.crm || (settings?.show_crm ? settings?.responsible_crm : undefined) || undefined,
        specialty: professional?.specialty || undefined,
      };

      let docReference: string | undefined;
      let docId: string | undefined;
      let qrCodeDataUrl: string | undefined;

      // Document control: get sequential number
      if (clinic?.id && patient.id) {
        try {
          const seqNum = await getNextDocumentNumber(clinic.id);
          docReference = buildDocumentReference('anamnese', seqNum);
        } catch (err) {
          console.warn('Could not get sequential number, continuing without:', err);
        }
      }

      // Build HTML for hash (without QR)
      const htmlForHash = buildPremiumHtml(clinicInfo, patient, profInfo, anamnese, sections, settings, docReference);
      const documentHash = await generateHash(htmlForHash);

      // Register document to get UUID for QR code
      if (clinic?.id && patient.id && docReference) {
        try {
          const registered = await registerClinicalDocument({
            clinicId: clinic.id,
            patientId: patient.id,
            documentType: 'anamnese',
            documentReference: docReference,
            documentHash,
            sourceRecordId: anamnese.id,
            patientName: patient.name,
            professionalName: profInfo.name,
          });
          docId = registered.id;
          qrCodeDataUrl = await generateValidationQRCode(docId);

          await logAudit({
            clinicId: clinic.id,
            action: 'document_created',
            entityType: 'clinical_document',
            entityId: docId,
            metadata: {
              document_reference: docReference,
              document_type: 'anamnese',
              patient_name: patient.name,
            },
          });
        } catch (err) {
          console.warn('Could not register document, continuing without:', err);
        }
      }

      // Build final HTML with QR
      const html = buildPremiumHtml(clinicInfo, patient, profInfo, anamnese, sections, settings, docReference, docId, qrCodeDataUrl);

      // Render to canvas
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '794px'; // A4 at 96dpi
      container.innerHTML = html;
      document.body.appendChild(container);

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;
      let pageNum = 1;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      // Page number
      pdf.setFontSize(7);
      pdf.setTextColor(180);
      pdf.text(`Página ${pageNum}`, pdfWidth - 20, pdfHeight - 5);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pageNum++;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.setFontSize(7);
        pdf.setTextColor(180);
        pdf.text(`Página ${pageNum}`, pdfWidth - 20, pdfHeight - 5);
        heightLeft -= pdfHeight;
      }

      // Save to storage
      const pdfBlob = pdf.output('blob');
      const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_');
      const dateFileStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      const fileName = `anamnese_${safeName}_${dateFileStr}.pdf`;
      const storagePath = `${clinic?.id}/${anamnese.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('generated-documents')
        .upload(storagePath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadErr) {
        console.warn('Storage upload error (saving locally):', uploadErr);
      }

      // Update document record with PDF URL
      if (docId && !uploadErr) {
        const { data: urlData } = supabase.storage
          .from('generated-documents')
          .getPublicUrl(storagePath);
        if (urlData?.publicUrl) {
          await supabase
            .from('clinical_documents')
            .update({ pdf_url: urlData.publicUrl })
            .eq('id', docId);
        }
      }

      // Register in patient history
      if (clinic?.id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('patient_generated_documents').insert({
            patient_id: anamnese.id,
            clinic_id: clinic.id,
            document_type: 'anamnese',
            title: `Anamnese - ${patient.name}${docReference ? ` (${docReference})` : ''}`,
            file_path: storagePath,
            file_name: fileName,
            generated_by: user.id,
            source_record_id: anamnese.id,
          });
        }
      }

      // Download
      pdf.save(fileName);
      toast.success(`Documento clínico gerado! ${docReference || ''}`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }, [settings, clinic?.id, clinic?.name, clinic?.cnpj, clinic?.phone, clinic?.email, clinic?.logo_url, getFormattedAddress]);

  return { generateAnamnesisPdf, generating, hasSettings: !!settings };
}
