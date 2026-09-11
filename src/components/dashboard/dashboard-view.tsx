import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  FolderKanban,
  Rocket,
} from "lucide-react";
import { EvolutionLineChart } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardData } from "@/lib/dashboard-data";
import {
  isTaskStatus,
  TASK_STATUS_LABELS,
  taskStatusBadgeClass,
  type TaskStatus,
} from "@/lib/task-status";

function statusCount(data: DashboardData, status: TaskStatus) {
  return data.byStatus.find((item) => item.status === status)?.value ?? 0;
}

function taskHref(task: DashboardData["recentTasks"][number]) {
  return task.projectId
    ? `/projects/${task.projectId}/tasks/${task.id}`
    : `/tasks/${task.id}`;
}

export function DashboardView({ data }: { data: DashboardData }) {
  const recentProjects = data.projects.slice(0, 6);

  return (
    <div>
      <section className="greeting">
        <h1>
          {data.greeting}, {data.userName}
        </h1>
        <p>Acompanhe o fluxo real das tarefas e projetos.</p>
      </section>

      <section className="stats-grid" aria-label="Indicadores">
        <StatCard
          title="Total de tarefas"
          value={data.metrics.total}
          footnote={
            data.metrics.createdThisMonth > 0
              ? `+${data.metrics.createdThisMonth} este mês`
              : "Nenhuma nova este mês"
          }
          icon={ClipboardList}
        />
        <StatCard
          title="Em desenvolvimento"
          value={statusCount(data, "development")}
          footnote={TASK_STATUS_LABELS.development}
          icon={Rocket}
        />
        <StatCard
          title="Em homologação"
          value={statusCount(data, "homologation")}
          footnote={TASK_STATUS_LABELS.homologation}
          icon={FlaskConical}
        />
        <StatCard
          title="Finalizadas"
          value={statusCount(data, "finished")}
          footnote={TASK_STATUS_LABELS.finished}
          icon={CheckCircle2}
        />
      </section>

      <section className="charts-row">
        <article className="panel chart-card">
          <h2>Evolução das tarefas</h2>
          <p className="chart-subtitle">Tarefas criadas nos últimos 30 dias</p>
          <EvolutionLineChart data={data.evolution} />
        </article>
        <article className="panel chart-card">
          <h2>Resumo por status</h2>
          <p className="chart-subtitle">Distribuição real do workflow</p>
          {data.metrics.total === 0 ? (
            <EmptyState
              title="Sem tarefas"
              description="Os contadores de status aparecem quando houver tarefas."
            />
          ) : (
            <div className="status-bars" role="list">
              {data.byStatus.map((item) => {
                const pct = Math.round((item.value / data.metrics.total) * 100);
                return (
                  <div
                    key={item.status}
                    className="status-bar-row"
                    role="listitem"
                  >
                    <span>{item.label}</span>
                    <div className="status-bar-track" aria-hidden>
                      <div
                        className="status-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="charts-row">
        <article className="panel chart-card">
          <div className="panel-header">
            <div>
              <h2>Projetos recentes</h2>
              <p className="chart-subtitle">Atualizados mais recentemente</p>
            </div>
            <Link href="/projects" className="muted">
              Ver todos
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              title="Nenhum projeto"
              description="Cadastre um projeto para começar."
            />
          ) : (
            <div className="dash-list">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="dash-list-item"
                >
                  <div className="dash-list-meta">
                    <strong>{project.name}</strong>
                    <span>
                      {project.taskCount}{" "}
                      {project.taskCount === 1 ? "tarefa" : "tarefas"}
                    </span>
                  </div>
                  <span className="dash-list-aside" aria-hidden>
                    <FolderKanban size={16} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="panel chart-card">
          <div className="panel-header">
            <div>
              <h2>Tarefas recentes</h2>
              <p className="chart-subtitle">Últimas atualizações</p>
            </div>
            <Link href="/tasks" className="muted">
              Ver todas
            </Link>
          </div>
          {data.recentTasks.length === 0 ? (
            <EmptyState
              title="Nenhuma tarefa"
              description="As tarefas recentes aparecem aqui."
            />
          ) : (
            <div className="dash-list">
              {data.recentTasks.map((task) => {
                const status = isTaskStatus(task.status)
                  ? task.status
                  : "development";
                return (
                  <Link
                    key={task.id}
                    href={taskHref(task)}
                    className="dash-list-item"
                  >
                    <div className="dash-list-meta">
                      <strong>{task.title}</strong>
                      <span>{task.projectName}</span>
                    </div>
                    <span className="dash-list-aside">
                      <span className={taskStatusBadgeClass(status)}>
                        {TASK_STATUS_LABELS[status]}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
