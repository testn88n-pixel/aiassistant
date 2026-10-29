import { AlertTriangle } from "lucide-react";

import type { SalesRequest } from "@/data/types";
import { hasValue } from "@/lib/format";

export function AiInsightsSection({ request: r }: { request: SalesRequest }) {
  const missing = r.informations_manquantes ?? [];
  const isIncomplete = missing.length > 0 || hasValue(r.question_clarification);

  // Si tout est complet, ne rien afficher du tout
  if (!isIncomplete) return null;

  return (
    <section className="surface-card border-warning/40 bg-warning-soft/30 p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <AlertTriangle className="size-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Informations manquantes</h3>
      </div>

      {missing.length > 0 && (
        <ul className="space-y-1.5">
          {missing.map((m) => (
            <li key={m} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
              {m}
            </li>
          ))}
        </ul>
      )}

      {hasValue(r.question_clarification) && (
        <div className="mt-4 border-t border-warning/20 pt-3">
          <p className="eyebrow mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Question de clarification proposée
          </p>
          <p className="text-sm italic text-foreground">{r.question_clarification}</p>
        </div>
      )}
    </section>
  );
}
