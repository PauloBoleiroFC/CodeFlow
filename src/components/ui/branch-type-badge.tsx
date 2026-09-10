type Props = {
  type: string;
  className?: string;
};

const COLORS: Record<string, string> = {
  feature: "badge",
  fix: "badge badge-danger",
  bugfix: "badge badge-danger",
  hotfix: "badge badge-warning",
  task: "badge badge-neutral",
  refactor: "badge badge-neutral",
  chore: "badge badge-neutral",
  docs: "badge",
  test: "badge badge-success",
};

export function BranchTypeBadge({ type, className }: Props) {
  const cls = COLORS[type] ?? "badge badge-neutral";
  return (
    <span className={`${cls}${className ? ` ${className}` : ""}`}>
      <span aria-hidden>●</span>
      {type}
    </span>
  );
}
