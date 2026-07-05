import jsPDF from "jspdf";

export function toCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) {
    const blob = new Blob(["\ufeff"], { type: "text/csv;charset=utf-8;" });
    return download(blob, filename);
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const csv =
    "\ufeff" +
    [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function toPDF(title: string, rows: Record<string, any>[], filename: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString("pt-BR"), 14, 22);

  if (!rows.length) {
    doc.text("Sem dados no período.", 14, 35);
    doc.save(filename);
    return;
  }
  const headers = Object.keys(rows[0]);
  const colW = Math.max(20, Math.floor(270 / headers.length));
  let y = 32;
  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => doc.text(String(h).slice(0, 18), 14 + i * colW, y));
  doc.setFont("helvetica", "normal");
  y += 6;
  rows.forEach((r) => {
    if (y > 195) {
      doc.addPage();
      y = 20;
    }
    headers.forEach((h, i) => {
      const v = r[h] == null ? "" : String(r[h]);
      doc.text(v.slice(0, 22), 14 + i * colW, y);
    });
    y += 5;
  });
  doc.save(filename);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const fmtMoney = (n: number) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
