interface StatCardProps {
  icon: string;
  value: string;
  label: string;
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="glass-panel subtle-border rounded-lg px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary-brand text-xl">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-on-surface font-semibold text-lg">{value}</p>
        <p className="text-on-surface-variant text-xs">{label}</p>
      </div>
    </div>
  );
}
