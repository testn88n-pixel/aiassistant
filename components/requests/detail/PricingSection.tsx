import {AlertCircle, Check, Edit2, Mail, Save, BedDouble, CalendarDays, Clock, FileEdit, Info, Loader2, TrendingUp } from "lucide-react";
import { useState } from "react";

import { FieldList } from "@/components/requests/FieldList";
import { Badge } from "@/components/ui/badge";
import { CLOSED_STATUSES, type NightPrice, type SalesRequest } from "@/data/types";
import { formatDate, formatNumber, hasValue } from "@/lib/format";
import {
  extractAlternativeSummary,
  isLodgingUnavailable,
  isRmRefused,
} from "@/lib/planning-utils";

import { SectionTitle } from "./SectionTitle";

interface PricingSectionProps {
  request: SalesRequest;
  nightPrices?: NightPrice[];
  onNightPriceChange?: (index: number, val: number | undefined) => void;
  onSavePrices?: () => void;
  isSavingPrices?: boolean;
}

export function PricingSection({
  request: r,
  nightPrices = [],
  onNightPriceChange,
  onSavePrices,
  isSavingPrices = false,
}: PricingSectionProps) {
  const isClosed = CLOSED_STATUSES.includes(r.statut);
  const rmRequired = r.rm_requis === "Oui" || r.rm_requis === "oui";
  const rmPending = rmRequired && !hasValue(r.reponse_rm);
  const rmRefused = isRmRefused(r);
  const lodgingUnavailable = isLodgingUnavailable(r);
  const isHebergementRefused = rmRefused || lodgingUnavailable;

  // Calcul du tarif moyen par nuit (masqué si refusé)
  const currencySymbol = !r.devise || r.devise === "EUR" ? "€" : r.devise;
  const validPrices = nightPrices.map((n) => n.prix_bb).filter((p): p is number => typeof p === "number");
  const avgNightPrice =
    !isHebergementRefused && validPrices.length > 0
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : !isHebergementRefused
      ? r.tarif_recommande
      : undefined;

  // Somme des prix de chaque nuit × chambres (0 si refusé)
  const totalRooms = r.chambres ?? 1;
  const sumNightPrices = nightPrices.reduce((sum, n) => sum + (n.prix_bb ?? 0), 0);
  const accommodationTotal = isHebergementRefused ? 0 : sumNightPrices * totalRooms;


  const lodging = [
    {
      label: "Dates",
      value:
        r.date_debut && r.date_fin
          ? `${formatDate(r.date_debut)} → ${formatDate(r.date_fin)}`
          : formatDate(r.date_debut) || formatDate(r.date_fin),
    },
    { label: "Nuits demandées", value: r.nombre_nuits },
    { label: "Chambres", value: r.chambres },
    { label: "Catégorie", value: r.categorie },
    { label: "Type de chambre", value: r.type_chambre },
    {
      label: "Disponibilité",
      value: r.chambres_disponibles !== undefined ? `${r.chambres_disponibles} chambres` : undefined,
    },
  ];

  return (
    <section className="space-y-4">
      <SectionTitle
        title="Hébergement & Revenue Management"
        description="Faisabilité hébergement, tarifs par nuitée et validation RM"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* HÉBERGEMENT (2/3) */}
        <div className="surface-card flex flex-col p-5 lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2">
            <BedDouble className="size-4 text-brass" />
            <h3 className="text-sm font-semibold text-foreground">Hébergement</h3>
          </div>

           {/* Encart jaune d'explication */}
          {(hasValue(r.raison_hebergement) || (isHebergementRefused && hasValue(r.alternatives_hebergement))) && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <p className="font-medium whitespace-pre-wrap">
                {r.raison_hebergement ?? extractAlternativeSummary(r.alternatives_hebergement)}
              </p>
            </div>
          )}


          {/* Récapitulatif hébergement */}
          <FieldList fields={lodging} columns={3} emptyMessage="Aucune information hébergement." />

          {/* Tarif moyen & Total hébergement estimé */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
            <div>
              <p className="eyebrow">Tarif chambre moyen</p>
              {isHebergementRefused ? (
                <p className="mt-1 text-sm font-medium text-destructive dark:text-red-400">
                  Non disponible dans cet hôtel
                </p>
              ) : avgNightPrice ? (
                <div className="flex items-baseline gap-2">
                  <p className="tabular mt-1 font-display text-2xl font-semibold text-foreground">
                    {avgNightPrice} {currencySymbol}
                  </p>
                  <span className="text-xs text-muted-foreground">/ chambre / nuit</span>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Aucun tarif pour le moment.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {accommodationTotal > 0 && (
                <div className="rounded-md bg-muted/50 px-3 py-1.5 text-right">
                  <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                    Total hébergement estimé
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(accommodationTotal)} {currencySymbol}
                  </span>
                </div>
              )}
              {hasValue(r.origine_tarif) && !isHebergementRefused && (
                <Badge variant="brass">
                  <TrendingUp className="size-3" />
                  {r.origine_tarif}
                </Badge>
              )}
              {!isClosed && onSavePrices && !isHebergementRefused && nightPrices.length > 0 && (
                <button
                  type="button"
                  onClick={onSavePrices}
                  disabled={isSavingPrices}
                  className="inline-flex items-center gap-1 rounded bg-brass/10 hover:bg-brass/20 text-brass border border-brass/30 px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSavingPrices ? "Enregistrement..." : "Enregistrer les prix"}
                </button>
              )}
            </div>
          </div>

          {/* Détail nuit par nuit (JJ/MM/AAAA) */}
          {nightPrices.length > 0 && !isHebergementRefused && (
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="size-4 text-brass" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tarif par nuitée ({nightPrices.length} nuit{nightPrices.length > 1 ? "s" : ""})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {nightPrices.map((night, idx) => (
                  <div
                    key={night.date || idx}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-2.5 shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {formatDate(night.date) || `Nuit ${idx + 1}`}
                      </p>
                      <span className="text-[11px] text-muted-foreground">Chambre BB</span>
                    </div>

                    {!isClosed && onNightPriceChange ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1"
                          value={night.prix_bb ?? ""}
                          onChange={(e) =>
                            onNightPriceChange(
                              idx,
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                          }
                          placeholder="0"
                          className="w-20 rounded border border-border bg-background px-2 py-1 text-right text-xs font-semibold text-foreground shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                        />
                        <span className="text-xs text-muted-foreground">{currencySymbol}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-foreground">
                        {night.prix_bb ?? "—"} {r.devise ?? "€"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* REVENUE MANAGEMENT (1/3) */}        <div className="surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Revenue Management</h3>
            {rmRefused ? (
              <Badge variant="destructive">RM refusé</Badge>
            ) : hasValue(r.rm_requis) ? (
              <Badge variant={rmRequired ? "brass" : "neutral"}>
                RM {rmRequired ? "requis" : "non requis"}
              </Badge>
            ) : null}
          </div>

          {rmPending && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-brass-soft px-3 py-2.5 text-sm text-brass">
              <Clock className="mt-0.5 size-4 shrink-0" />
              <span>En attente de la réponse du Revenue Manager.</span>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <FieldList
              columns={1}
              fields={[
                { label: "Demande envoyée au RM", value: r.demande_rm },
                {
                  label: "Réponse du RM",
                  value: hasValue(r.reponse_rm) ? (
                    <span className={`whitespace-pre-wrap ${rmRefused ? "text-destructive font-medium dark:text-red-400" : ""}`}>
                      {r.reponse_rm}
                    </span>
                  ) : undefined,
                },
              ]}
              emptyMessage={rmRequired ? undefined : "Aucune validation RM nécessaire pour cette demande."}
            />

            {hasValue(r.mettre_en_copie) && (
              <div className="flex items-start gap-2 rounded-md border border-border/70 bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/80" />
                <span className="leading-relaxed whitespace-pre-wrap">{r.mettre_en_copie}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
