"use client";

import { useMemo, useState } from "react";
import { useProjectData } from "@/hooks/use-project-data";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { BudgetChart } from "@/components/dashboard/BudgetChart";
import { ProjectsTable } from "@/components/dashboard/ProjectsTable";
import { Filters } from "@/components/dashboard/Filters";
import type { DashboardFilters } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, isLoading, refetch, isFetching } = useProjectData(filters);

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

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Última sincronização:{" "}
            {data?.lastSyncAt
              ? `${formatDate(data.lastSyncAt)} ${new Date(
                  data.lastSyncAt
                ).toLocaleTimeString("pt-BR")}`
              : "—"}
          </p>
        </div>
      </header>

      <Filters
        filters={filters}
        onChange={setFilters}
        statusOptions={statusOptions}
        ownerOptions={ownerOptions}
        onRefresh={() => refetch()}
        loading={isFetching || isLoading}
      />

      <KpiCards rows={rows} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusChart rows={rows} />
        <BudgetChart rows={rows} />
      </div>

      <ProjectsTable rows={rows} />
    </div>
  );
}
