"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DashboardFilters } from "@/types";
import { RefreshCw, X } from "lucide-react";

interface FiltersProps {
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  statusOptions: string[];
  ownerOptions: string[];
  onRefresh: () => void;
  loading?: boolean;
}

export function Filters({
  filters,
  onChange,
  statusOptions,
  ownerOptions,
  onRefresh,
  loading,
}: FiltersProps) {
  const clear = () => onChange({});
  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value || undefined })
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
        <div className="flex-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Responsável</Label>
          <select
            value={filters.owner ?? ""}
            onChange={(e) =>
              onChange({ ...filters, owner: e.target.value || undefined })
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
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Início a partir de</Label>
          <Input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) =>
              onChange({ ...filters, from: e.target.value || undefined })
            }
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Fim até</Label>
          <Input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) =>
              onChange({ ...filters, to: e.target.value || undefined })
            }
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clear}>
            <X className="mr-2 h-4 w-4" /> Limpar
          </Button>
          <Button onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
