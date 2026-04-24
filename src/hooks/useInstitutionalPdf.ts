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
import { escapeHtml } from '@/lib/htmlEscape';

// ─── Signature lookup ────────────────────────────────────────────

interface AnamnesisSignatureBlock {
  signed: boolean;
  signed_at?: string | null;
  signed_by_name?: string | null;
  signed_by_registration?: string | null;
  ip_address?: string | null;
  geolocation?: { latitude?: number | null; longitude?: number | null; status?: string | null } | null;
  signature_hash?: string | null;
  signature_image_url?: string | null; // data URL or signed URL — directly embeddable
  signature_id?: string | null;
}

/**
 * Fetches the digital signature linked to a specific anamnesis record id.
 * Looks ONLY at medical_record_signatures with record_type='anamnesis'
 * and record_id = anamnesisRecordId. Never falls back to other records.
 */
export async function getAnamnesisSignature(
  anamnesisRecordId: string,
): Promise<AnamnesisSignatureBlock> {
  if (!anamnesisRecordId) return { signed: false };
  try {
    const { data, error } = await supabase
      .from('medical_record_signatures')
      .select(
        'id, signed_at, signed_by_name, signed_by_professional_id, ip_address, geolocation, signature_hash, evidence_snapshot, handwritten_path, is_revoked'
      )
      .eq('record_id', anamnesisRecordId)
      .eq('record_type', 'anamnesis')
      .eq('is_revoked', false)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return { signed: false };

    // Prefer the immutable embedded data URL; fall back to a signed URL for the path.
    let signatureImage: string | null =
      (data.evidence_snapshot as any)?.signature_data_url || null;

    if (!signatureImage && data.handwritten_path) {
      const { data: signed } = await supabase.storage
        .from('signature-evidence')
        .createSignedUrl(data.handwritten_path, 60 * 30);
      signatureImage = signed?.signedUrl || null;
    }

    // Resolve professional registration (CRM/CRP/etc.) if available.
    let registration: string | null = null;
    if (data.signed_by_professional_id) {
      try {
        const { data: prof } = await supabase
          .from('professionals')
          .select('council_number, council_type, council_state')
          .eq('id', data.signed_by_professional_id)
          .maybeSingle();
        if (prof?.council_number) {
          const parts = [prof.council_type, prof.council_number, prof.council_state]
            .filter(Boolean)
            .join(' ');
          registration = parts || prof.council_number;
        }
      } catch { /* ignore */ }
    }

    return {
      signed: true,
      signed_at: data.signed_at,
      signed_by_name: data.signed_by_name,
      signed_by_registration: registration,
      ip_address: data.ip_address,
      geolocation: (data.geolocation as any) || null,
      signature_hash: data.signature_hash,
      signature_image_url: signatureImage,
      signature_id: data.id,
    };
  } catch (e) {
    console.warn('[PDF] getAnamnesisSignature failed:', e);
    return { signed: false };
  }
}

