"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";
import { summarizeHtml } from "@/lib/task-paths";

type Article = {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string | null;
  tags: string[];
  updatedAt: string;
};

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${Math.max(mins, 1)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

function WikiPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const tagFilter = searchParams.get("tag")?.trim() || "all";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = (await fetch("/api/wiki").then((r) =>
          r.json(),
        )) as Article[];
        if (!cancelled) setArticles(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(
      articles.map((a) => a.category).filter((c): c is string => Boolean(c)),
    );
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [articles]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const article of articles) {
      for (const tag of article.tags) {
        const normalized = tag.trim();
        if (normalized) set.add(normalized);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      const tagsLower = article.tags.map((t) => t.toLowerCase());
      const haystack = [
        article.title,
        article.summary,
        article.category ?? "",
        ...article.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQ = !q || haystack.includes(q);
      const matchesCategory =
        category === "all" || article.category === category;
      const matchesTag =
        tagFilter === "all" ||
        tagsLower.includes(tagFilter.toLowerCase());
      return matchesQ && matchesCategory && matchesTag;
    });
  }, [articles, query, category, tagFilter]);

  function applyTagFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("tag");
    else params.set("tag", next);
    const qs = params.toString();
    router.replace(qs ? `/wiki?${qs}` : "/wiki");
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    applyTagFilter("all");
  }

  return (
    <div>
      <PageHeader
        title="Wiki"
        description="Seu conhecimento técnico organizado."
        actions={
          <ButtonLink href="/wiki/new" leftIcon={<Plus size={16} />}>
            Novo artigo
          </ButtonLink>
        }
      />

      <div className="toolbar">
        <div className="toolbar-search">
          <Search aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, conteúdo ou tag..."
            aria-label="Buscar na wiki"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar categoria"
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => applyTagFilter(e.target.value)}
          aria-label="Filtrar por tag"
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="all">Todas as tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            articles.length === 0
              ? "Nenhum artigo cadastrado"
              : "Nenhum artigo encontrado"
          }
          description={
            articles.length === 0
              ? "Crie o primeiro artigo da base de conhecimento."
              : "Tente outro termo ou limpe os filtros."
          }
          action={
            articles.length === 0 ? (
              <ButtonLink href="/wiki/new">+ Novo artigo</ButtonLink>
            ) : (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )
          }
        />
      ) : (
        <div className="project-grid">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/wiki/${article.id}`}
              className="project-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <p className="eyebrow">{article.category || "Geral"}</p>
              <h2 style={{ fontSize: "1.1rem" }}>{article.title}</h2>
              <p className="muted">
                {article.summary ||
                  summarizeHtml(article.content) ||
                  "Sem resumo"}
              </p>
              {article.tags.length > 0 ? (
                <div className="tags" style={{ marginTop: "0.65rem" }}>
                  {article.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={
                        tagFilter === tag ? "badge" : "badge badge-neutral"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applyTagFilter(tagFilter === tag ? "all" : tag);
                      }}
                      title={`Filtrar por ${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="hint" style={{ marginTop: "0.65rem" }}>
                  Sem tags
                </p>
              )}
              <p className="hint" style={{ marginTop: "0.75rem" }}>
                Atualizado {formatRelative(article.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WikiPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} />}>
      <WikiPageContent />
    </Suspense>
  );
}
