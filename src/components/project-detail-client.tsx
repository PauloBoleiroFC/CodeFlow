"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardList, ExternalLink, Plus, Search } from "lucide-react";
import { CopyBranchButton } from "@/components/copy-branch-button";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

const PAGE_SIZE = 6;

export type ProjectDetailLink = {
  id: string;
  name: string;
  url: string;
};

export type ProjectDetailTask = {
  id: string;
  title: string;
  branchName: string;
  branchType: string;
  cardNumber: string | null;
  status: string;
  updatedAt: string;
};

export type ProjectDetailWiki = {
  id: string;
  title: string;
  summary: string;
  category: string | null;
  tags: string[];
  updatedAt: string;
};

type Props = {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    observations: string | null;
    links: ProjectDetailLink[];
    taskCount: number;
  };
  tasks: ProjectDetailTask[];
  wikis: ProjectDetailWiki[];
};

function matchesQuery(haystack: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

function usePagedSearch<T>(
  items: T[],
  query: string,
  filterFn: (item: T, query: string) => boolean,
) {
  const filtered = useMemo(
    () => items.filter((item) => filterFn(item, query)),
    [items, query, filterFn],
  );
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function onQueryChange(next: string) {
    setPage(1);
    return next;
  }

  return {
    filteredCount: filtered.length,
    totalPages,
    currentPage,
    pageItems,
    setPage,
    onQueryChange,
  };
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="list-pagination">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </Button>
      <span className="muted">
        {page} / {totalPages}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Próxima
      </Button>
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="toolbar-search panel-search">
      <Search aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );
}

