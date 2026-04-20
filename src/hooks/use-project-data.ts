"use client";

import { useQuery } from "@tanstack/react-query";
import type { DataResponse, DashboardFilters } from "@/types";

async function fetchData(filters: DashboardFilters): Promise<DataResponse> {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.owner) qs.set("owner", filters.owner);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);

  const res = await fetch(`/api/data?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar dados");
  return res.json();
}

export function useProjectData(filters: DashboardFilters = {}) {
  const pollSec = Number(
    (typeof window !== "undefined" &&
      (window as unknown as { __POLL_SEC?: number }).__POLL_SEC) ||
      30
  );
  return useQuery({
    queryKey: ["project-data", filters],
    queryFn: () => fetchData(filters),
    refetchInterval: pollSec * 1000,
  });
}
