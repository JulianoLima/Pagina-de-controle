import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runSync, shouldResync } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resync transparente se o polling indicou
  if (await shouldResync()) {
    await runSync();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const owner = searchParams.get("owner") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const rows = await prisma.projectRow.findMany({
    where: {
      status: status || undefined,
      owner: owner || undefined,
      startDate: from ? { gte: new Date(from) } : undefined,
      endDate: to ? { lte: new Date(to) } : undefined,
    },
    orderBy: { rowIndex: "asc" },
  });

  const last = await prisma.syncLog.findFirst({
    where: { status: "success" },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({
    rows,
    lastSyncAt: last?.startedAt ?? null,
  });
}
