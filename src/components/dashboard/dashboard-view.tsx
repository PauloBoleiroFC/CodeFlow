import {
  Bug,
  ClipboardList,
  FileCode2,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BranchTypeChart,
  EvolutionLineChart,
  ProjectBarChart,
} from "@/components/dashboard/charts";
import type { DashboardData } from "@/lib/dashboard-data";

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div>
      <section className="greeting">
        <h1>
          {data.greeting}, {data.userName}
        </h1>
        <p>Veja o andamento das suas tarefas e projetos.</p>
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
          title="Projetos"
          value={data.projectStats.total}
          footnote={`${data.projectStats.withTasks} com tarefas · ${data.projectStats.withoutTasks} vazios`}
          icon={FolderKanban}
        />
        <StatCard
          title="Features"
          value={data.metrics.features}
          footnote="Tipo feature/"
          icon={Sparkles}
        />
        <StatCard
          title="Correções"
          value={data.metrics.fixes}
          footnote="fix / bugfix / hotfix"
          icon={Bug}
        />
        <StatCard
          title="Tarefas técnicas"
          value={data.metrics.tasks}
          footnote="task / chore / refactor"
          icon={FileCode2}
        />
      </section>

      <section className="charts-row">
        <article className="panel chart-card">
          <h2>Tarefas por status</h2>
          <p className="chart-subtitle">Distribuição real do workflow</p>
          {data.metrics.total === 0 ? (
            <EmptyState
              title="Sem tarefas"
              description="Os contadores de status aparecem quando houver tarefas."
            />
          ) : (
            <div className="status-bars" role="list">
              {data.byStatus.map((item) => {
                const pct =
                  data.metrics.total > 0
                    ? Math.round((item.value / data.metrics.total) * 100)
                    : 0;
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
        <article className="panel chart-card">
          <h2>Tarefas por projeto</h2>
          <p className="chart-subtitle">Volume por projeto</p>
          <ProjectBarChart data={data.byProject} />
        </article>
      </section>

      <section className="charts-row">
        <article className="panel chart-card">
          <h2>Tarefas por tipo de branch</h2>
          <p className="chart-subtitle">
            Distribuição real das tarefas cadastradas
          </p>
          <BranchTypeChart data={data.byBranchType} />
        </article>
        <article className="panel chart-card">
          <h2>Evolução das tarefas</h2>
          <p className="chart-subtitle">Tarefas criadas nos últimos 30 dias</p>
          <EvolutionLineChart data={data.evolution} />
        </article>
      </section>
    </div>
  );
}
