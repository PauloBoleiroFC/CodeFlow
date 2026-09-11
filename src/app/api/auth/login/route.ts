import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json(
      { error: "E-mail ou senha inválidos" },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
