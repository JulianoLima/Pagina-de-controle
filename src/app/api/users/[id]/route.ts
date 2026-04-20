import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized", status: 401 as const };
  if (session.user.role !== "ADMIN") return { error: "Forbidden", status: 403 as const };
  return { session };
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "VIEWER"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: guard.session.user.id,
      action: "user.update",
      target: user.id,
      metadata: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if ("error" in guard)
    return NextResponse.json({ error: guard.error }, { status: guard.status });

  if (guard.session.user.id === params.id) {
    return NextResponse.json(
      { error: "Você não pode remover o próprio usuário" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      userId: guard.session.user.id,
      action: "user.delete",
      target: params.id,
    },
  });

  return NextResponse.json({ ok: true });
}
