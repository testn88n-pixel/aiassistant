// src/components/requests/RequestsTable.tsx
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileCheck, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAssignations } from "@/data/assignations.queries";
import type { SalesRequest } from "@/data/types";
import { formatDate, formatDateRange, hasValue } from "@/lib/format";

import { StatusBadge } from "./StatusBadge";

function getDaysSinceAction(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const past = new Date(dateStr).getTime();
  const diffDays = Math.floor((Date.now() - past) / (1000 * 60 * 60 * 24));
  return isNaN(diffDays) ? null : diffDays;
}


function ServiceChips({ request }: { request: SalesRequest }) {
  const hasSeminaire = request.seminaire_demande?.toLowerCase() === "oui";
  const hasFb = request.fb_demande?.toLowerCase() === "oui";
  if (!hasSeminaire && !hasFb) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {hasSeminaire && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Séminaire
        </span>
      )}
      {hasFb && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          F&B
        </span>
      )}
    </div>
  );
}


function StayCell({ request }: { request: SalesRequest }) {
  const range = formatDateRange(request.date_debut, request.date_fin);
  const nights = hasValue(request.nombre_nuits)
    ? `${request.nombre_nuits} nuit${request.nombre_nuits > 1 ? "s" : ""}`
    : undefined;
  if (!range && !nights) return null;
  return (
    <div className="min-w-0">
      {range && <p className="text-sm text-foreground">{range}</p>}
      {nights && <p className="text-xs text-muted-foreground">{nights}</p>}
    </div>
  );
}

export function RequestsTable({
  requests,
  emptyMessage = "Aucune demande à afficher.",
}: {
  requests: SalesRequest[];
  emptyMessage?: string;
}) {
  const navigate = useNavigate();
  const { data: assignations } = useAssignations();

  if (requests.length === 0) {
    return (
      <div className="surface-card flex items-center justify-center px-6 py-16 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Société / Groupe</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Séjour</TableHead>
            <TableHead>Prestations</TableHead>
            <TableHead>En charge</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Reçue le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => {
            const assignation = assignations?.[r.id];
            return (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: "/demandes/$id", params: { id: r.id } })}
              >


<TableCell className="pl-5 align-top">
  <div className="flex flex-wrap items-center gap-2">
    <p className="font-semibold text-foreground">{r.societe ?? r.id}</p>
    {r.urgent === true && <Badge variant="destructive">Urgent</Badge>}
{hasValue(r.devis_lien) && (
  <span
    title={`Devis généré (version ${r.devis_version ?? 1})`}
    className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success border border-success/30"
  >
    <FileCheck className="size-3.5" />
    Devis v{r.devis_version ?? 1}
  </span>
)}

  </div>
  {hasValue(r.nom_groupe) && (
    <p className="text-xs text-muted-foreground">{r.nom_groupe}</p>
  )}
</TableCell>

                <TableCell className="align-top">
                  {hasValue(r.contact) && <p className="text-sm">{r.contact}</p>}
                  {hasValue(r.email) && (
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <StayCell request={r} />
                </TableCell>
                <TableCell className="align-top">
                  <ServiceChips request={r} />
                </TableCell>
                <TableCell className="align-top">
                  {assignation ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-foreground">
                      <User className="size-3 text-muted-foreground" />
                      {assignation.user_name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 italic">
                      Non assignée
                    </span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <StatusBadge status={r.statut === "Nouvelle" && assignations?.[r.id] ? "Prête à valider" : r.statut} />
                </TableCell>
<TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
  <div>{formatDate(r.date_email ?? r.date_action)}</div>
  {r.date_action && (
    <div className="mt-0.5 text-[10px] text-muted-foreground font-medium">
      {(() => {
        const days = getDaysSinceAction(r.date_action);
        if (days === null) return null;
        if (days === 0) return "Devis envoyé aujourd'hui";
        if (days >= 7) {
          return (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Devis envoyé il y a {days}j
            </span>
          );
        }
        return `Devis envoyé il y a ${days}j`;
      })()}
    </div>
  )}
</TableCell>

              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
