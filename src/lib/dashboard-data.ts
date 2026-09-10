import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TASK_STATUS,
  isTaskStatus,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/task-status";

export type DashboardData = {
  userName: string;
  greeting: string;
  metrics: {
    total: number;
    features: number;
    fixes: number;
    tasks: number;
    docsTests: number;
    createdThisMonth: number;
  };
  byStatus: Array<{
    status: TaskStatus;
    label: string;
    value: number;
  }>;
  byBranchType: Array<{ name: string; value: number }>;
  byProject: Array<{ name: string; value: number }>;
  evolution: Array<{ date: string; created: number; labeled: string }>;
  weekdayActivity: Array<{ day: string; count: number }>;
  recentTasks: Array<{
    id: string;
    title: string;
    branchName: string;
    branchType: string;
    status: string;
    projectId: string | null;
    projectName: string;
    updatedAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    previousValue: string | null;
    newValue: string | null;
    userName: string;
    createdAt: string;
    taskTitle: string;
    projectId: string | null;
    taskId: string;
  }>;
  projectStats: {
    total: number;
    withTasks: number;
    withoutTasks: number;
  };
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    taskCount: number;
  }>;
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const FIX_TYPES = new Set(["fix", "bugfix", "hotfix"]);
const TASK_TYPES = new Set(["task", "chore", "refactor"]);
const DOCS_TYPES = new Set(["docs", "test"]);

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysBack = 30;
  const since = new Date(now);
  since.setDate(since.getDate() - (daysBack - 1));
  since.setHours(0, 0, 0, 0);

  const [projects, tasks, events] = await Promise.all([
    prisma.project.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.task.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.taskEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    }),
  ]);

  const typeCounts = new Map<string, number>();
  const statusCounts = new Map<TaskStatus, number>(
    TASK_STATUSES.map((status) => [status, 0]),
  );
  let features = 0;
  let fixes = 0;
  let taskish = 0;
  let docsTests = 0;
  let createdThisMonth = 0;

  for (const task of tasks) {
    typeCounts.set(task.branchType, (typeCounts.get(task.branchType) ?? 0) + 1);
    const status = isTaskStatus(task.status) ? task.status : DEFAULT_TASK_STATUS;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    if (task.branchType === "feature") features += 1;
    if (FIX_TYPES.has(task.branchType)) fixes += 1;
    if (TASK_TYPES.has(task.branchType)) taskish += 1;
    if (DOCS_TYPES.has(task.branchType)) docsTests += 1;
    if (task.createdAt >= monthStart) createdThisMonth += 1;
  }

  const byStatus = TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    value: statusCounts.get(status) ?? 0,
  }));

  const byBranchType = [...typeCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byProject = projects
    .map((p) => ({ name: p.name, value: p._count.tasks }))
    .sort((a, b) => b.value - a.value);

  const evolutionMap = new Map<string, number>();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    evolutionMap.set(key, 0);
  }
  for (const task of tasks) {
    if (task.createdAt < since) continue;
    const key = task.createdAt.toISOString().slice(0, 10);
    if (evolutionMap.has(key)) {
      evolutionMap.set(key, (evolutionMap.get(key) ?? 0) + 1);
    }
  }

  const evolution = [...evolutionMap.entries()].map(([date, created]) => ({
    date,
    created,
    labeled: date.slice(5).replace("-", "/"),
  }));

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  for (const task of tasks) {
    if (task.createdAt < since) continue;
    weekdayCounts[task.createdAt.getDay()] += 1;
  }
  // reorder to Mon-Sun for chart
  const order = [1, 2, 3, 4, 5, 6, 0];
  const weekdayActivity = order.map((idx) => ({
    day: weekdayLabels[idx],
    count: weekdayCounts[idx],
  }));

  return {
    userName: "Paulo",
    greeting: greetingForHour(now.getHours()),
    metrics: {
      total: tasks.length,
      features,
      fixes,
      tasks: taskish,
      docsTests,
      createdThisMonth,
    },
    byStatus,
    byBranchType,
    byProject,
    evolution,
    weekdayActivity,
    recentTasks: tasks.slice(0, 6).map((t) => ({
      id: t.id,
      title: t.title,
      branchName: t.branchName,
      branchType: t.branchType,
      status: t.status,
      projectId: t.project?.id ?? null,
      projectName: t.project?.name ?? "Sem projeto",
      updatedAt: t.updatedAt.toISOString(),
    })),
    recentEvents: events.map((e) => ({
      id: e.id,
      type: e.type,
      previousValue: e.previousValue,
      newValue: e.newValue,
      userName: e.userName,
      createdAt: e.createdAt.toISOString(),
      taskTitle: e.task.title,
      projectId: e.task.projectId,
      taskId: e.task.id,
    })),
    projectStats: {
      total: projects.length,
      withTasks: projects.filter((p) => p._count.tasks > 0).length,
      withoutTasks: projects.filter((p) => p._count.tasks === 0).length,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      taskCount: p._count.tasks,
    })),
  };
}
