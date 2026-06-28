export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-ink-soft font-body" role="status">
      <span className="h-5 w-5 rounded-full border-2 border-sakura border-t-ink animate-spin" />
      {label}
    </div>
  );
}
