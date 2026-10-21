export function Skeleton({ className = '' }: Readonly<{ className?: string }>) {
  return <div aria-hidden="true" className={`animate-shimmer rounded-md bg-zinc-800/40 ${className}`} />;
}
