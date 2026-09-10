import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { prisma } from "./prisma";
import { createTaskRecord, syncProjectLinks } from "./task-service";
import { projectUpsertSchema } from "./project-validation";

describe("project module", () => {
  let projectId = "";
  let taskWithProject = "";
  let taskWithoutProject = "";

  before(async () => {
    const project = await prisma.project.create({
      data: {
        name: "Teste Projeto Links",
        slug: `teste-proj-${Date.now()}`,
        description: "<p>Desc</p>",
        observations: "<p>Obs</p>",
      },
    });
    projectId = project.id;
  });

  after(async () => {
    await prisma.task.deleteMany({
      where: {
        id: {
          in: [taskWithProject, taskWithoutProject].filter(Boolean),
        },
      },
    });
    if (projectId) {
      await prisma.project.deleteMany({ where: { id: projectId } });
    }
    await prisma.$disconnect();
  });

  it("validates project payload and urls", () => {
    const ok = projectUpsertSchema.safeParse({
      name: "Alpha",
      links: [{ name: "Site", url: "https://example.com" }],
    });
    assert.equal(ok.success, true);

    const bad = projectUpsertSchema.safeParse({
      name: "A",
      links: [{ name: "X", url: "not-a-url" }],
    });
    assert.equal(bad.success, false);
  });

  it("creates project with multiple links", async () => {
    await syncProjectLinks(projectId, [
      { name: "GitHub", url: "https://github.com/example" },
      { name: "Docs", url: "https://docs.example.com" },
    ]);
    const links = await prisma.projectLink.findMany({ where: { projectId } });
    assert.equal(links.length, 2);
  });

  it("edits and removes links without duplication", async () => {
    const existing = await prisma.projectLink.findMany({ where: { projectId } });
    await syncProjectLinks(projectId, [
      {
        id: existing[0].id,
        name: "GitHub atualizado",
        url: "https://github.com/example/updated",
      },
    ]);
    const links = await prisma.projectLink.findMany({ where: { projectId } });
    assert.equal(links.length, 1);
    assert.equal(links[0].name, "GitHub atualizado");
  });

  it("creates task with and without project", async () => {
    const linked = await createTaskRecord({
      projectId,
      title: "Tarefa vinculada",
      branchType: "task",
      slug: "tarefa-vinculada",
      branchName: "task/tarefa-vinculada",
    });
    taskWithProject = linked.id;
    assert.equal(linked.projectId, projectId);

    const free = await createTaskRecord({
      projectId: null,
      title: "Tarefa livre",
      branchType: "chore",
      slug: "tarefa-livre",
      branchName: "chore/tarefa-livre",
    });
    taskWithoutProject = free.id;
    assert.equal(free.projectId, null);
  });

  it("unlinks tasks when deleting project", async () => {
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { projectId },
        data: { projectId: null },
      }),
      prisma.project.delete({ where: { id: projectId } }),
    ]);
    projectId = "";

    const remaining = await prisma.task.findUnique({
      where: { id: taskWithProject },
    });
    assert.ok(remaining);
    assert.equal(remaining.projectId, null);
  });
});
