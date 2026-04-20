import { prisma } from "@/lib/prisma";
import { fetchWorksheet, type WorksheetPayload } from "@/lib/graph";
import { buildMockWorksheet } from "@/lib/mock-data";

/**
 * Normaliza o nome de uma coluna para lookup flexível (acentos e case).
 */
function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function pick(
  row: Record<string, string | number | null>,
  candidates: string[]
): string | number | null {
  for (const key of Object.keys(row)) {
    if (candidates.some((c) => norm(c) === norm(key))) return row[key];
  }
  return null;
}

function asString(v: string | number | null): string | null {
  if (v === null || v === undefined) return null;
  return String(v).trim() || null;
}

function asNumber(v: string | number | null): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function asDate(v: string | number | null): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") {
    // serial date do Excel
    const utcDays = v - 25569;
    const ms = utcDays * 86400 * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface SyncResult {
  rowsRead: number;
  rowsUpsert: number;
  status: "success" | "error";
  message?: string;
}

export async function runSync(): Promise<SyncResult> {
  const log = await prisma.syncLog.create({ data: { status: "running" } });

  try {
    const useMock = process.env.USE_MOCK_DATA === "true";
    const payload: WorksheetPayload = useMock
      ? buildMockWorksheet()
      : await fetchWorksheet();

    const worksheet = process.env.SHAREPOINT_WORKSHEET || "Geral Projetos";
    let upserts = 0;

    for (let i = 0; i < payload.rows.length; i++) {
      const row = payload.rows[i];
      const code =
        asString(pick(row, ["Código", "Codigo", "Code", "ID"])) ??
        `${worksheet}-${i + 2}`;

      await prisma.projectRow.upsert({
        where: { externalKey: code },
        create: {
          externalKey: code,
          worksheet,
          rowIndex: i + 2,
          projectName: asString(pick(row, ["Projeto", "Nome", "Project"])),
          status: asString(pick(row, ["Status", "Situação", "Situacao"])),
          owner: asString(pick(row, ["Responsável", "Responsavel", "Owner", "Gestor"])),
          startDate: asDate(pick(row, ["Início", "Inicio", "Start"])),
          endDate: asDate(pick(row, ["Fim", "Término", "Termino", "End"])),
          budget: asNumber(pick(row, ["Orçamento", "Orcamento", "Budget"])),
          executed: asNumber(pick(row, ["Executado", "Realizado", "Executed"])),
          progress: asNumber(pick(row, ["Progresso", "% Concluído", "Progress"])),
          data: JSON.stringify(row),
        },
        update: {
          worksheet,
          rowIndex: i + 2,
          projectName: asString(pick(row, ["Projeto", "Nome", "Project"])),
          status: asString(pick(row, ["Status", "Situação", "Situacao"])),
          owner: asString(pick(row, ["Responsável", "Responsavel", "Owner", "Gestor"])),
          startDate: asDate(pick(row, ["Início", "Inicio", "Start"])),
          endDate: asDate(pick(row, ["Fim", "Término", "Termino", "End"])),
          budget: asNumber(pick(row, ["Orçamento", "Orcamento", "Budget"])),
          executed: asNumber(pick(row, ["Executado", "Realizado", "Executed"])),
          progress: asNumber(pick(row, ["Progresso", "% Concluído", "Progress"])),
          data: JSON.stringify(row),
          syncedAt: new Date(),
        },
      });
      upserts++;
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        rowsRead: payload.rows.length,
        rowsUpsert: upserts,
        status: "success",
      },
    });

    return { rowsRead: payload.rows.length, rowsUpsert: upserts, status: "success" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { finishedAt: new Date(), status: "error", message },
    });
    return { rowsRead: 0, rowsUpsert: 0, status: "error", message };
  }
}

/**
 * Retorna true se a última sincronização bem-sucedida foi há mais do que o intervalo.
 */
export async function shouldResync(): Promise<boolean> {
  const intervalSec = Number(process.env.SYNC_INTERVAL_SECONDS ?? 60);
  const last = await prisma.syncLog.findFirst({
    where: { status: "success" },
    orderBy: { startedAt: "desc" },
  });
  if (!last) return true;
  const age = (Date.now() - last.startedAt.getTime()) / 1000;
  return age >= intervalSec;
}
