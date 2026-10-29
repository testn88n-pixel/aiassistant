// src/components/requests/detail/RequestHeader.tsx
import { Link } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  Building2, 
  CalendarDays, 
  Clock, 
  Copy, 
  Mail, 
  Phone, 
  User, 
  Users 
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/requests/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignations, useTeamUsers, useUpdateAssignation } from "@/data/assignations.queries";
import type { SalesRequest } from "@/data/types";
import { formatDate, formatDateTime, hasValue } from "@/lib/format";

function CopyButton({ text, label = "Copié" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié`);
      }}
      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors inline-flex items-center"
      title="Copier"
    >
      <Copy className="size-3" />
    </button>
  );
}

export function RequestHeader({ request }: { request: SalesRequest }) {
  const { data: assignations } = useAssignations();
  const { data: teamUsers = [] } = useTeamUsers();
  const updateMutation = useUpdateAssignation();
  const currentAssignation = assignations?.[request.id];

  const handleSelectUser = (selectedEmail: string) => {
    const member = teamUsers.find((u) => u.email === selectedEmail);
    if (!member) return;
    updateMutation.mutate({
      demande_id: request.id,
      user_name: member.name,
      user_email: member.email,
      user_id: member.id,
    });
  };

  const quoteLabel = request.numero_devis ?? request.nom_groupe;

  // Calcul synthétique de la période
  const hasDates = hasValue(request.date_debut) && hasValue(request.date_fin);
  const periodLabel = hasDates
    ? `${formatDate(request.date_debut)} au ${formatDate(request.date_fin)}${
        request.nombre_nuits ? ` (${request.nombre_nuits}n)` : ""
      }`
    : hasValue(request.seminaire_date)
    ? formatDate(request.seminaire_date)
    : "Dates à définir";

  // Calcul de proximité du séjour (moins d'un mois / 30 jours)
  const stayDateRaw = request.date_debut || request.seminaire_date;
  const daysUntilStay = (() => {
    if (!stayDateRaw) return null;
    const target = new Date(stayDateRaw);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    const dTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.round((dTarget - dToday) / (1000 * 60 * 60 * 24));
  })();
  const isStayClose = daysUntilStay !== null && daysUntilStay >= 0 && daysUntilStay <= 30;

  // Résumé Séminaire
  const seminaireParts: string[] = [];
  const salle = request.seminaire_salle_proposee || request.seminaire_salle_demandee;
  if (salle) seminaireParts.push(salle);
  if (request.seminaire_disposition) seminaireParts.push(request.seminaire_disposition);
  if (request.seminaire_jours && request.seminaire_jours.length > 0) {
    seminaireParts.push(`${request.seminaire_jours.length}j`);
  }
  const seminaireSummary = seminaireParts.length > 0 
    ? seminaireParts.join(" · ") 
    : (request.seminaire_demande === "Oui" || request.seminaire_pax ? "Séminaire demandé" : null);

  // Résumé Restauration (F&B)
  const fbParts: string[] = [];
  if (request.dejeuner_demande === "Oui") fbParts.push("Déjeuner");
  if (request.diner_demande === "Oui") fbParts.push("Dîner");
  if (request.pause_matin_demande === "Oui" || request.pause_apres_midi_demande === "Oui") fbParts.push("Pauses");
  if (request.cafe_d_accueil_detecte === "Oui") fbParts.push("Café d'accueil");
  if (fbParts.length === 0 && request.fb_planning && request.fb_planning.length > 0) {
    fbParts.push(`${request.fb_planning.length} prestation(s)`);
  }
  const fbSummary = fbParts.length > 0 ? fbParts.join(", ") : (request.fb_demande === "Oui" ? "Restauration demandée" : null);

  const paxCount = request.pax ?? request.seminaire_pax;


  return (
    <section className="surface-card p-6 space-y-4">
      {/* 1. Ligne supérieure : Navigation, Statut et Assignation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <Link
          to="/demandes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux demandes
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {request.urgent && (
            <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
              Urgent
            </span>
          )}
          <StatusBadge status={request.statut === "Nouvelle" && assignations?.[request.id] ? "Prête à valider" : request.statut} />

          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              En charge :
            </span>
            <Select
              value={currentAssignation?.user_email ?? ""}
              onValueChange={handleSelectUser}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="h-7 w-[140px] shrink-0 text-xs bg-background">
                <SelectValue placeholder="Non assignée" />
              </SelectTrigger>
                          <SelectContent>
                {teamUsers.map((u) => (
                  <SelectItem key={u.email} value={u.email} className="text-xs">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Titre et coordonnées principales */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {request.societe ?? quoteLabel ?? "Demande groupe"}
          </h1>
          {hasValue(request.nom_groupe) && request.nom_groupe !== request.societe && (
            <p className="text-sm text-muted-foreground">{request.nom_groupe}</p>
          )}

          {/* Badges contacts et devis */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {quoteLabel && (
              <span className="inline-flex items-center gap-1 font-medium bg-muted/60 px-2 py-0.5 rounded">
                Devis : {quoteLabel}
                <CopyButton text={quoteLabel} label="Numéro de devis" />
              </span>
            )}
            {hasValue(request.contact) && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" />
                {request.contact}
              </span>
            )}
            {hasValue(request.email) && (
              <span className="inline-flex items-center gap-1">
                <a href={`mailto:${request.email}`} className="text-primary hover:underline flex items-center gap-1">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {request.email}
                </a>
                <CopyButton text={request.email} label="E-mail" />
              </span>
            )}
          </div>
        </div>

        {hasValue(request.hotel) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start">
            <Building2 className="size-3.5" />
            {request.hotel}
          </div>
        )}
      </div>

      {/* 3. Bandeau synthétique : Les 4 indicateurs clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {/* 1. Dates du séjour */}
        <div className={`rounded-md border p-2.5 transition-colors ${
          isStayClose 
            ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20" 
            : "border-border/60 bg-muted/30"
        }`}>
          <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-primary" />
              Dates du séjour
            </span>
            {isStayClose && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                {daysUntilStay === 0 ? "Aujourd'hui" : `J-${daysUntilStay}`}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground truncate" title={periodLabel}>
            {periodLabel}
          </div>
        </div>

        {/* 2. Volume & Éléments (Hébergement, Séminaire, F&B) */}
        <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Users className="size-3.5 text-primary" />
            Volume & Prestations
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground truncate">
            {paxCount ? `${paxCount} pers.` : ""}{request.chambres ? ` · ${request.chambres} ch.` : ""}
            {!paxCount && !request.chambres && "Volume à définir"}
          </div>
          {(seminaireSummary || fbSummary) && (
            <div className="mt-0.5 text-[11px] text-muted-foreground truncate" title={`${seminaireSummary ?? ""} ${fbSummary ? `· ${fbSummary}` : ""}`}>
              {seminaireSummary && <span className="font-medium text-foreground/80">{seminaireSummary}</span>}
              {seminaireSummary && fbSummary && " · "}
              {fbSummary && <span>{fbSummary}</span>}
            </div>
          )}
        </div>

        {/* 3. Échéance réponse */}
        <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            Échéance réponse
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground truncate">
            {hasValue(request.deadline_reponse) ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {formatDate(request.deadline_reponse)}
              </span>
            ) : (
              <span className="text-muted-foreground font-normal">Non spécifiée</span>
            )}
          </div>
        </div>

        {/* 4. Réception & Alerte séjour */}
        <div className={`rounded-md border p-2.5 transition-colors ${
          isStayClose 
            ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20" 
            : "border-border/60 bg-muted/30"
        }`}>
          <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-primary" />
              Reçue le
            </span>
            {isStayClose && (
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                Moins d'un mois
              </span>
            )}
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground truncate">
            {hasValue(request.date_email) ? formatDateTime(request.date_email) : "—"}
          </div>
          {isStayClose && (
            <div className="mt-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">
              Séjour dans {daysUntilStay} jour{daysUntilStay! > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
