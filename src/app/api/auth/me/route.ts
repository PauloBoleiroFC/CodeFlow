import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  getSessionUser,
  hashPassword,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome")
      .max(120, "Nome muito longo"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const wantsPassword =
      Boolean(data.currentPassword) ||
      Boolean(data.newPassword) ||
      Boolean(data.confirmPassword);

    if (!wantsPassword) return;

    if (!data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Informe a senha atual",
      });
    }
    if (!data.newPassword || data.newPassword.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "A nova senha deve ter pelo menos 6 caracteres",
      });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "A confirmação não confere com a nova senha",
      });
    }
  });

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
  if (!dbUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { name, currentPassword, newPassword } = parsed.data;
  const data: { name: string; passwordHash?: string } = { name };

  if (currentPassword && newPassword) {
    if (!verifyPassword(currentPassword, dbUser.passwordHash)) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 },
      );
    }
    data.passwordHash = hashPassword(newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: dbUser.id },
    data,
    select: { id: true, name: true, email: true, role: true },
  });

  const token = await createSessionToken(updated);
  const response = NextResponse.json(updated);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