function buildSignatureBlockHtml(sig: AnamnesisSignatureBlock): string {
  if (!sig.signed) {
    return `
      <div style="margin-top:24px;padding:14px 16px;border:1px dashed #d1d5db;border-radius:6px;background:#fafafa;">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Assinatura Digital</div>
        <div style="font-size:10px;color:#6b7280;">Documento não assinado digitalmente.</div>
      </div>`;
  }

  const dateStr = sig.signed_at
    ? format(new Date(sig.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : '—';

  const lines: string[] = [];
  lines.push(
    `<div style="font-size:10px;color:#1f2937;margin-bottom:4px;">Documento assinado digitalmente por:</div>`
  );
  lines.push(
    `<div style="font-size:12px;font-weight:700;color:#111827;">${escapeHtml(sig.signed_by_name || '—')}</div>`
  );
  if (sig.signed_by_registration) {
    lines.push(
      `<div style="font-size:9px;color:#6b7280;margin-top:1px;">${escapeHtml(sig.signed_by_registration)}</div>`
    );
  }
  lines.push(
    `<div style="font-size:9px;color:#374151;margin-top:6px;">Assinado em: <strong>${dateStr}</strong></div>`
  );
  if (sig.ip_address) {
    lines.push(
      `<div style="font-size:9px;color:#6b7280;margin-top:1px;">IP: ${escapeHtml(sig.ip_address)}</div>`
    );
  }
  if (sig.geolocation && (sig.geolocation.latitude != null || sig.geolocation.longitude != null)) {
    const lat = sig.geolocation.latitude;
    const lng = sig.geolocation.longitude;
    lines.push(
      `<div style="font-size:9px;color:#6b7280;margin-top:1px;">Localização: ${lat}, ${lng}</div>`
    );
  }
  if (sig.signature_hash) {
    lines.push(
      `<div style="font-size:8px;color:#9ca3af;margin-top:4px;word-break:break-all;font-family:'Courier New',monospace;">Hash: ${escapeHtml(sig.signature_hash)}</div>`
    );
  }

  const imageHtml = sig.signature_image_url
    ? `<div style="margin-top:10px;">
         <img src="${sig.signature_image_url}" crossorigin="anonymous" style="max-height:70px;max-width:240px;object-fit:contain;background:white;padding:4px;border:1px solid #e5e7eb;border-radius:4px;" />
       </div>`
    : '';

  return `
    <div style="margin-top:24px;padding:14px 16px;border:1px solid #bfdbfe;border-radius:6px;background:#eff6ff;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:#1d4ed8;text-transform:uppercase;">Assinatura Digital</div>
        <span style="display:inline-block;padding:2px 8px;font-size:8px;font-weight:700;letter-spacing:1px;color:#065f46;background:#d1fae5;border:1px solid #a7f3d0;border-radius:999px;">VÁLIDA</span>
      </div>
      ${lines.join('')}
      ${imageHtml}
    </div>`;
}

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
  template_name?: string;
  signed_at?: string | null;
}

/**
 * Flat dynamic field shape — used by aesthetics dynamic templates.
 * Compatible with DynamicField from anamnese-fields/types and with
 * structure_snapshot rows persisted in anamnesis_records.
 */
interface DynamicFieldLite {
  id: string;
  label: string;
  section?: string;
  type?: string;
}

/**
 * Groups a flat list of dynamic fields into SecaoAnamnese[] using `section`
 * as the grouping key, preserving original field order.
 */
function groupDynamicFieldsIntoSections(fields: DynamicFieldLite[]): SecaoAnamnese[] {
  const groups = new Map<string, SecaoAnamnese>();
  const order: string[] = [];
  for (const f of fields) {
    const key = (f.section && f.section.trim()) || 'Anamnese';
    if (!groups.has(key)) {
      groups.set(key, {
        id: key.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        titulo: key,
        icon: 'FileText',
        campos: [],
      });
      order.push(key);
    }
    groups.get(key)!.campos.push({
      id: f.id,
      label: f.label,
      type: 'text',
    });
  }
  return order.map(k => groups.get(k)!);
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
  signatureBlock?: AnamnesisSignatureBlock,
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

  // ── Document Title (uses template name when available) ──
  const titleText = (anamnese.template_name && anamnese.template_name.trim())
    ? anamnese.template_name.toUpperCase()
    : 'ANAMNESE CLÍNICA';
  const signedBadge = anamnese.signed_at
    ? `<span style="display:inline-block;margin-left:8px;padding:2px 8px;font-size:8px;font-weight:700;letter-spacing:1px;color:#1d4ed8;background:#dbeafe;border:1px solid #bfdbfe;border-radius:999px;vertical-align:middle;">ASSINADO</span>`
    : '';
  const titleHtml = `
    <div style="margin:16px 20mm 0 20mm;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:${pc};letter-spacing:1.5px;text-transform:uppercase;">${titleText}${signedBadge}</div>
      ${docReference ? `<div style="font-size:8px;color:#9ca3af;margin-top:3px;">${docReference}</div>` : ''}
    </div>`;

  // ── Content ──
  const bodyHtml = `
    <div style="margin:16px 20mm 0 20mm;flex:1;">
      ${contentHtml}
    </div>`;

  // ── Professional footer signature image (institutional, optional) ──
  const profSigImageHtml = s.show_digital_signature && s.signature_image_url
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

  // ── Digital Signature block (always rendered: signed or not) ──
  const digitalSignatureHtml = `
    <div style="margin:18px 20mm 0 20mm;">
      ${buildSignatureBlockHtml(signatureBlock || { signed: false })}
    </div>`;

  const footerHtml = `
    <div style="margin:auto 20mm 20mm 20mm;border-top:1px solid #e5e7eb;padding-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          ${qrBlock}
        </div>
        <div style="text-align:right;">
          ${profSigImageHtml}
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
      ${digitalSignatureHtml}
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
    dynamicFields?: DynamicFieldLite[],
  ) => {
    // ── VALIDATIONS ─────────────────────────────────────────────────
    if (!anamnese?.id) {
      toast.error('Selecione uma anamnese para gerar o PDF.');
      return;
    }
    const responses = anamnese.structured_data || {};
    const hasResponses = Object.values(responses).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
    // Resolve sections: prefer explicit sections, else build from dynamic fields
    let resolvedSections: SecaoAnamnese[] = sections;
    if ((!resolvedSections || resolvedSections.length === 0) && dynamicFields && dynamicFields.length > 0) {
      resolvedSections = groupDynamicFieldsIntoSections(dynamicFields);
    }
    if (!hasResponses) {
      toast.error('Nenhuma resposta preenchida para esta anamnese.');
      return;
    }

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

      // Fetch digital signature linked to this exact anamnesis record (if any)
      const signatureBlock = await getAnamnesisSignature(anamnese.id);
      // Keep header badge consistent with the actual signature lookup
      const anamneseForRender: AnamneseForPdf = {
        ...anamnese,
        signed_at: signatureBlock.signed ? (signatureBlock.signed_at || anamnese.signed_at || null) : anamnese.signed_at || null,
      };

      // Build HTML for hash (without QR)
      const htmlForHash = buildPremiumHtml(clinicInfo, patient, profInfo, anamneseForRender, resolvedSections, settings, docReference, undefined, undefined, signatureBlock);
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

      // Build final HTML with QR + signature block
      const html = buildPremiumHtml(clinicInfo, patient, profInfo, anamneseForRender, resolvedSections, settings, docReference, docId, qrCodeDataUrl, signatureBlock);

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
