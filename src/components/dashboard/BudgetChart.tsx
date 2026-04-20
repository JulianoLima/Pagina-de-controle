"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectRow } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function BudgetChart({ rows }: { rows: ProjectRow[] }) {
  const byOwner = rows.reduce<Record<string, { budget: number; executed: number }>>(
    (acc, r) => {
      const key = r.owner ?? "Sem responsável";
      if (!acc[key]) acc[key] = { budget: 0, executed: 0 };
      acc[key].budget += r.budget ?? 0;
      acc[key].executed += r.executed ?? 0;
      return acc;
    },
    {}
  );

  const data = Object.entries(byOwner)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Orçamento vs. Executado por responsável</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem dados para exibir.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  }).format(v)
                }
              />
              <Legend />
              <Bar dataKey="budget" name="Orçamento" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="executed" name="Executado" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
