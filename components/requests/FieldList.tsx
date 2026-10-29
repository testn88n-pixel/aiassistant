import type { ReactNode } from "react";

import { hasValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Field {
  label: string;
  value?: string | number | ReactNode | null;
}

/**
 * Definition list that silently skips fields without a value.
 * Never renders null / undefined / empty strings.
 */
export function FieldList({
  fields,
  columns = 2,
  className,
  emptyMessage,
}: {
  fields: Field[];
  columns?: 1 | 2 | 3;
  className?: string;
  emptyMessage?: string | undefined;
}) {
  const visible = fields.filter((f) => hasValue(f.value));

  if (visible.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    ) : null;
  }

  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {visible.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="eyebrow">{f.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground break-words">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Small titled group inside a card, hidden when it has nothing to show. */
export function FieldGroup({
  title,
  fields,
  columns = 2,
}: {
  title: string;
  fields: Field[];
  columns?: 1 | 2 | 3;
}) {
  if (!fields.some((f) => hasValue(f.value))) return null;
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <FieldList fields={fields} columns={columns} />
    </div>
  );
}
