import {
  buildBranchName,
  generateSlug,
  suggestBranchType,
  validateAiAnalysis,
  type AiAnalysisResult,
  type BranchType,
  isBranchType,
} from "@/lib/branch";
import { stripHtml } from "@/lib/task-paths";
import { prisma } from "@/lib/prisma";

function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return [];
  }
}

export async function findBranchMemory(projectId: string, text: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { branchType: true, title: true, branchName: true },
  });

  if (tasks.length === 0) return null;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const isFixLike =
    /(corrigir|erro|bug|calculo|cálculo|falha)/.test(normalized);

  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.branchType, (counts.get(task.branchType) ?? 0) + 1);
  }

  if (isFixLike) {
    const fixCount =
      (counts.get("fix") ?? 0) + (counts.get("bugfix") ?? 0);
    if (fixCount >= 2) {
      return {
        type: "fix" as BranchType,
        message:
          "Este projeto utiliza frequentemente o prefixo fix/ para correções semelhantes.",
      };
    }
  }

  let topType: string | null = null;
  let topCount = 0;
  for (const [type, count] of counts) {
    if (count > topCount) {
      topType = type;
      topCount = count;
    }
  }

  if (topType && isBranchType(topType) && topCount >= 3) {
    return {
      type: topType,
      message: `Este projeto utiliza frequentemente o prefixo ${topType}/.`,
    };
  }

  return null;
}

export type ProjectContext = {
  name: string;
  description: string | null;
  observations: string | null;
  links: Array<{ name: string; url: string }>;
  relatedTasks: Array<{ title: string; branchName: string; branchType: string }>;
};

export async function loadProjectContext(
  projectId: string,
): Promise<ProjectContext | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      links: { orderBy: { createdAt: "asc" } },
      tasks: {
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: { title: true, branchName: true, branchType: true },
      },
    },
  });

  if (!project) return null;

  return {
    name: project.name,
    description: project.description,
    observations: project.observations,
    links: project.links.map((l) => ({ name: l.name, url: l.url })),
    relatedTasks: project.tasks,
  };
}

/**
 * Heuristic task analysis (AI substitute for local MVP).
 * Output is always validated before returning.
 * When projectId is set, project context enriches tags/summary hints.
 */
export async function analyzeTask(input: {
  text: string;
  projectId?: string | null;
  cardNumber?: string | null;
  userBranchType?: BranchType | null;
}): Promise<
  AiAnalysisResult & {
    memoryMessage?: string;
    projectContext?: ProjectContext | null;
  }
> {
  const text = input.text.trim();
  if (!text) {
    throw new Error("Informe o texto da tarefa para análise.");
  }

  const projectId = input.projectId?.trim() || null;

  const projectContext = projectId
    ? await loadProjectContext(projectId)
    : null;

  const settings = await prisma.appSettings.findUnique({
    where: { id: "global" },
  });

  // Formato único global — Project.branchFormat é legado e ignorado.
  const format = settings?.branchFormat ?? "{tipo}/{num-task}-{slug}";

  const memory = projectId ? await findBranchMemory(projectId, text) : null;

  const suggestion = suggestBranchType({
    text,
    userChoice: input.userBranchType ?? null,
    memoryHint: memory,
  });

  const title =
    text.length > 80 ? `${text.slice(0, 77).trim()}...` : text;

  // Summary stays the user text; context is attached separately for consumers
  let summary = text;
  if (projectContext) {
    const related = projectContext.relatedTasks
      .slice(0, 5)
      .map((t) => t.title)
      .join("; ");
    const desc = stripHtml(projectContext.description);
    const bits = [
      text,
      desc ? `Projeto ${projectContext.name}: ${desc}` : null,
      related ? `Tarefas relacionadas: ${related}` : null,
    ].filter(Boolean);
    summary = bits.join("\n\n");
  }

  const slug = generateSlug(title);
  const built = buildBranchName({
    type: suggestion.type,
    cardNumber: input.cardNumber,
    slugSource: title,
    slug,
    format,
  });

  const tagSource = [
    text,
    projectContext?.name ?? "",
    stripHtml(projectContext?.description),
  ].join(" ");

  const tags = Array.from(
    new Set(
      generateSlug(tagSource)
        .split("-")
        .filter((part) => part.length > 4)
        .slice(0, 5),
    ),
  );

  const raw = {
    title,
    summary,
    branchType: built.type,
    slug: built.slug,
    branchName: built.branchName,
    tags,
    branchTypeReason: suggestion.reason,
    memoryMessage: suggestion.memoryMessage ?? memory?.message,
  };

  const validated = validateAiAnalysis(raw, {
    cardNumber: input.cardNumber,
    format,
  });

  return {
    ...validated,
    projectContext,
  };
}

export function tagsToJson(tags: string[]): string {
  return JSON.stringify(tags);
}

export function tagsFromJson(tagsJson: string): string[] {
  return parseTags(tagsJson);
}
