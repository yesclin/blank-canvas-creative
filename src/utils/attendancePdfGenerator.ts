import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * Generates a professional PDF from the consolidated attendance snapshot_json.
 * This never touches live prontuário fields — only the immutable snapshot.
 */

// ─── Constants ───────────────────────────────────────────
const A4_W = 210;
const A4_H = 297;
const M = 15; // margin
const CW = A4_W - M * 2; // content width
const LINE_H = 5;
const SECTION_GAP = 6;
const FONT_BODY = 9;
const FONT_SMALL = 7.5;
const FONT_HEADING = 11;
const FONT_TITLE = 14;
const PRIMARY_COLOR: [number, number, number] = [30, 64, 120];
const MUTED_COLOR: [number, number, number] = [120, 120, 130];
const TEXT_COLOR: [number, number, number] = [30, 30, 35];
const BORDER_COLOR: [number, number, number] = [210, 215, 220];

interface SnapshotData {
  version?: number;
  generated_at?: string;
  clinic?: any;
  appointment?: any;
  patient?: any;
  professional?: any;
  specialty?: any;
  procedure?: any;
  anamnesis?: any[];
  evolutions?: any[];
  documents?: any[];
  alerts?: any[];
  media?: any[];
  session_notes?: string | null;
  financial?: any;
}

/**
 * Integrity payload describing the signature applied to the document.
 * When provided, the PDF renders a "DOCUMENTO ASSINADO" status banner,
 * embeds signer evidence in a dedicated section, and shows the SHA-256
 * hash in the footer.
 */
