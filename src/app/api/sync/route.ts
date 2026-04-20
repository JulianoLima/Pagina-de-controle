import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runSync, shouldResync } from "@/lib/sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (await shouldResync()) {
    const result = await runSync();
    return NextResponse.json(result);
  }

  const last = await prisma.syncLog.findFirst({
    where: { status: "success" },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({
    status: "cached",
    lastSyncAt: last?.startedAt,
    rowsUpsert: last?.rowsUpsert ?? 0,
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await runSync();
  return NextResponse.json(result);
}
