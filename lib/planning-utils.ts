// src/lib/planning-utils.ts
import type { FbPlanningItem, FbPrestationType, SalesRequest, SeminairePlanningItem } from "@/data/types";

export const PRESTATION_ORDER: Record<FbPrestationType, number> = {
  cafe_accueil: 1,
  pause_matin: 2,
  dejeuner: 3,
  pause_apres_midi: 4,
  diner: 5,
  cocktail: 6,
};

export const PRESTATION_LABELS: Record<FbPrestationType, string> = {
  cafe_accueil: "Café d'accueil",
  pause_matin: "Pause café matin",
  dejeuner: "Déjeuner",
  pause_apres_midi: "Pause café après-midi",
  diner: "Dîner",
  cocktail: "Cocktail",
};

/** Détecte si le séminaire est refusé / indisponible dans l'hôtel demandé */
export function isSeminaireUnavailable(r?: SalesRequest | null): boolean {
  if (!r) return false;
  const dispo = r.seminaire_disponible?.toLowerCase()?.trim();
  if (dispo === "non" || dispo === "false") return true;
  const statut = r.seminaire_statut?.toLowerCase()?.trim();
  if (statut === "refuse" || statut === "non_disponible" || statut === "indisponible") return true;
  if (r.alternatives_seminaire && dispo !== "oui") return true;
  return false;
}

/** Détecte si le Revenue Management a refusé la demande */
export function isRmRefused(r?: SalesRequest | null): boolean {
  if (!r?.reponse_rm) return false;
  const txt = r.reponse_rm.toLowerCase();
  if (txt.includes("attente")) return false;
  return (
    txt.includes("refus") ||
    txt.includes("non") ||
    txt.includes("impossible") ||
    txt.includes("pas disponible") ||
    txt.includes("complet") ||
    txt.includes("rejet")
  );
}

/** Détecte si l'hébergement est indisponible dans l'hôtel demandé */
export function isLodgingUnavailable(r?: SalesRequest | null): boolean {
  if (!r) return false;
  const statut = r.statut_hebergement?.toLowerCase()?.trim();
  if (statut === "non_disponible" || statut === "indisponible" || statut === "refuse" || statut === "complet") {
    return true;
  }
  if (r.chambres_disponibles === 0) return true;
  if (r.alternatives_hebergement && (!statut || statut !== "disponible")) return true;
  return false;
}

/** Extrait le résumé textuel des alternatives JSON si le champ raison est vide */
export function extractAlternativeSummary(jsonString?: string): string | undefined {
  if (!jsonString) return undefined;
  try {
    const data = JSON.parse(jsonString);
    if (typeof data?.resume === "string" && data.resume.trim()) return data.resume.trim();
    if (typeof data?.motif === "string" && data.motif.trim()) return data.motif.trim();
  } catch {
    /* texte brut */
  }
  return undefined;
}

export function buildInitialSeminairePlanning(r?: SalesRequest | null): SeminairePlanningItem[] {
  if (!r) return [];

  // Si le séminaire est indisponible dans l'hôtel demandé, ne pas proposer de salle ni de prix
  if (isSeminaireUnavailable(r)) {
    return [];
  }

  // 1. Priorité à seminaire_jours
  if (r.seminaire_jours && r.seminaire_jours.length > 0) {
    return r.seminaire_jours;
  }

  if (r.seminaire_planning && r.seminaire_planning.length > 0) {
    return r.seminaire_planning;
  }

  // 2. Rétrocompatibilité si seminaire_jours est vide ou null (anciennes demandes)
  const hasSeminaire =
    r.seminaire_demande === "Oui" ||
    r.seminaire_demande === "oui" ||
    r.seminaire_salle_proposee ||
    r.seminaire_salle_demandee ||
    r.seminaire_date ||
    r.seminaire_salle_prix;

  if (hasSeminaire) {
    const duree: "journee" | "demi_journee" =
      r.seminaire_salle_unite && r.seminaire_salle_unite.toLowerCase().includes("demi")
        ? "demi_journee"
        : "journee";

    return [
      {
        date: r.seminaire_date ?? "",
        salle: r.seminaire_salle_proposee ?? r.seminaire_salle_demandee ?? "Salle plénière",
        disposition: r.seminaire_disposition ?? "En U",
        duree,
        prix: Number(r.seminaire_salle_prix ?? 0),
      },
    ];
  }

  return [];
}

export function buildInitialFbPlanning(r?: SalesRequest | null): FbPlanningItem[] {
  if (!r) return [];
  if (r.fb_planning && r.fb_planning.length > 0) {
    return r.fb_planning;
  }

  const items: FbPlanningItem[] = [];
  const basePax = r.pax ?? r.fb_pax ?? 0;

  if (r.cafe_d_accueil_prix && r.cafe_d_accueil_prix > 0) {
    items.push({
      date: "",
      prestation: "cafe_accueil",
      libelle: PRESTATION_LABELS.cafe_accueil,
      pax: basePax,
      prix_unitaire: r.cafe_d_accueil_prix,
      total: basePax * r.cafe_d_accueil_prix,
    });
  }

  if (r.pause_matin_prix && r.pause_matin_prix > 0) {
    items.push({
      date: "",
      prestation: "pause_matin",
      libelle: PRESTATION_LABELS.pause_matin,
      pax: basePax,
      prix_unitaire: r.pause_matin_prix,
      total: basePax * r.pause_matin_prix,
    });
  }

  const dejeunerPrix = r.fb_dejeuner_assis_prix ?? r.fb_dejeuner_prix;
  if (dejeunerPrix && dejeunerPrix > 0) {
    items.push({
      date: "",
      prestation: "dejeuner",
      libelle: r.fb_dejeuner_assis_prix ? "Déjeuner assis" : "Déjeuner",
      pax: basePax,
      prix_unitaire: dejeunerPrix,
      total: basePax * dejeunerPrix,
    });
  }

  if (r.pause_apres_midi_prix && r.pause_apres_midi_prix > 0) {
    items.push({
      date: "",
      prestation: "pause_apres_midi",
      libelle: PRESTATION_LABELS.pause_apres_midi,
      pax: basePax,
      prix_unitaire: r.pause_apres_midi_prix,
      total: basePax * r.pause_apres_midi_prix,
    });
  }

  const dinerPrix = r.fb_diner_assis_prix ?? r.fb_diner_prix;
  if (dinerPrix && dinerPrix > 0) {
    items.push({
      date: "",
      prestation: "diner",
      libelle: r.fb_diner_assis_prix ? "Dîner assis" : "Dîner",
      pax: basePax,
      prix_unitaire: dinerPrix,
      total: basePax * dinerPrix,
    });
  }

  if (r.fb_cocktail_prix && r.fb_cocktail_prix > 0) {
    items.push({
      date: "",
      prestation: "cocktail",
      libelle: PRESTATION_LABELS.cocktail,
      pax: basePax,
      prix_unitaire: r.fb_cocktail_prix,
      total: basePax * r.fb_cocktail_prix,
    });
  }

  return items;
}
