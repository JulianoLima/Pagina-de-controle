import type { WorksheetPayload } from "@/lib/graph";

const status = ["Em andamento", "Concluído", "Atrasado", "Planejado", "Cancelado"];
const owners = [
  "Juliano Lima",
  "Ana Carolina",
  "Rafael Siqueira",
  "Beatriz Moraes",
  "Carlos Duarte",
  "Mariana Alves",
];

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 10);
}

export function buildMockWorksheet(): WorksheetPayload {
  const columns = [
    "Código",
    "Projeto",
    "Status",
    "Responsável",
    "Início",
    "Fim",
    "Orçamento",
    "Executado",
    "Progresso",
  ];

  const rows = Array.from({ length: 28 }).map((_, i) => {
    const budget = Math.round(50_000 + Math.random() * 950_000);
    const executed = Math.round(budget * Math.random());
    const progress = Math.min(1, executed / budget + Math.random() * 0.2);
    return {
      "Código": `PRJ-${String(1000 + i)}`,
      "Projeto": `Projeto ${i + 1} — Sebrae PR`,
      "Status": status[i % status.length],
      "Responsável": owners[i % owners.length],
      "Início": randomDate(new Date("2024-01-01"), new Date("2024-06-30")),
      "Fim": randomDate(new Date("2024-07-01"), new Date("2025-06-30")),
      "Orçamento": budget,
      "Executado": executed,
      "Progresso": Number(progress.toFixed(2)),
    } as Record<string, string | number | null>;
  });

  return { columns, rows };
}
