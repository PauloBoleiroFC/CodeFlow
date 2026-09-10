import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const noteSchema = z.object({
  content: z.string().trim().min(1, "Informe a observação").max(5000),
  userName: z.string().optional(),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]/events">,
) {
  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  const parsed = noteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const event = await prisma.taskEvent.create({
    data: {
      taskId: id,
      type: "note",
      newValue: parsed.data.content.trim(),
      userName: parsed.data.userName ?? "Usuário",
    },
  });

  const events = await prisma.taskEvent.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ event, events }, { status: 201 });
}
