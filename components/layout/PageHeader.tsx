import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useRefreshRequests } from "@/data/requests.queries";
import { cn } from "@/lib/utils";

export function RefreshButton({ className }: { className?: string }) {
  const refresh = useRefreshRequests();
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => refresh.mutate()}
      disabled={refresh.isPending}
    >
      <RefreshCw className={cn(refresh.isPending && "animate-spin")} />
      Actualiser
    </Button>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions ?? <RefreshButton />}
        </div>
      </div>
      {children}
    </header>
  );
}

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-7xl px-6 py-8 lg:px-10", className)}>{children}</div>;
}
