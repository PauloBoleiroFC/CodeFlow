"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#2563eb",
  "#60a5fa",
  "#1d4ed8",
  "#93c5fd",
  "#3b82f6",
  "#1e40af",
  "#bfdbfe",
  "#64748b",
  "#0ea5e9",
];

type ChartEmptyProps = { message: string };

function ChartEmpty({ message }: ChartEmptyProps) {
  return (
    <div
      style={{
        height: 220,
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
        fontSize: "0.9rem",
      }}
    >
      {message}
    </div>
  );
}

export function BranchTypeChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  if (data.length === 0) {
    return <ChartEmpty message="Nenhuma tarefa para exibir." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={COLORS[index % COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProjectBarChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  if (data.length === 0) {
    return <ChartEmpty message="Nenhum projeto com tarefas." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" name="Tarefas" radius={[8, 8, 0, 0]} fill="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EvolutionLineChart({
  data,
}: {
  data: Array<{ labeled: string; created: number }>;
}) {
  const hasData = data.some((d) => d.created > 0);
  if (!hasData) {
    return (
      <ChartEmpty message="Sem criações nos últimos 30 dias para montar a evolução." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="labeled" tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="created"
          name="Criadas"
          stroke="#1d4ed8"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeekdayBarChart({
  data,
}: {
  data: Array<{ day: string; count: number }>;
}) {
  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return <ChartEmpty message="Sem atividade recente suficiente." />;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" name="Atividade" radius={[6, 6, 0, 0]} fill="#60a5fa" />
      </BarChart>
    </ResponsiveContainer>
  );
}
