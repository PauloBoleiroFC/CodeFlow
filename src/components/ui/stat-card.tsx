import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: number | string;
  footnote?: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, footnote, icon: Icon }: Props) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-icon" aria-hidden>
          <Icon size={15} />
        </span>
        {title}
      </div>
      <div className="stat-value">{value}</div>
      {footnote ? <div className="stat-foot">{footnote}</div> : null}
    </article>
  );
}
