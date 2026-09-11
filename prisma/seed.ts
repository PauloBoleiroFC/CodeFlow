import "dotenv/config";
import {
  buildBranchName,
  DEFAULT_BRANCH_FORMAT,
  generateSlug,
} from "../src/lib/branch";
import { hashPassword } from "../src/lib/auth";
import { createPrismaClient } from "../src/lib/prisma";

const prisma = createPrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "CodeFlow@2026";
  await prisma.user.upsert({
    where: { email: "paulo@codeflow.local" },
    update: {
      name: "Paulo",
      role: "admin",
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      name: "Paulo",
      email: "paulo@codeflow.local",
      role: "admin",
      passwordHash: hashPassword(adminPassword),
    },
  });

  await prisma.appSettings.upsert({
    where: { id: "global" },
    update: { branchFormat: DEFAULT_BRANCH_FORMAT },
    create: {
      id: "global",
      branchFormat: DEFAULT_BRANCH_FORMAT,
      defaultBranchType: "task",
    },
  });

  const datatrade = await prisma.project.upsert({
    where: { slug: "datatrade" },
    update: {},
    create: {
      name: "DataTrade",
      slug: "datatrade",
      description: "Projeto DataTrade",
      branchFormat: DEFAULT_BRANCH_FORMAT,
    },
  });

  const primicia = await prisma.project.upsert({
    where: { slug: "primiciaflex" },
    update: {},
    create: {
      name: "PrimiciaFlex",
      slug: "primiciaflex",
      description: "Projeto PrimiciaFlex",
      branchFormat: DEFAULT_BRANCH_FORMAT,
    },
  });

  const samples = [
    {
      projectId: datatrade.id,
      title: "Adicionar coluna no relatório",
      cardNumber: "123",
      branchType: "task",
      text: "Adicionar coluna no relatório",
    },
    {
      projectId: datatrade.id,
      title: "Ajustar relatório de investimentos",
      cardNumber: "145",
      branchType: "task",
      text: "Ajustar relatório de investimentos",
    },
    {
      projectId: datatrade.id,
      title: "Corrigir cálculo do relatório",
      cardNumber: "167",
      branchType: "fix",
      text: "Corrigir cálculo do relatório",
    },
  ];

  for (const sample of samples) {
    const slug = generateSlug(sample.title);
    const built = buildBranchName({
      type: sample.branchType,
      cardNumber: sample.cardNumber,
      slugSource: sample.title,
      slug,
    });

    const existing = await prisma.task.findFirst({
      where: {
        projectId: sample.projectId,
        cardNumber: sample.cardNumber,
      },
    });

    if (existing) continue;

    await prisma.task.create({
      data: {
        projectId: sample.projectId,
        title: sample.title,
        summary: sample.text,
        cardNumber: sample.cardNumber,
        branchType: built.type,
        suggestedBranchType: built.type,
        branchTypeReason: `${built.type} — seed`,
        slug: built.slug,
        branchName: built.branchName,
        tagsJson: JSON.stringify(
          slug.split("-").filter((p) => p.length > 4).slice(0, 3),
        ),
        events: {
          create: {
            type: "task_created",
            newValue: built.branchName,
            userName: "Sistema",
          },
        },
      },
    });
  }

  console.log("Seed OK:", {
    projects: [datatrade.name, primicia.name],
    admin: "paulo@codeflow.local",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
