type Props = {
  rows?: number;
};

export function TableSkeleton({ rows = 5 }: Props) {
  return (
    <div className="table-wrap" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 44, margin: 8, borderRadius: 8 }}
        />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="stats-grid" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 110 }} />
      ))}
    </div>
  );
}
