"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectRow } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Briefcase, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function KpiCards({ rows }: { rows: ProjectRow[] }) {
  const total = rows.length;
  const budgetTotal = rows.reduce((a, r) => a + (r.budget ?? 0), 0);
  const executedTotal = rows.reduce((a, r) => a + (r.executed ?? 0), 0);
  const avgProgress = avg(
    rows.map((r) => r.progress ?? 0).filter((v) => !Number.isNaN(v))
  );
  const delayed = rows.filter((r) => r.status?.toLowerCase().includes("atras")).length;

  const kpis = [
    {
      label: "Projetos",
      value: total.toString(),
      icon: Briefcase,
      tone: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Orçamento total",
      value: formatCurrency(budgetTotal),
      icon: DollarSign,
      tone: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Executado",
      value: `${formatCurrency(executedTotal)} (${formatPercent(
        budgetTotal > 0 ? executedTotal / budgetTotal : 0
      )})`,
      icon: TrendingUp,
      tone: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Atrasados",
      value: `${delayed} (${formatPercent(total > 0 ? delayed / total : 0)})`,
      icon: AlertTriangle,
      tone: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <div className={`rounded-md p-2 ${k.bg} ${k.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{k.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Progresso médio: {formatPercent(avgProgress)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
