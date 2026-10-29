import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Search, Send, X } from "lucide-react";
import { useMemo, useState } from "react";

import { PageContent, PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignations } from "@/data/assignations.queries";
import { byMostRecentEmail, requestsQueryOptions } from "@/data/requests.queries";
import type { RequestStatus, SalesRequest } from "@/data/types";

import { RequestsTable } from "./RequestsTable";

const ALL = "__all__";

/** Normalise toute date (ISO ou JJ/MM/AAAA) au format comparable "AAAA-MM-JJ" */
function toIsoDateOnly(value?: string | null): string | null {
  if (!value) return null;
  const str = String(value).trim();
  const frMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch && frMatch[1] && frMatch[2] && frMatch[3]) {
    const [, d, m, y] = frMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  return null;
}
function getQuickDateRanges() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Ce mois-ci
  const startCurrentMonth = `${y}-${pad(m + 1)}-01`;
  const endCurrentMonth = formatDate(new Date(y, m + 1, 0));

  // Mois prochain
  const startNextMonth = formatDate(new Date(y, m + 1, 1));
  const endNextMonth = formatDate(new Date(y, m + 2, 0));

  // 30 derniers jours
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startLast30 = formatDate(past30);
  const endToday = formatDate(now);

  return {
    thisMonth: { from: startCurrentMonth, to: endCurrentMonth },
    nextMonth: { from: startNextMonth, to: endNextMonth },
    last30: { from: startLast30, to: endToday },
  };
}

