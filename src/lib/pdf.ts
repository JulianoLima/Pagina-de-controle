"use client";

import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type { ProjectRow } from "@/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  columns: { key: keyof ProjectRow | "custom"; label: string }[];
  rows: ProjectRow[];
  filtersDescription?: string;
  generatedBy?: string;
  includeSummary?: boolean;
}

function cellValue(row: ProjectRow, key: PdfReportOptions["columns"][number]["key"]): string {
  if (key === "budget" || key === "executed") return formatCurrency(row[key] as number | null);
  if (key === "progress") return formatPercent(row[key] as number | null);
  if (key === "startDate" || key === "endDate") return formatDate(row[key] as string | null);
  const v = row[key as keyof ProjectRow];
  return v === null || v === undefined ? "—" : String(v);
}

export function generatePdfReport(opts: PdfReportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(opts.title, 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);

  const metaLines: string[] = [];
  if (opts.subtitle) metaLines.push(opts.subtitle);
  metaLines.push(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  if (opts.generatedBy) metaLines.push(`Por ${opts.generatedBy}`);
  if (opts.filtersDescription) metaLines.push(`Filtros: ${opts.filtersDescription}`);

  metaLines.forEach((line, i) => {
    doc.text(line, 40, 58 + i * 14);
  });

  let y = 58 + metaLines.length * 14 + 10;

  if (opts.includeSummary) {
    const total = opts.rows.length;
    const budget = opts.rows.reduce((a, r) => a + (r.budget ?? 0), 0);
    const executed = opts.rows.reduce((a, r) => a + (r.executed ?? 0), 0);
    const delayed = opts.rows.filter((r) => r.status?.toLowerCase().includes("atras")).length;

    const summary: RowInput[] = [
      ["Projetos", String(total)],
      ["Orçamento total", formatCurrency(budget)],
      [
        "Executado",
        `${formatCurrency(executed)} (${formatPercent(
          budget > 0 ? executed / budget : 0
        )})`,
      ],
      ["Atrasados", String(delayed)],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: summary,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 40, right: 40 },
      tableWidth: 280,
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  autoTable(doc, {
    startY: y,
    head: [opts.columns.map((c) => c.label)],
    body: opts.rows.map((r) => opts.columns.map((c) => cellValue(r, c.key))),
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 80,
      doc.internal.pageSize.getHeight() - 20
    );
  }

  const safeName = opts.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${safeName}-${stamp}.pdf`);
}
