/**
 * Cliente Microsoft Graph para ler planilhas do SharePoint/OneDrive.
 *
 * Fluxo:
 *   1. Autentica via client_credentials (Azure AD app registration).
 *   2. Localiza o arquivo do OneDrive do usuário dono da planilha.
 *   3. Lê o intervalo usado (usedRange) da aba alvo.
 *
 * Requer env: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET,
 *             SHAREPOINT_USER_UPN, SHAREPOINT_FILE_PATH, SHAREPOINT_WORKSHEET.
 */

type GraphToken = { token: string; expiresAt: number };

let cachedToken: GraphToken | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const tenantId = requireEnv("AZURE_TENANT_ID");
  const clientId = requireEnv("AZURE_CLIENT_ID");
  const clientSecret = requireEnv("AZURE_CLIENT_SECRET");

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter token do Microsoft Graph: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return cachedToken.token;
}

async function graphFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Variável de ambiente ${key} ausente`);
  return v;
}

export interface WorksheetPayload {
  columns: string[];
  rows: Record<string, string | number | null>[];
}

export async function fetchWorksheet(): Promise<WorksheetPayload> {
  const userUpn = requireEnv("SHAREPOINT_USER_UPN");
  const filePath = requireEnv("SHAREPOINT_FILE_PATH");
  const worksheet = requireEnv("SHAREPOINT_WORKSHEET");

  const encodedPath = encodeURI(filePath);
  const driveItemPath = `/users/${encodeURIComponent(
    userUpn
  )}/drive/root:${encodedPath}`;

  const item = await graphFetch<{ id: string }>(driveItemPath);

  const range = await graphFetch<{ values: unknown[][] }>(
    `/users/${encodeURIComponent(userUpn)}/drive/items/${item.id}/workbook/worksheets('${encodeURIComponent(
      worksheet
    )}')/usedRange(valuesOnly=true)`
  );

  const values = range.values ?? [];
  if (values.length === 0) return { columns: [], rows: [] };

  const header = values[0].map((v) => String(v ?? "").trim());
  const rows = values.slice(1).map((row) => {
    const obj: Record<string, string | number | null> = {};
    header.forEach((col, idx) => {
      const raw = row[idx];
      if (raw === null || raw === undefined || raw === "") obj[col] = null;
      else if (typeof raw === "number") obj[col] = raw;
      else obj[col] = String(raw);
    });
    return obj;
  });

  return { columns: header, rows };
}
