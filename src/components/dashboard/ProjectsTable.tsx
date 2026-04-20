"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectRow } from "@/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

function statusBadge(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s.includes("conclu")) return "bg-emerald-100 text-emerald-800";
  if (s.includes("andam")) return "bg-blue-100 text-blue-800";
  if (s.includes("atras")) return "bg-red-100 text-red-800";
  if (s.includes("planej")) return "bg-amber-100 text-amber-800";
  if (s.includes("cancel")) return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

export function ProjectsTable({ rows }: { rows: ProjectRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Projeto</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Responsável</th>
                <th className="py-2 pr-3">Início</th>
                <th className="py-2 pr-3">Fim</th>
                <th className="py-2 pr-3 text-right">Orçamento</th>
                <th className="py-2 pr-3 text-right">Executado</th>
                <th className="py-2 pr-3 text-right">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b transition-colors hover:bg-muted/40">
                  <td className="py-2 pr-3 font-mono text-xs">{r.externalKey}</td>
                  <td className="py-2 pr-3">{r.projectName ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(
                        r.status
                      )}`}
                    >
                      {r.status ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{r.owner ?? "—"}</td>
                  <td className="py-2 pr-3">{formatDate(r.startDate)}</td>
                  <td className="py-2 pr-3">{formatDate(r.endDate)}</td>
                  <td className="py-2 pr-3 text-right">{formatCurrency(r.budget)}</td>
                  <td className="py-2 pr-3 text-right">{formatCurrency(r.executed)}</td>
                  <td className="py-2 pr-3 text-right">{formatPercent(r.progress)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
