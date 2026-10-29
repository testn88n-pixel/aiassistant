import { Info, Presentation, UtensilsCrossed } from "lucide-react";
import { AdditionalInfoSection } from "./AdditionalInfoSection";

import {
  CLOSED_STATUSES,
  type FbPlanningItem,
  type SalesRequest,
  type SeminairePlanningItem,
} from "@/data/types";
import { formatDate, formatNumber } from "@/lib/format";
import {
  extractAlternativeSummary,
  isSeminaireUnavailable,
  PRESTATION_ORDER,
} from "@/lib/planning-utils";
import {
  checkSalleCapacity,
  DISPOSITIONS,
  getGrillePrice,
  getSallesForHotel,
  normalizeDisposition,
} from "@/config/seminaire";

import { SectionTitle } from "./SectionTitle";

function formatSummaryLines(summary: string): string[] {
  const lines: string[] = [];
  const rawLines = summary.split(/\r?\n/);
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // Si la ligne contient plusieurs tirets " - " sur la même ligne
    if (trimmed.includes(" - ")) {
      const parts = trimmed.split(/\s+-\s+/);
      for (const p of parts) {
        const clean = p.replace(/^[-•]\s*/, "").trim();
        if (clean) lines.push(clean);
      }
    } else {
      const clean = trimmed.replace(/^[-•]\s*/, "").trim();
      if (clean) lines.push(clean);
    }
  }
  return lines;
}

