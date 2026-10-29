import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { FeasibilityStatus, RequestStatus } from "@/data/types";

const REQUEST_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  Nouvelle: "info",
  "Informations manquantes": "warning",
  "Infos manquantes": "warning",
  "Attente retour client": "info",
  "À confirmer": "warning",
  "Attente RM": "brass",
  "RM en attente": "brass",
  "En analyse": "neutral",
  "Prête à valider": "success",
  Acceptée: "success",
  Refusée: "danger",
};

export function StatusBadge({ status, className }: { status: RequestStatus | string; className?: string }) {
  const displayLabel = status === "Informations manquantes" ? "Infos manquantes" : status;

  return (
    <Badge variant={REQUEST_STATUS_VARIANT[displayLabel] ?? "neutral"} className={className}>
      {displayLabel}
    </Badge>
  );
}

const FEASIBILITY_VARIANT: Record<FeasibilityStatus, BadgeProps["variant"]> = {
  Disponible: "success",
  "Non disponible": "danger",
  "Informations manquantes": "warning",
  "À confirmer": "warning",
};

export function FeasibilityBadge({ status }: { status?: FeasibilityStatus | undefined }) {
  if (!status) return <Badge variant="neutral">Non évalué</Badge>;
  const displayLabel = status === "Informations manquantes" ? "Infos manquantes" : status;
  return <Badge variant={FEASIBILITY_VARIANT[status] ?? "neutral"}>{displayLabel}</Badge>;
}
