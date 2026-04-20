"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useProjectData } from "@/hooks/use-project-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { DashboardFilters, ProjectRow } from "@/types";
import { generatePdfReport } from "@/lib/pdf";

type ColKey = keyof ProjectRow;

const AVAILABLE_COLUMNS: { key: ColKey; label: string }[] = [
  { key: "externalKey", label: "Código" },
  { key: "projectName", label: "Projeto" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Responsável" },
  { key: "startDate", label: "Início" },
  { key: "endDate", label: "Fim" },
  { key: "budget", label: "Orçamento" },
  { key: "executed", label: "Executado" },
  { key: "progress", label: "Progresso" },
];

const DEFAULT_SELECTED: ColKey[] = [
  "externalKey",
  "projectName",
  "status",
  "owner",
  "budget",
  "executed",
  "progress",
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [selectedCols, setSelectedCols] = useState<ColKey[]>(DEFAULT_SELECTED);
  const [title, setTitle] = useState("Relatório de projetos");
  const [includeSummary, setIncludeSummary] = useState(true);

  const { data, isLoading } = useProjectData(filters);
  const rows = data?.rows ?? [];

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.status).filter((v): v is string => !!v))).sort(),
    [rows]
  );
  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.owner).filter((v): v is string => !!v))).sort(),
    [rows]
  );

  function toggleCol(k: ColKey) {
    setSelectedCols((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  }

  function handleGenerate() {
    const cols = AVAILABLE_COLUMNS.filter((c) => selectedCols.includes(c.key));
    const filtersDesc = [
      filters.status && `Status: ${filters.status}`,
      filters.owner && `Responsável: ${filters.owner}`,
      filters.from && `A partir de ${filters.from}`,
      filters.to && `Até ${filters.to}`,
    ]
      .filter(Boolean)
      .join(" · ");

    generatePdfReport({
      title: title || "Relatório de projetos",
      subtitle: "Painel de Controle — Sebrae PR",
      columns: cols,
      rows,
      filtersDescription: filtersDesc || "Sem filtros aplicados",
      generatedBy: session?.user?.name ?? undefined,
      includeSummary,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Gere um PDF personalizado com base nos filtros e colunas escolhidas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine os dados antes de exportar.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                value={filters.status ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value || undefined })
                }
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Responsável</Label>
              <select
                value={filters.owner ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, owner: e.target.value || undefined })
                }
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {ownerOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Início a partir de</Label>
              <Input
                type="date"
                value={filters.from ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value || undefined })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fim até</Label>
              <Input
                type="date"
                value={filters.to ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, to: e.target.value || undefined })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração do PDF</CardTitle>
            <CardDescription>{rows.length} linhas disponíveis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-xs text-muted-foreground">
                Título
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Colunas</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {AVAILABLE_COLUMNS.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCols.includes(c.key)}
                      onChange={() => toggleCol(c.key)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
              />
              Incluir sumário de indicadores
            </label>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isLoading || rows.length === 0 || selectedCols.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