function CommercialCard({
  title,
  icon: Icon,
  summary,
  className,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary?: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`surface-card flex flex-col p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-brass" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      </div>

      {summary && summary.trim().length > 0 && (() => {
        const lines = formatSummaryLines(summary);
        const isList = summary.includes("-") || summary.includes("•") || lines.length > 1;

        return (
          <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            {isList ? (
              <ul className="space-y-1.5 font-medium list-disc list-inside">
                {lines.map((line, idx) => (
                  <li key={idx} className="leading-snug whitespace-pre-wrap">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-medium whitespace-pre-wrap">{summary}</p>
            )}
          </div>
        );
      })()}

      <div className="flex-1 space-y-4">{children}</div>
    </div>
  );
}


export function FeasibilitySection({
  request: r,
  seminairePlanning = [],
  fbPlanning = [],
  onSeminairePriceChange,
  onSeminaireItemChange,
  onFbItemChange,
  onSavePrices,
  isSavingPrices = false,
  onSaveFbPrices,
  isSavingFbPrices = false,
}: {
  request: SalesRequest;
  seminairePlanning?: SeminairePlanningItem[];
  fbPlanning?: FbPlanningItem[];
  onSeminairePriceChange?: (index: number, newPrice: number) => void;
  onSeminaireItemChange?: (
    index: number,
    updates: Partial<SeminairePlanningItem>
  ) => void;
  onFbItemChange?: (index: number, field: "pax" | "prix_unitaire", val: number) => void;
  totalHebergement?: number;
  onSavePrices?: () => void;
  isSavingPrices?: boolean;
  onSaveFbPrices?: () => void;
  isSavingFbPrices?: boolean;
}) {
  const isEditable = !CLOSED_STATUSES.includes(r.statut);
  const cur = !r.devise || r.devise === "EUR" ? "€" : r.devise;
  const participants = r.seminaire_pax ?? r.pax;

  // Récupération de l'hôtel et de ses salles
  const hotelCode =
    r.hotel_code ||
    (r.hotel?.toLowerCase().includes("défense") || r.hotel?.includes("2")
      ? "DEMO_PARIS_2"
      : "DEMO_PARIS");
  const sallesDisponibles = getSallesForHotel(hotelCode);

  // 1. Séminaire & pauses
  const isSemUnavailable = isSeminaireUnavailable(r);
  const semSummary = r.seminaire_raison || extractAlternativeSummary(r.alternatives_seminaire);

  const seminairePauses = fbPlanning
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) =>
      ["cafe_accueil", "pause_matin", "pause_apres_midi"].includes(item.prestation)
    );

  seminairePauses.sort((a, b) => {
    const orderA = PRESTATION_ORDER[a.item.prestation] ?? 99;
    const orderB = PRESTATION_ORDER[b.item.prestation] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.item.date ?? "").localeCompare(b.item.date ?? "");
  });

  // 2. Restauration
  const fbSummary = r.fb_raison;
  const restaurantItems = fbPlanning
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(
      ({ item }) =>
        !["cafe_accueil", "pause_matin", "pause_apres_midi"].includes(item.prestation)
    );

  const groupedFb: Record<string, typeof restaurantItems> = {};
  for (const entry of restaurantItems) {
    const d = entry.item.date || "Date à définir";
    if (!groupedFb[d]) groupedFb[d] = [];
    groupedFb[d]!.push(entry);
  }
  const sortedDayKeys = Object.keys(groupedFb).sort();
  for (const day of sortedDayKeys) {
    groupedFb[day]?.sort(
      (a, b) => (PRESTATION_ORDER[a.item.prestation] ?? 99) - (PRESTATION_ORDER[b.item.prestation] ?? 99)
    );
  }

  const hasSeminaireContent = seminairePlanning.length > 0 || seminairePauses.length > 0;
  const hasRestaurantContent = restaurantItems.length > 0;

  return (
    <section className="space-y-4">
      <SectionTitle
        title="Prestations événementielles"
        description="Séminaire, restauration et informations complémentaires"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
        {/* 1. SÉMINAIRE (4/10 = 40% de la largeur) */}
        {/* 1. SÉMINAIRE (4/10 = 40% de la largeur) */}
        <CommercialCard
          title="Séminaire"
          icon={Presentation}
          summary={semSummary}
          className="lg:col-span-4"
        >
          {!hasSeminaireContent ? (
            <p className="text-xs text-muted-foreground italic">
              {isSemUnavailable ? "Aucune salle disponible dans cet hôtel." : "Aucune demande de séminaire"}
            </p>
          ) : (
            <div className="space-y-4">
              {isEditable && onSavePrices && !isSemUnavailable && seminairePlanning.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onSavePrices}
                    disabled={isSavingPrices}
                    className="inline-flex items-center gap-1 rounded bg-brass/10 hover:bg-brass/20 text-brass border border-brass/30 px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSavingPrices ? "Enregistrement..." : "Enregistrer les prix"}
                  </button>
                </div>
              )}

              {/* Salles : affichées seulement si disponibles dans l'hôtel demandé */}
              {seminairePlanning.length > 0 && !isSemUnavailable && (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2 pr-2 font-medium">Date</th>
                          <th className="py-2 pr-2 font-medium">Salle</th>
                          <th className="py-2 pr-2 font-medium">Dispo.</th>
                          <th className="py-2 pr-2 font-medium">Durée</th>
                          <th className="py-2 text-right font-medium">Prix ({cur})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {seminairePlanning.map((row, originalIdx) => {
                          const check = checkSalleCapacity({
                            salleName: row.salle,
                            dispositionRaw: row.disposition,
                            participants,
                            hotelCode,
                          });

                          const grillePrice = getGrillePrice(row.salle, row.duree, hotelCode);
                          const canApplyGrillePrice =
                            isEditable &&
                            grillePrice !== null &&
                            grillePrice !== row.prix;

                          const currentNormDispo = normalizeDisposition(row.disposition);

                          return (
                            <tr
                              key={`${row.date}-${row.salle}-${originalIdx}`}
                              className="hover:bg-muted/30 align-top"
                            >
                              <td className="py-2.5 pr-2 font-medium text-foreground">
                                {formatDate(row.date)}
                              </td>

                              {/* Salle modifiable */}
                              <td className="py-2 pr-2">
                                {isEditable && onSeminaireItemChange ? (
                                  <select
                                    value={row.salle}
                                    onChange={(e) =>
                                      onSeminaireItemChange(originalIdx, {
                                        salle: e.target.value,
                                      })
                                    }
                                    className="rounded border border-border bg-background px-1.5 py-1 text-xs font-semibold text-foreground shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                                  >
                                    {sallesDisponibles.map((s) => (
                                      <option key={s.salle} value={s.salle}>
                                        {s.salle}
                                      </option>
                                    ))}
                                    {!sallesDisponibles.some((s) => s.salle === row.salle) && (
                                      <option value={row.salle}>{row.salle}</option>
                                    )}
                                  </select>
                                ) : (
                                  <span className="text-foreground font-semibold">
                                    {row.salle}
                                  </span>
                                )}
                              </td>

                              {/* Disposition modifiable */}
                              <td className="py-2 pr-2">
                                {isEditable && onSeminaireItemChange ? (
                                  <select
                                    value={currentNormDispo ?? row.disposition}
                                    onChange={(e) =>
                                      onSeminaireItemChange(originalIdx, {
                                        disposition: e.target.value,
                                      })
                                    }
                                    className="rounded border border-border bg-background px-1.5 py-1 text-xs text-foreground shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                                  >
                                    {DISPOSITIONS.map((d) => (
                                      <option key={d.key} value={d.key}>
                                        {d.label}
                                      </option>
                                    ))}
                                    {!DISPOSITIONS.some(
                                      (d) => d.key === currentNormDispo
                                    ) && (
                                      <option value={row.disposition}>
                                        {row.disposition}
                                      </option>
                                    )}
                                  </select>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {row.disposition}
                                  </span>
                                )}
                              </td>

                              {/* Durée */}
                              <td className="py-2.5 pr-2 text-muted-foreground">
                                {row.duree === "demi_journee"
                                  ? "Demi-journée"
                                  : "Journée"}
                              </td>

                              {/* Prix & Bouton grille */}
                              <td className="py-2 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  {isEditable && onSeminairePriceChange ? (
                                    <input
                                      type="number"
                                      step="1"
                                      value={row.prix ?? ""}
                                      onChange={(e) =>
                                        onSeminairePriceChange(
                                          originalIdx,
                                          e.target.value === ""
                                            ? 0
                                            : Number(e.target.value)
                                        )
                                      }
                                      className="w-20 rounded border border-border bg-background px-1.5 py-1 text-right text-xs font-semibold text-foreground shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                                    />
                                  ) : (
                                    <span className="font-semibold text-foreground">
                                      {formatNumber(row.prix)} {cur}
                                    </span>
                                  )}

                                  {canApplyGrillePrice && onSeminairePriceChange && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSeminairePriceChange(originalIdx, grillePrice)
                                      }
                                      className="text-[10px] text-brass hover:underline font-medium"
                                    >
                                      Appliquer grille ({grillePrice} {cur})
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pauses & cafés rattachés au Séminaire */}
              {seminairePauses.length > 0 && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cafés & pauses ({seminairePauses.length})
                  </p>
                  <div className="space-y-1.5">
                    {seminairePauses.map(({ item, originalIndex }) => (
                      <div
                        key={`${item.prestation}-${originalIndex}`}
                        className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">{item.libelle}</span>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-muted-foreground">
                            {item.pax} pax × {item.prix_unitaire} {cur}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatNumber(item.total)} {cur}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CommercialCard>

        {/* 2. RESTAURATION (3/10 = 30% de la largeur) */}
        <CommercialCard
          title="Restauration"
          icon={UtensilsCrossed}
          summary={fbSummary}
          className="lg:col-span-3"
        >
          {!hasRestaurantContent ? (
            <p className="text-sm text-muted-foreground">Aucune prestation de restauration</p>
          ) : (
            <div className="space-y-4">
              {isEditable && onSaveFbPrices && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onSaveFbPrices}
                    disabled={isSavingFbPrices}
                    className="inline-flex items-center gap-1 rounded bg-brass/10 hover:bg-brass/20 text-brass border border-brass/30 px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSavingFbPrices ? "Enregistrement..." : "Enregistrer les prix"}
                  </button>
                </div>
              )}
              {sortedDayKeys.map((dayKey) => {
                const entries = groupedFb[dayKey] ?? [];
                return (
                  <div key={dayKey} className="space-y-2">
                    <p className="text-xs font-semibold text-brass uppercase tracking-wider">
                      {dayKey === "Date à définir" ? dayKey : formatDate(dayKey)}
                    </p>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-1.5 pr-2 font-medium">Prestation</th>
                          <th className="py-1.5 pr-2 font-medium">Pax</th>
                          <th className="py-1.5 pr-2 text-right font-medium">P.U. ({cur})</th>
                          <th className="py-1.5 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {entries.map(({ item, originalIndex }) => (
                          <tr key={originalIndex} className="hover:bg-muted/20">
                            <td className="py-2 pr-2 font-medium text-foreground">{item.libelle}</td>
                            <td className="py-2 pr-2">
                              {isEditable && onFbItemChange ? (
                                <input
                                  type="number"
                                  step="1"
                                  value={item.pax ?? ""}
                                  onChange={(e) =>
                                    onFbItemChange(
                                      originalIndex,
                                      "pax",
                                      e.target.value === "" ? 0 : Number(e.target.value)
                                    )
                                  }
                                  className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-center text-xs font-semibold text-foreground shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                                />
                              ) : (
                                <span className="font-semibold text-foreground">{item.pax}</span>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-right">
                              {isEditable && onFbItemChange ? (
                                <input
                                  type="number"
                                  step="1"
                                  value={item.prix_unitaire ?? ""}
                                  onChange={(e) =>
                                    onFbItemChange(
                                      originalIndex,
                                      "prix_unitaire",
                                      e.target.value === "" ? 0 : Number(e.target.value)
                                    )
                                  }
                                  className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs font-semibold text-foreground shadow-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                                />
                              ) : (
                                <span className="font-semibold text-foreground">
                                  {formatNumber(item.prix_unitaire)} {cur}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right font-semibold text-foreground">
                              {formatNumber(item.total)} {cur}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </CommercialCard>

        {/* 3. INFOS SUPPLÉMENTAIRES (3/10 = 30% de la largeur) */}
        <CommercialCard
          title="Infos supplémentaires"
          icon={Info}
          className="lg:col-span-3"
        >
          <AdditionalInfoSection key={r.id} request={r} />
        </CommercialCard>

      </div>
    </section>
  );
}
