import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";

/**
 * Rota chamada automaticamente pelo Vercel Cron.
 * O Vercel inclui o header Authorization: Bearer <CRON_SECRET> quando
 * a variável CRON_SECRET está definida nas env vars do projeto.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runSync();
  return NextResponse.json(result);
}