export function RequestsListPage({
  title,
  description,
  filter,
  statusOptions,
  emptyMessage,
  sort = byMostRecentEmail,
  enableDateFilters = false,
}: {
  title: string;
  description: string;
  filter: (r: SalesRequest) => boolean;
  /** When provided, a status filter is shown with these options. */
  statusOptions?: RequestStatus[];
  emptyMessage: string;
  sort?: (a: SalesRequest, b: SalesRequest) => number;
  /** Affiche les filtres par période de séjour et d'envoi de devis */
  enableDateFilters?: boolean;
}) {
  const { data: requests } = useSuspenseQuery(requestsQueryOptions);
  const { data: assignations } = useAssignations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
    const resetAllFilters = () => {
    setSearch("");
    setStatus(ALL);
    resetDateFilters();
  };


  // Filtres de dates
  const [sejourFrom, setSejourFrom] = useState("");
  const [sejourTo, setSejourTo] = useState("");
  const [envoiFrom, setEnvoiFrom] = useState("");
  const [envoiTo, setEnvoiTo] = useState("");
const activeFiltersCount = (search.trim() ? 1 : 0) +
  (status !== ALL ? 1 : 0) +
  (sejourFrom ? 1 : 0) + (sejourTo ? 1 : 0) +
  (envoiFrom ? 1 : 0) + (envoiTo ? 1 : 0);
  const hasActiveDateFilters = Boolean(sejourFrom || sejourTo || envoiFrom || envoiTo);

  const resetDateFilters = () => {
    setSejourFrom("");
    setSejourTo("");
    setEnvoiFrom("");
    setEnvoiTo("");
  };

  /** Statut effectif affiché : « Prête à valider » dès qu'un commercial est en charge (affichage uniquement). */
  const getEffectiveStatus = (r: SalesRequest) => {
    if (r.statut === "Nouvelle" && assignations?.[r.id]) return "Prête à valider";
    if (r.statut === "Informations manquantes") return "Infos manquantes";
    return r.statut;
  };


  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter(filter)
      .filter((r) => status === ALL || getEffectiveStatus(r) === status)
      .filter((r) => {
        if (!q) return true;
        return [r.id, r.societe, r.nom_groupe, r.contact, r.email, r.subject]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .filter((r) => {
        if (!enableDateFilters) return true;

        // 1. Filtre période de séjour
        const reqStart = toIsoDateOnly(r.date_debut) || toIsoDateOnly(r.seminaire_date);
        const reqEnd = toIsoDateOnly(r.date_fin) || reqStart;

        if (sejourFrom && reqEnd && reqEnd < sejourFrom) {
          return false;
        }
        if (sejourTo && reqStart && reqStart > sejourTo) {
          return false;
        }

        // 2. Filtre date d'envoi du devis (date_action ou date_traitement)
        const reqEnvoi = toIsoDateOnly(r.date_action) || toIsoDateOnly(r.date_traitement);

        if (envoiFrom && reqEnvoi && reqEnvoi < envoiFrom) {
          return false;
        }
        if (envoiTo && reqEnvoi && reqEnvoi > envoiTo) {
          return false;
        }

        return true;
      })
      .sort(sort);
  }, [
    requests,
    filter,
    status,
    search,
    sort,
    enableDateFilters,
    sejourFrom,
    sejourTo,
    envoiFrom,
    envoiTo,
    assignations,
    getEffectiveStatus,
  ]);

  const total = requests.filter(filter).length;

  return (
    <>
      <PageHeader title={title} description={description} />
      <PageContent className="space-y-4">
        {/* Barre principale : Recherche + Statuts + Badge Filtres + Compteur */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher société, contact, groupe…"
                className="w-72 bg-card pl-9 text-sm"
                aria-label="Rechercher une demande"
              />
            </div>

            {statusOptions && (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-56 bg-card" aria-label="Filtrer par statut">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les statuts</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Badge des filtres actifs avec option d'effacement en 1 clic */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                title="Cliquer pour effacer tous les filtres"
              >
                <span>{activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""} actif{activeFiltersCount > 1 ? "s" : ""}</span>
                <X className="size-3" />
              </button>
            )}
          </div>

          <p className="tabular text-sm text-muted-foreground">
            {visible.length === total
              ? `${total} demande${total > 1 ? "s" : ""}`
              : `${visible.length} sur ${total} demande${total > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Filtres de période (Séjour & Envoi devis) + Raccourcis 1 clic */}
        {enableDateFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-2.5">
            {/* Raccourcis rapides */}
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <span>Raccourcis séjour :</span>
              <button
                type="button"
                onClick={() => {
                  const q = getQuickDateRanges();
                  setSejourFrom(q.thisMonth.from);
                  setSejourTo(q.thisMonth.to);
                }}
                className="rounded px-2 py-0.5 hover:bg-muted hover:text-foreground text-[11px]"
              >
                Ce mois-ci
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = getQuickDateRanges();
                  setSejourFrom(q.nextMonth.from);
                  setSejourTo(q.nextMonth.to);
                }}
                className="rounded px-2 py-0.5 hover:bg-muted hover:text-foreground text-[11px]"
              >
                Mois prochain
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = getQuickDateRanges();
                  setEnvoiFrom(q.last30.from);
                  setEnvoiTo(q.last30.to);
                }}
                className="rounded px-2 py-0.5 hover:bg-muted hover:text-foreground text-[11px]"
              >
                Devis 30j
              </button>
            </div>

            <div className="hidden h-5 w-px bg-border sm:block" />

            {/* Période de séjour */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground font-medium">
                <Calendar className="size-3.5" />
                <span>Séjour :</span>
              </div>
              <input
                type="date"
                value={sejourFrom}
                onChange={(e) => setSejourFrom(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Séjour à partir du"
              />
              <span className="text-muted-foreground">au</span>
              <input
                type="date"
                value={sejourTo}
                onChange={(e) => setSejourTo(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Séjour jusqu'au"
              />
            </div>

            <div className="hidden h-5 w-px bg-border sm:block" />

            {/* Période d'envoi du devis */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground font-medium">
                <Send className="size-3.5" />
                <span>Envoi devis :</span>
              </div>
              <input
                type="date"
                value={envoiFrom}
                onChange={(e) => setEnvoiFrom(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Devis envoyé à partir du"
              />
              <span className="text-muted-foreground">au</span>
              <input
                type="date"
                value={envoiTo}
                onChange={(e) => setEnvoiTo(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Devis envoyé jusqu'au"
              />
            </div>

            {/* Bouton d'effacement */}
            {hasActiveDateFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDateFilters}
                className="ml-auto h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 size-3.5" />
                Réinitialiser dates
              </Button>
            )}
          </div>
        )}
        <RequestsTable requests={visible} emptyMessage={emptyMessage} />
      </PageContent>
    </>
  );
}
