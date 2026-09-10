import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="empty-state">
      {Icon ? (
        <Icon size={28} color="var(--muted)" aria-hidden />
      ) : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
