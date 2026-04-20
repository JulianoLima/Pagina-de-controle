export interface ProjectRow {
  id: string;
  externalKey: string;
  worksheet: string;
  rowIndex: number;
  projectName: string | null;
  status: string | null;
  owner: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  executed: number | null;
  progress: number | null;
  data: string;
  syncedAt: string;
  updatedAt: string;
}

export interface DataResponse {
  rows: ProjectRow[];
  lastSyncAt: string | null;
}

export interface DashboardFilters {
  status?: string;
  owner?: string;
  from?: string;
  to?: string;
}
