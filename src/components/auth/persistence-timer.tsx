export function PersistenceTimer() {
  return (
    <div className="fixed top-6 right-6 glass-panel subtle-border rounded-full px-4 py-2 flex items-center gap-2">
      <span className="material-symbols-outlined text-primary-brand text-sm">
        schedule
      </span>
      <time className="font-mono text-on-surface text-xs tracking-wider">
        00:42:15
      </time>
    </div>
  );
}
