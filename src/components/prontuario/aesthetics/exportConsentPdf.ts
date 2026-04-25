/**
 * Export an aesthetic consent record as a PDF.
 *
 * The PDF is generated natively with jsPDF (text is selectable) and includes
 * the patient's signature image when available. Designed to work even when:
 * - the term content is long (auto page breaks)
 * - the consent dialog is scrollable (we read from the record, not the DOM)
 * - the signature is base64/canvas-derived/image
 * - optional metadata fields are missing
 */
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AestheticConsentRecord } from "./types";

export interface ExportConsentPdfInput {
  consent: AestheticConsentRecord & {
    procedure_name?: string | null;
    geolocation?: string | null;
  };
  clinicName?: string | null;
  patientName?: string | null;
  professionalName?: string | null;
}

function sanitizeFilenamePart(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function buildConsentFileName(
  patientName: string | null | undefined,
  acceptedAt: string,
): string {
  const safeName = sanitizeFilenamePart(patientName) || "paciente";
  const dateStr = (() => {
    try {
      return format(parseISO(acceptedAt), "yyyy-MM-dd");
    } catch {
      return "sem-data";
    }
  })();
  return `termo-consentimento-${safeName}-${dateStr}.pdf`;
}

export async function exportConsentPdf({
  consent,
  clinicName,
  patientName,
  professionalName,
}: ExportConsentPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const ensureSpace = (needed: number) => {
    if (cursorY + needed > pageHeight - margin - 10) {
      pdf.addPage();
      cursorY = margin;
    }
  };

  const writeLine = (
    text: string,
    options: { size?: number; bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    const { size = 10, bold = false, color = [0, 0, 0] } = options;
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    const wrapped = pdf.splitTextToSize(text, contentWidth);
    const lineHeight = size * 0.42;
    for (const line of wrapped) {
      ensureSpace(lineHeight);
      pdf.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
  };

  const writeKeyValue = (key: string, value: string | null | undefined) => {
    if (!value) return;
    writeLine(`${key}: ${value}`, { size: 10 });
  };

  // Header
  writeLine(clinicName || "Termo de Consentimento", {
    size: 14,
    bold: true,
  });
  cursorY += 1;
  writeLine("Termo de Consentimento Informado", {
    size: 11,
    bold: true,
    color: [80, 80, 80],
  });
  cursorY += 4;

  // Title and version
  writeLine(consent.term_title, { size: 13, bold: true });
  cursorY += 2;

  const acceptedDate = (() => {
    try {
      return format(parseISO(consent.accepted_at), "dd/MM/yyyy 'às' HH:mm:ss", {
        locale: ptBR,
      });
    } catch {
      return consent.accepted_at;
    }
  })();

  writeKeyValue("Versão do termo", String(consent.term_version));
  writeKeyValue("Status", "Aceito e assinado digitalmente");
  writeKeyValue("Data/hora do aceite", acceptedDate);
  writeKeyValue("Paciente", patientName);
  writeKeyValue("Profissional responsável", professionalName);
  if (consent.procedure_name) {
    writeKeyValue("Procedimento", consent.procedure_name);
  }
  cursorY += 4;

  // Term content
  writeLine("Conteúdo do termo", { size: 11, bold: true });
  cursorY += 1;
  writeLine(consent.term_content || "(sem conteúdo)", { size: 10 });
  cursorY += 6;

  // Signature
  writeLine("Assinatura digital do paciente", { size: 11, bold: true });
  cursorY += 2;

  if (consent.signature_data) {
    try {
      const sigWidth = 70;
      const sigHeight = 30;
      ensureSpace(sigHeight + 4);
      // Detect format from data URL header; default to PNG
      const format = consent.signature_data.startsWith("data:image/jpeg")
        ? "JPEG"
        : "PNG";
      pdf.addImage(
        consent.signature_data,
        format,
        margin,
        cursorY,
        sigWidth,
        sigHeight,
      );
      cursorY += sigHeight + 2;
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, cursorY, margin + sigWidth, cursorY);
      cursorY += 4;
      writeLine(patientName || "Paciente", { size: 9, color: [100, 100, 100] });
    } catch (err) {
      // If image cannot be embedded, write a placeholder so the PDF still exports.
      // eslint-disable-next-line no-console
      console.warn("[exportConsentPdf] failed to embed signature image", err);
      writeLine("(Assinatura registrada — não foi possível renderizar a imagem)", {
        size: 9,
        color: [120, 120, 120],
      });
    }
  } else {
    writeLine("(Sem imagem de assinatura registrada)", {
      size: 9,
      color: [120, 120, 120],
    });
  }
  cursorY += 6;

  // Audit metadata
  const hasAudit =
    consent.id || consent.ip_address || consent.user_agent || consent.geolocation;
  if (hasAudit) {
    writeLine("Rastreabilidade", { size: 11, bold: true });
    cursorY += 1;
    writeKeyValue("ID do consentimento", consent.id);
    writeKeyValue("Endereço IP", consent.ip_address ?? null);
    writeKeyValue("User agent", consent.user_agent ?? null);
    writeKeyValue("Geolocalização", consent.geolocation ?? null);
    cursorY += 4;
  }

  // Footer on every page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    const footer = "Documento assinado digitalmente pelo paciente no sistema YesClin.";
    pdf.text(footer, margin, pageHeight - 8);
    pdf.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" },
    );
  }

  const fileName = buildConsentFileName(patientName, consent.accepted_at);
  pdf.save(fileName);
}