export function ProjectDetailClient({ project, tasks, wikis }: Props) {
  const [taskQuery, setTaskQuery] = useState("");
  const [wikiQuery, setWikiQuery] = useState("");

  const taskFilter = useMemo(
    () => (task: ProjectDetailTask, query: string) =>
      matchesQuery(
        [task.title, task.branchName, task.cardNumber ?? "", task.branchType].join(
          " ",
        ),
        query,
      ),
    [],
  );

  const wikiFilter = useMemo(
    () => (wiki: ProjectDetailWiki, query: string) =>
      matchesQuery(
        [wiki.title, wiki.summary, wiki.category ?? "", ...wiki.tags].join(" "),
        query,
      ),
    [],
  );

  const taskPager = usePagedSearch(tasks, taskQuery, taskFilter);
  const wikiPager = usePagedSearch(wikis, wikiQuery, wikiFilter);

  return (
    <div className="stack">
      <PageHeader
        title={project.name}
        description={undefined}
        actions={
          <>
            <ButtonLink
              href={`/projects/${project.id}/tasks/new`}
              leftIcon={<Plus size={16} />}
            >
              Criar tarefa
            </ButtonLink>
            <ButtonLink
              href={`/wiki/new?projectId=${project.id}`}
              variant="secondary"
              leftIcon={<Plus size={16} />}
            >
              Novo artigo
            </ButtonLink>
            <ButtonLink
              variant="outline"
              href={`/projects/${project.id}/edit`}
            >
              Editar projeto
            </ButtonLink>
          </>
        }
      />
      <p className="eyebrow">{project.slug}</p>

      <div className="project-detail-split">
        <div className="project-detail-main stack">
          <section className="panel stack">
            <h2 className="section-title">Descrição</h2>
            {project.description ? (
              <div
                className="prose-html"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            ) : (
              <p className="muted">Sem descrição.</p>
            )}
          </section>

          <section className="panel stack">
            <h2 className="section-title">Observações</h2>
            {project.observations ? (
              <div
                className="prose-html"
                dangerouslySetInnerHTML={{ __html: project.observations }}
              />
            ) : (
              <p className="muted">Sem observações.</p>
            )}
          </section>

          <section className="panel stack">
            <h2 className="section-title">Links</h2>
            {project.links.length === 0 ? (
              <p className="muted">Nenhum link cadastrado.</p>
            ) : (
              <ul className="link-list">
                {project.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} aria-hidden />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel stack">
            <h2 className="section-title">Zona de risco</h2>
            <p className="muted">
              Excluir remove o projeto e os links. As {project.taskCount}{" "}
              tarefa(s) permanecem sem projeto.
            </p>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              taskCount={project.taskCount}
            />
          </section>
        </div>

        <div className="project-detail-aside stack">
          <section className="panel stack">
            <div className="page-hero-row">
              <h2 className="section-title">
                Tarefas relacionadas ({tasks.length})
              </h2>
              <ButtonLink
                href={`/projects/${project.id}/tasks/new`}
                size="sm"
                variant="ghost"
              >
                + Nova
              </ButtonLink>
            </div>

            <SearchField
              value={taskQuery}
              onChange={(value) => {
                taskPager.onQueryChange(value);
                setTaskQuery(value);
              }}
              placeholder="Buscar tarefas..."
              label="Buscar tarefas do projeto"
            />

            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nenhuma tarefa neste projeto"
                description="Crie a primeira tarefa para gerar branch e histórico."
                action={
                  <ButtonLink
                    href={`/projects/${project.id}/tasks/new`}
                    size="sm"
                  >
                    + Nova tarefa
                  </ButtonLink>
                }
              />
            ) : taskPager.filteredCount === 0 ? (
              <p className="muted">Nenhuma tarefa encontrada para a busca.</p>
            ) : (
              <>
                <ul className="task-list">
                  {taskPager.pageItems.map((task) => (
                    <li key={task.id} className="task-row">
                      <div>
                        <Link
                          href={`/projects/${project.id}/tasks/${task.id}`}
                        >
                          {task.title}
                        </Link>
                        <p className="branch-inline">
                          <BranchTypeBadge type={task.branchType} />
                          <code>{task.branchName}</code>
                        </p>
                      </div>
                      <div className="list-actions">
                        <CopyBranchButton
                          branchName={task.branchName}
                          compact
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={taskPager.currentPage}
                  totalPages={taskPager.totalPages}
                  onChange={taskPager.setPage}
                />
              </>
            )}
          </section>

          <section className="panel stack">
            <div className="page-hero-row">
              <h2 className="section-title">
                Wikis relacionadas ({wikis.length})
              </h2>
              <ButtonLink
                href={`/wiki/new?projectId=${project.id}`}
                size="sm"
                variant="ghost"
              >
                + Novo
              </ButtonLink>
            </div>

            <SearchField
              value={wikiQuery}
              onChange={(value) => {
                wikiPager.onQueryChange(value);
                setWikiQuery(value);
              }}
              placeholder="Buscar artigos..."
              label="Buscar wikis do projeto"
            />

            {wikis.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Nenhum artigo vinculado"
                description="Crie um artigo da wiki associado a este projeto."
                action={
                  <ButtonLink
                    href={`/wiki/new?projectId=${project.id}`}
                    size="sm"
                  >
                    + Novo artigo
                  </ButtonLink>
                }
              />
            ) : wikiPager.filteredCount === 0 ? (
              <p className="muted">Nenhum artigo encontrado para a busca.</p>
            ) : (
              <>
                <ul className="task-list">
                  {wikiPager.pageItems.map((wiki) => (
                    <li key={wiki.id} className="task-row">
                      <div>
                        <Link href={`/wiki/${wiki.id}`}>{wiki.title}</Link>
                        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                          {wiki.category || "Geral"}
                          {wiki.summary ? ` · ${wiki.summary}` : ""}
                        </p>
                        {wiki.tags.length > 0 ? (
                          <div className="tags" style={{ marginTop: "0.45rem" }}>
                            {wiki.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="badge badge-neutral">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="list-actions">
                        <ButtonLink
                          href={`/wiki/${wiki.id}`}
                          variant="ghost"
                          size="sm"
                        >
                          Ver
                        </ButtonLink>
                      </div>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={wikiPager.currentPage}
                  totalPages={wikiPager.totalPages}
                  onChange={wikiPager.setPage}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
