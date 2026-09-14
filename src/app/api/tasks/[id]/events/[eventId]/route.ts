import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await ctx.params;

  const existing = await prisma.taskEvent.findFirst({
    where: { id: eventId, taskId: id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Item da timeline não encontrado" },
      { status: 404 },
    );
  }

  await prisma.taskEvent.delete({ where: { id: eventId } });

  const events = await prisma.taskEvent.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, deletedId: eventId, events });
}
