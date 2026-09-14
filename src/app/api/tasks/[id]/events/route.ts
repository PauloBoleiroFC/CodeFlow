import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/task-paths";

const noteSchema = z.object({
  content: z
    .string()
    .min(1, "Informe a observação")
    .max(20000, "Observação muito longa"),
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

  if (!stripHtml(parsed.data.content)) {
    return NextResponse.json(
      { error: "Informe a observação" },
      { status: 400 },
    );
  }

  const session = await getSessionUser();
  const event = await prisma.taskEvent.create({
    data: {
      taskId: id,
      type: "note",
      newValue: parsed.data.content,
      userName:
        parsed.data.userName?.trim() ||
        session?.name ||
        "Usuário",
    },
  });

  const events = await prisma.taskEvent.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ event, events }, { status: 201 });
}
