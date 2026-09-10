import { NextResponse } from "next/server";
import { DEFAULT_BRANCH_FORMAT } from "@/lib/branch";
import { prisma } from "@/lib/prisma";

/**
 * Settings é sempre global (AppSettings id=global).
 * Project.branchFormat permanece no schema por compatibilidade, mas é ignorado
 * por resolveBranchFormat / analyze / UI. Estratégia: AppSettings é a fonte única;
 * valores legados em Project.branchFormat não são apagados automaticamente.
 */
export async function GET() {
  const settings = await prisma.appSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      branchFormat: DEFAULT_BRANCH_FORMAT,
      defaultBranchType: "task",
    },
  });

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    branchFormat?: string;
    defaultBranchType?: string;
  };

  const settings = await prisma.appSettings.upsert({
    where: { id: "global" },
    update: {
      ...(body.branchFormat
        ? { branchFormat: body.branchFormat.trim() }
        : {}),
      ...(body.defaultBranchType
        ? { defaultBranchType: body.defaultBranchType }
        : {}),
    },
    create: {
      id: "global",
      branchFormat: body.branchFormat?.trim() || DEFAULT_BRANCH_FORMAT,
      defaultBranchType: body.defaultBranchType || "task",
    },
  });

  return NextResponse.json(settings);
}
