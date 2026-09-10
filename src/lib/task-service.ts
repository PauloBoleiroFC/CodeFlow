import {
  BRANCH_TYPES,
  buildBranchName,
  sanitizeBranchName,
  validateBranchName,
} from "@/lib/branch";
import { tagsToJson } from "@/lib/analyze-task";
import { prisma } from "@/lib/prisma";

export type CreateTaskInput = {
  projectId?: string | null;
  title: string;
  summary?: string;
  cardNumber?: string | null;
  branchType: (typeof BRANCH_TYPES)[number];
  suggestedBranchType?: (typeof BRANCH_TYPES)[number] | null;
  branchTypeReason?: string | null;
  slug: string;
  branchName: string;
  branchManual?: boolean;
  tags?: string[];
};

export async function resolveBranchFormat() {
  // Configuração única global — branchFormat por projeto foi descontinuado.
  const settings = await prisma.appSettings.findUnique({
    where: { id: "global" },
  });
  return settings?.branchFormat ?? "{tipo}/{num-task}-{slug}";
}

export async function createTaskRecord(input: CreateTaskInput) {
  const projectId = input.projectId?.trim() || null;

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error("Projeto não encontrado");
    }
  }

  const format = await resolveBranchFormat();
  let branchName = input.branchName;
  let slug = input.slug;
  let branchType = input.branchType;

  if (!input.branchManual) {
    const built = buildBranchName({
      type: input.branchType,
      cardNumber: input.cardNumber,
      slugSource: input.title,
      slug: input.slug,
      format,
    });
    branchName = built.branchName;
    slug = built.slug;
    branchType = built.type;
  } else {
    const validation = validateBranchName(input.branchName);
    if (!validation.ok) {
      throw new Error(validation.errors.join(" "));
    }
    branchName = sanitizeBranchName(validation.sanitized);
  }

  const tags = input.tags ?? [];

  return prisma.task.create({
    data: {
      projectId,
      title: input.title.trim(),
      summary: input.summary?.trim() || "",
      cardNumber: input.cardNumber?.trim() || null,
      status: "development",
      branchType,
      suggestedBranchType: input.suggestedBranchType ?? null,
      branchTypeReason: input.branchTypeReason ?? null,
      slug,
      branchName,
      branchManual: input.branchManual ?? false,
      tagsJson: tagsToJson(tags),
      events: {
        create: {
          type: "task_created",
          newValue: branchName,
          userName: "Usuário",
        },
      },
    },
    include: { project: true },
  });
}

export async function syncProjectLinks(
  projectId: string,
  links: Array<{ id?: string; name: string; url: string }>,
) {
  const existing = await prisma.projectLink.findMany({
    where: { projectId },
  });
  const incomingIds = new Set(
    links.map((l) => l.id).filter((id): id is string => Boolean(id)),
  );

  const toDelete = existing.filter((link) => !incomingIds.has(link.id));
  if (toDelete.length > 0) {
    await prisma.projectLink.deleteMany({
      where: { id: { in: toDelete.map((l) => l.id) } },
    });
  }

  for (const link of links) {
    if (link.id && existing.some((e) => e.id === link.id)) {
      await prisma.projectLink.update({
        where: { id: link.id },
        data: {
          name: link.name.trim(),
          url: link.url.trim(),
        },
      });
    } else {
      await prisma.projectLink.create({
        data: {
          projectId,
          name: link.name.trim(),
          url: link.url.trim(),
        },
      });
    }
  }
}