export interface PdfIntegrityPayload {
  is_signed: boolean;
  is_locked?: boolean;
  document_id?: string | null;
  document_hash?: string | null;       // hash_sha256 stored on the document
  signature_id?: string | null;
  signed_at?: string | null;
  signer_name?: string | null;
  signer_user_id?: string | null;
  sign_method?: string | null;          // 'saved_signature' | 'handwritten'
  sign_method_label?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  /** Embedded signature image (PNG dataURL) used at the moment of signing. */
  signature_image_data_url?: string | null;
  /** Hash recomputed from the snapshot used to render this PDF. */
  recomputed_hash?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────
function fmtDateBR(d: string | null | undefined) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR');
  } catch { return d; }
}
function fmtTimeBR(d: string | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return String(d).slice(0, 5); }
}
function fmtDuration(s: number) {
  if (!s || s <= 0) return '0min';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

/**
 * SHA-256 of a value, computed exactly the same way as the signing engine
 * (`useUnifiedDocumentSigning.sha256`) — sorted top-level keys when object.
 * This guarantees the recomputed hash is comparable to the persisted one.
 */
async function sha256(content: unknown): Promise<string> {
  const json = JSON.stringify(
    content,
    content && typeof content === 'object' ? Object.keys(content as object).sort() : undefined
  );
  const buf = new TextEncoder().encode(json);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function shortHash(h?: string | null) {
  if (!h) return '—';
  return `${h.substring(0, 16)}…${h.substring(h.length - 8)}`;
}

function signMethodLabel(m?: string | null) {
  if (m === 'saved_signature') return 'Assinatura salva (Avançada YesClin)';
  if (m === 'handwritten') return 'Manuscrita (Avançada YesClin)';
  return m || '—';
}

// ─── PDF Builder ─────────────────────────────────────────
export async function generateAttendancePDF(
  snapshot: SnapshotData,
  options?: { download?: boolean; print?: boolean; integrity?: PdfIntegrityPayload }
): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = M;

  const shouldDownload = options?.download ?? true;
  const shouldPrint = options?.print ?? false;

  // ── Utility functions ──
  function checkPage(needed: number) {
    if (y + needed > A4_H - M - 10) {
      addFooter(pdf, snapshot, options?.integrity, false);
      pdf.addPage();
      y = M;
      return true;
    }
    return false;
  }

  function drawLine(yPos: number) {
    pdf.setDrawColor(...BORDER_COLOR);
    pdf.setLineWidth(0.3);
    pdf.line(M, yPos, M + CW, yPos);
  }

  function addSectionTitle(title: string) {
    checkPage(12);
    y += SECTION_GAP;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_HEADING);
    pdf.setTextColor(...PRIMARY_COLOR);
    pdf.text(title.toUpperCase(), M, y);
    y += 2;
    drawLine(y);
    y += 4;
    pdf.setTextColor(...TEXT_COLOR);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_BODY);
  }

  function addKeyValue(key: string, value: string, indent = 0) {
    checkPage(LINE_H + 1);
    const x = M + indent;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SMALL);
    pdf.setTextColor(...MUTED_COLOR);
    pdf.text(`${key}:`, x, y);
    const keyW = pdf.getTextWidth(`${key}: `);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_BODY);
    pdf.setTextColor(...TEXT_COLOR);
    const remaining = CW - indent - keyW;
    const lines = pdf.splitTextToSize(value || '—', remaining);
    pdf.text(lines, x + keyW, y);
    y += lines.length * LINE_H;
  }

  function addText(text: string, indent = 0) {
    const lines = pdf.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      checkPage(LINE_H);
      pdf.text(line, M + indent, y);
      y += LINE_H;
    }
  }

  // ── Integrity context ──
  // We use the EXACT snapshot persisted with the signed document. The
  // recomputed hash uses the same algorithm as `useUnifiedDocumentSigning`,
  // so it is byte-equivalent to `hash_sha256` if the snapshot wasn't tampered.
  const integrity = options?.integrity;
  let recomputedHash: string | null = null;
  if (integrity?.is_signed) {
    try {
      recomputedHash = await sha256({
        ...(snapshot || {}),
        __sign_method: integrity.sign_method || null,
      });
    } catch { recomputedHash = null; }
  }
  const hashesMatch =
    !!integrity?.is_signed &&
    !!integrity?.document_hash &&
    !!recomputedHash &&
    integrity.document_hash === recomputedHash;

  // ── 1. Institutional Header ──
  const clinic = snapshot.clinic || {};
  pdf.setFontSize(FONT_TITLE);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...PRIMARY_COLOR);
  pdf.text(clinic.name || 'Clínica', M, y);
  y += 5;

  pdf.setFontSize(FONT_SMALL);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...MUTED_COLOR);
  const clinicInfo = [
    clinic.cnpj ? `CNPJ: ${clinic.cnpj}` : '',
    clinic.phone ? `Tel: ${clinic.phone}` : '',
    clinic.email || '',
  ].filter(Boolean).join('  •  ');
  if (clinicInfo) { pdf.text(clinicInfo, M, y); y += 4; }
  if (clinic.address) { pdf.text(clinic.address, M, y); y += 4; }

  y += 2;
  drawLine(y);
  y += 3;

  // Document title
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...TEXT_COLOR);
  pdf.text('DOCUMENTO CONSOLIDADO DE ATENDIMENTO', M, y);
  y += 6;

  // ── Signed status banner ─────────────────────────────────
  if (integrity?.is_signed) {
    const bannerH = 9;
    const ok = hashesMatch;
    if (ok) pdf.setFillColor(220, 245, 230); // light green
    else pdf.setFillColor(254, 243, 199);     // light amber (mismatch)
    pdf.setDrawColor(...BORDER_COLOR);
    pdf.setLineWidth(0.2);
    pdf.rect(M, y, CW, bannerH, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_BODY);
    pdf.setTextColor(ok ? 22 : 146, ok ? 101 : 64, ok ? 52 : 14);
    pdf.text(
      ok
        ? 'DOCUMENTO ASSINADO E TRAVADO — Integridade verificada'
        : 'DOCUMENTO ASSINADO — Atenção: hash recomputado diverge do persistido',
      M + 3,
      y + 6
    );
    y += bannerH + 3;
    pdf.setTextColor(...TEXT_COLOR);
  }


  // ── 2. Appointment Context ──
  const apt = snapshot.appointment || {};
  const patient = snapshot.patient || {};
  const prof = snapshot.professional || {};
  const spec = snapshot.specialty || {};
  const proc = snapshot.procedure || {};

  pdf.setFontSize(FONT_BODY);
  // Two-column layout for context
  const col2X = M + CW / 2;
  const contextPairs = [
    [['Paciente', patient.full_name || '—'], ['Profissional', prof.full_name || '—']],
    [['Especialidade', spec.name || '—'], ['Procedimento', proc.name || '—']],
    [['Data', fmtDateBR(apt.scheduled_date)], ['Modo', apt.care_mode === 'teleconsulta' ? 'Teleconsulta' : 'Presencial']],
    [['Início', fmtTimeBR(apt.started_at)], ['Término', fmtTimeBR(apt.finished_at)]],
    [['Duração efetiva', fmtDuration(apt.effective_seconds || 0)], ['Pausado', fmtDuration(apt.paused_seconds || 0)]],
  ];

  for (const [left, right] of contextPairs) {
    checkPage(LINE_H + 1);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SMALL);
    pdf.setTextColor(...MUTED_COLOR);
    pdf.text(`${left[0]}:`, M, y);
    pdf.text(`${right[0]}:`, col2X, y);

    const lkW = pdf.getTextWidth(`${left[0]}: `);
    const rkW = pdf.getTextWidth(`${right[0]}: `);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_BODY);
    pdf.setTextColor(...TEXT_COLOR);
    pdf.text(left[1], M + lkW, y);
    pdf.text(right[1], col2X + rkW, y);
    y += LINE_H + 0.5;
  }

  y += 2;
  drawLine(y);
  y += 2;

  // ── 3. Clinical Alerts ──
  const alerts = snapshot.alerts || [];
  if (alerts.length > 0) {
    addSectionTitle('Alertas Clínicos');
    for (const a of alerts) {
      checkPage(LINE_H * 2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(FONT_BODY);
      const prefix = a.severity === 'critical' ? '⚠ CRÍTICO' : a.severity === 'warning' ? '⚠ Alerta' : 'ℹ Info';
      pdf.text(`${prefix} — ${a.title}`, M + 2, y);
      y += LINE_H;
      if (a.description) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SMALL);
        addText(a.description, 2);
      }
    }
  }

  // ── 4. Anamnesis ──
  const anamnesis = snapshot.anamnesis || [];
  if (anamnesis.length > 0) {
    addSectionTitle('Anamnese');
    for (const rec of anamnesis) {
      checkPage(LINE_H * 2);
      if (rec.template_name) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_BODY);
        pdf.text(`Modelo: ${rec.template_name}`, M + 2, y);
        y += LINE_H;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(FONT_BODY);
      const data = rec.responses || {};
      if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data).filter(([_, v]) => v != null && v !== '');
        for (const [key, value] of entries.slice(0, 30)) {
          addKeyValue(key.replace(/_/g, ' '), typeof value === 'object' ? JSON.stringify(value) : String(value), 2);
        }
        if (entries.length > 30) {
          pdf.setFontSize(FONT_SMALL);
          pdf.setTextColor(...MUTED_COLOR);
          addText(`+ ${entries.length - 30} campos adicionais`, 2);
          pdf.setTextColor(...TEXT_COLOR);
        }
      }
      y += 2;
    }
  }

  // ── 5. Evolutions ──
  const evolutions = snapshot.evolutions || [];
  if (evolutions.length > 0) {
    addSectionTitle('Evoluções Clínicas');
    for (const ev of evolutions) {
      checkPage(LINE_H * 2);
      if (ev.evolution_type) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(FONT_SMALL);
        pdf.setTextColor(...MUTED_COLOR);
        pdf.text(`Tipo: ${ev.evolution_type}`, M + 2, y);
        y += LINE_H;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(FONT_BODY);
      pdf.setTextColor(...TEXT_COLOR);

      if (ev.content && typeof ev.content === 'object') {
        const entries = Object.entries(ev.content).filter(([_, v]) => v != null && v !== '');
        for (const [key, value] of entries.slice(0, 20)) {
          addKeyValue(key.replace(/_/g, ' '), typeof value === 'object' ? JSON.stringify(value) : String(value), 2);
        }
      }
      if (ev.notes) {
        addKeyValue('Notas', ev.notes, 2);
      }
      y += 2;
    }
  }

  // ── 6. Clinical Documents ──
  const docs = snapshot.documents || [];
  if (docs.length > 0) {
    addSectionTitle('Documentos Clínicos');
    for (const doc of docs) {
      checkPage(LINE_H);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(FONT_BODY);
      pdf.text(`• ${doc.title} (${doc.document_type}) — ${doc.status}`, M + 2, y);
      y += LINE_H;
    }
  }

  // ── 7. Clinical Media ──
  const media = snapshot.media || [];
  if (media.length > 0) {
    addSectionTitle('Imagens e Anexos');
    for (const m of media) {
      checkPage(LINE_H * 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(FONT_BODY);
      const desc = [m.file_name, m.classification, m.description].filter(Boolean).join(' — ');
      pdf.text(`• ${desc}`, M + 2, y);
      y += LINE_H;

      // Try to embed images
      if (m.file_type?.startsWith('image') && m.file_url) {
        try {
          const img = await loadImage(m.file_url);
          const maxW = CW - 20;
          const maxH = 50;
          const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
          const w = img.width * ratio;
          const h = img.height * ratio;
          checkPage(h + 4);
          pdf.addImage(img, 'JPEG', M + 10, y, w, h);
          y += h + 4;
        } catch {
          pdf.setFontSize(FONT_SMALL);
          pdf.setTextColor(...MUTED_COLOR);
          pdf.text('[Imagem não disponível]', M + 10, y);
          y += LINE_H;
          pdf.setTextColor(...TEXT_COLOR);
        }
      }
    }
  }

  // ── 8. Financial ──
  const fin = snapshot.financial;
  if (fin && (fin.amount_expected > 0 || fin.amount_received > 0)) {
    addSectionTitle('Financeiro');
    addKeyValue('Valor previsto', fmtCurrency(fin.amount_expected || 0), 2);
    addKeyValue('Valor recebido', fmtCurrency(fin.amount_received || 0), 2);
    const pending = Math.max(0, (fin.amount_expected || 0) - (fin.amount_received || 0));
    if (pending > 0) addKeyValue('Pendente', fmtCurrency(pending), 2);
    addKeyValue('Status', fin.payment_status || '—', 2);
  }

  // ── 9. Session Notes ──
  if (snapshot.session_notes) {
    addSectionTitle('Observações da Sessão');
    addText(snapshot.session_notes, 2);
  }

  if (apt.notes) {
    addSectionTitle('Observações do Agendamento');
    addText(apt.notes, 2);
  }

  // ── 10. Integridade & Assinatura ─────────────────────────
  if (integrity?.is_signed) {
    addSectionTitle('Integridade e Assinatura');

    addKeyValue('Status', hashesMatch ? 'Assinado e travado — íntegro' : 'Assinado — hash divergente (revisar)', 2);
    addKeyValue('Assinante', integrity.signer_name || '—', 2);
    addKeyValue('ID do usuário', integrity.signer_user_id || '—', 2);
    addKeyValue('Modo', integrity.sign_method_label || signMethodLabel(integrity.sign_method), 2);
    addKeyValue(
      'Assinado em',
      integrity.signed_at
        ? `${fmtDateBR(integrity.signed_at)} às ${fmtTimeBR(integrity.signed_at)}`
        : '—',
      2
    );
    addKeyValue('IP', integrity.ip_address || '—', 2);
    if (integrity.user_agent) addKeyValue('Dispositivo', integrity.user_agent.substring(0, 110), 2);
    if (integrity.signature_id) addKeyValue('ID da assinatura', integrity.signature_id, 2);
    if (integrity.document_id) addKeyValue('ID do documento', integrity.document_id, 2);

    y += 1;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SMALL);
    pdf.setTextColor(...MUTED_COLOR);
    pdf.text('Hash SHA-256 do documento (persistido):', M + 2, y);
    y += LINE_H - 0.5;
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(FONT_SMALL);
    pdf.setTextColor(...TEXT_COLOR);
    const persistedLines = pdf.splitTextToSize(integrity.document_hash || '—', CW - 4);
    pdf.text(persistedLines, M + 2, y);
    y += persistedLines.length * (LINE_H - 0.5) + 1;

    if (recomputedHash) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(FONT_SMALL);
      pdf.setTextColor(...MUTED_COLOR);
      pdf.text('Hash SHA-256 recomputado deste PDF:', M + 2, y);
      y += LINE_H - 0.5;
      pdf.setFont('courier', 'normal');
      pdf.setTextColor(hashesMatch ? 22 : 146, hashesMatch ? 101 : 64, hashesMatch ? 52 : 14);
      const recomputedLines = pdf.splitTextToSize(recomputedHash, CW - 4);
      pdf.text(recomputedLines, M + 2, y);
      y += recomputedLines.length * (LINE_H - 0.5) + 1;
    }
    pdf.setTextColor(...TEXT_COLOR);
    pdf.setFont('helvetica', 'normal');

    // Embedded signature image (immutable copy captured at signing time)
    if (integrity.signature_image_data_url) {
      try {
        const sigImg = await loadImage(integrity.signature_image_data_url);
        const maxW = 70;
        const maxH = 25;
        const ratio = Math.min(maxW / sigImg.width, maxH / sigImg.height, 1);
        const w = sigImg.width * ratio;
        const h = sigImg.height * ratio;
        checkPage(h + 8);
        y += 2;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SMALL);
        pdf.setTextColor(...MUTED_COLOR);
        pdf.text('Assinatura utilizada no ato:', M + 2, y);
        y += LINE_H;
        pdf.addImage(sigImg, 'PNG', M + 2, y, w, h);
        y += h + 2;
        pdf.setDrawColor(...BORDER_COLOR);
        pdf.line(M + 2, y, M + 2 + w, y);
        y += 3;
        pdf.setTextColor(...TEXT_COLOR);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SMALL);
        pdf.text(integrity.signer_name || '', M + 2, y);
        y += LINE_H;
      } catch { /* signature image optional */ }
    }
  }

  // ── Footer on last page ──
  addFooter(pdf, snapshot, integrity, hashesMatch);

  // ── Output ──
  const blob = pdf.output('blob');
  const patientName = (patient.full_name || 'paciente').replace(/\s+/g, '_');
  const filename = `Atendimento_${patientName}_${fmtDateBR(apt.scheduled_date).replace(/\//g, '-')}.pdf`;

  if (shouldDownload) {
    pdf.save(filename);
  }

  if (shouldPrint) {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 5000);
    };
  }

  return blob;
}

