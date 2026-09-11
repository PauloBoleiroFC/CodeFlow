import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome")
      .max(120, "Nome muito longo"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A confirmação não confere com a senha",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta com este e-mail" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: hashPassword(parsed.data.password),
      role: "user",
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const token = await createSessionToken(user);
  const response = NextResponse.json(user, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
