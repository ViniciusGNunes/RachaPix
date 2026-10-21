import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div
      className="w-full max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-6"
      role="status"
      aria-live="polite"
      aria-label="Carregando conteúdo"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-zinc-800 border-t-accent rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-400">Carregando...</p>
      </div>

      <div className="w-full max-w-md space-y-3 pt-2">
        <Skeleton className="h-7 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}