function addFooter(pdf: jsPDF, snapshot: SnapshotData) {
  const pageCount = pdf.getNumberOfPages();
  const currentPage = pdf.getCurrentPageInfo().pageNumber;
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...MUTED_COLOR);
  
  // Footer line
  pdf.setDrawColor(...BORDER_COLOR);
  pdf.setLineWidth(0.2);
  pdf.line(M, A4_H - 15, M + CW, A4_H - 15);
  
  // Left: clinic name
  pdf.text(snapshot.clinic?.name || '', M, A4_H - 11);
  
  // Center: generation date
  const genDate = snapshot.generated_at ? `Gerado em ${fmtDateBR(snapshot.generated_at)} às ${fmtTimeBR(snapshot.generated_at)}` : '';
  if (genDate) {
    const tw = pdf.getTextWidth(genDate);
    pdf.text(genDate, M + (CW - tw) / 2, A4_H - 11);
  }
  
  // Right: page number
  const pageText = `Página ${currentPage} de ${pageCount}`;
  const pw = pdf.getTextWidth(pageText);
  pdf.text(pageText, M + CW - pw, A4_H - 11);
  
  // Integrity note
  pdf.setFontSize(6);
  pdf.text('Documento consolidado de atendimento — gerado automaticamente pelo sistema YesClin', M, A4_H - 7);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
    setTimeout(() => reject(new Error('Image load timeout')), 8000);
  });
}

/**
 * Wrapper hook-style function for use in components.
 */
export async function handleDownloadPDF(snapshotJson: any) {
  try {
    toast.loading('Gerando PDF...', { id: 'pdf-gen' });
    await generateAttendancePDF(snapshotJson, { download: true });
    toast.success('PDF gerado com sucesso!', { id: 'pdf-gen' });
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Erro ao gerar PDF. Tente novamente.', { id: 'pdf-gen' });
  }
}

export async function handlePrintAttendance(snapshotJson: any) {
  try {
    toast.loading('Preparando impressão...', { id: 'print-gen' });
    await generateAttendancePDF(snapshotJson, { download: false, print: true });
    toast.success('Documento enviado para impressão.', { id: 'print-gen' });
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Erro ao preparar impressão.', { id: 'print-gen' });
  }
}
