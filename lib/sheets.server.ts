import type {   FbPlanningItem,
  NightPrice,
  QuoteLine,
  RequestStatus,
  SalesRequest,
  SeminairePlanningItem,
 } from "@/data/types";
import { REQUEST_STATUSES } from "@/data/types";

/** Raw row as returned by the Google Apps Script web app. */
type RawRow = Record<string, unknown>;

const NUMBER_FIELDS = new Set([
  'pax',
  'nombre_nuits',
  'chambres',
  'total_devis',
  'total_hebergement',
  'total_seminaire',
  'total_fb',
  'seminaire_pax',
  'seminaire_salle_prix',
  'cafe_d_accueil_prix',
  'pause_matin_prix',
  'pause_apres_midi_prix',
  'fb_cocktail_prix',
  'fb_dejeuner_prix',
  'fb_diner_prix',
  'fb_dejeuner_assis_prix',
  'fb_diner_assis_prix',
  'devis_version',
]);


const LIST_FIELDS = new Set(["champs_manquants", "informations_manquantes"]);

const toText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") {
    return undefined;
  }
  return text;
};

const toNumber = (value: unknown): number | undefined => {
  const text = toText(value);
  if (text === undefined) return undefined;
  const cleaned = text.replace(/\s/g, "").replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toList = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const items = value.map((v) => toText(v)).filter((v): v is string => Boolean(v));
    return items.length ? items : undefined;
  }
  const text = toText(value);
  if (!text) return undefined;
  if (text.startsWith("[")) {
    try {
      return toList(JSON.parse(text));
    } catch {
      /* fall through to separator parsing */
    }
  }
  const items = text
    .split(/[;\n]|,(?![^(]*\))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
};

const toQuoteLines = (value: unknown): QuoteLine[] | undefined => {
  if (Array.isArray(value)) return value as QuoteLine[];
  const text = toText(value);
  if (!text || !text.startsWith("[")) return undefined;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as QuoteLine[]) : undefined;
  } catch {
    return undefined;
  }
};
const toNightPrices = (value: unknown): NightPrice[] | undefined => {
  if (Array.isArray(value)) return value as NightPrice[];
  const text = toText(value);
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as NightPrice[]) : undefined;
  } catch {
    return undefined;
  }
};

const toSeminairePlanning = (value: unknown): SeminairePlanningItem[] | undefined => {
  if (Array.isArray(value)) return value as SeminairePlanningItem[];
  const text = toText(value);
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as SeminairePlanningItem[]) : undefined;
  } catch {
    return undefined;
  }
};

const toFbPlanning = (value: unknown): FbPlanningItem[] | undefined => {
  if (Array.isArray(value)) return value as FbPlanningItem[];
  const text = toText(value);
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as FbPlanningItem[]) : undefined;
  } catch {
    return undefined;
  }
};

const STATUS_ALIASES: Record<string, RequestStatus> = {
  "a completer": "Informations manquantes",
  "a compléter": "Informations manquantes",
  "à completer": "Informations manquantes",
  "à compléter": "Informations manquantes",
  nouvelle: "Nouvelle",
  new: "Nouvelle",
  "informations manquantes": "Informations manquantes",
  incomplete: "Informations manquantes",
  "incomplète": "Informations manquantes",
  "attente rm": "Attente RM",
  "en attente rm": "Attente RM",
  "attente retour client": "Attente retour client",
  "attente infos": "Attente retour client",
  "attente info": "Attente retour client",
  "prete a valider": "Prête à valider",
  "prête à valider": "Prête à valider",
  "devis envoye": "Acceptée",
  "devis envoyé": "Acceptée",
  envoye: "Acceptée",
  "envoyé": "Acceptée",
  envoyee: "Acceptée",
  "envoyée": "Acceptée",
  acceptee: "Acceptée",
  "acceptée": "Acceptée",
  validee: "Acceptée",
  "validée": "Acceptée",
  refusee: "Refusée",
  "refusée": "Refusée",
  bloquee: "Refusée",
  nouveau: "Nouvelle",
  "bloquée": "Refusée",
    "reponse envoye": "Acceptée",
  "reponse envoyee": "Acceptée",
  "reponse envoyée": "Acceptée",
  "réponse envoyee": "Acceptée",
  "réponse envoyée": "Acceptée",
};

const toStatus = (value: unknown): RequestStatus => {
  const text = toText(value);
  if (!text) return "Nouvelle";
  const exact = REQUEST_STATUSES.find((s) => s.toLowerCase() === text.toLowerCase());
  if (exact) return exact;
  return STATUS_ALIASES[text.toLowerCase()] ?? "Nouvelle";
};

/** Convert one sheet row into the app's request shape, dropping empty cells. */
export function normalizeRow(row: RawRow): SalesRequest | null {
  const id = toText(row["id"]);
  if (!id) return null;

  const result: Record<string, unknown> = { id, statut: toStatus(row["statut"]) };

  for (const [key, rawValue] of Object.entries(row)) {
    if (key === "id" || key === "statut") continue;
 if (key === "urgent" || key === "repondu") {
  const value = toText(rawValue)?.toLowerCase();
  if (value === "true" || value === "1") result[key] = true;
  else if (value === "false" || value === "0") result[key] = false;
  continue;
}

    if (key === "seminaire_planning") {
      const plan = toSeminairePlanning(rawValue);
      if (plan?.length) result[key] = plan;
      continue;
    }
    if (key === "seminaire_jours") {
      const plan = toSeminairePlanning(rawValue);
      if (plan?.length) result[key] = plan;
      continue;
    }

    if (key === "fb_planning") {
      const plan = toFbPlanning(rawValue);
      if (plan?.length) result[key] = plan;
      continue;
    }

    if (NUMBER_FIELDS.has(key)) {
      const num = toNumber(rawValue);
      if (num !== undefined) result[key] = num;
      continue;
    }

    if (LIST_FIELDS.has(key)) {
      const list = toList(rawValue);
      if (list) result[key] = list;
      continue;
    }

    if (key === "recap_devis") {
      const lines = toQuoteLines(rawValue);
      if (lines?.length) result[key] = lines;
      continue;
    }

    if (key === "tarifs_par_nuit") {
      const nights = toNightPrices(rawValue);
      if (nights?.length) result[key] = nights;
      continue;
    }

    if (key === "devise") {
      const text = toText(rawValue);
      result[key] = text === "EUR" ? "€" : text;
      continue;
    }

    const text = toText(rawValue);
    if (text !== undefined) result[key] = text;
  }

  return result as unknown as SalesRequest;
}


function webAppUrl(): string {
  const url = process.env["GOOGLE_SHEET_WEBAPP_URL"];
  if (!url) {
    throw new Error(
      "La connexion au Google Sheet n'est pas configurée (adresse du script manquante).",
    );
  }
  return url;
}

type ScriptResponse = {
  success?: boolean;
  error?: string;
  requests?: RawRow[];
};

async function callScript(params?: Record<string, string>): Promise<ScriptResponse> {
  const url = new URL(webAppUrl());
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { method: "GET", redirect: "follow" });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Le Google Sheet a répondu ${response.status} : ${text.slice(0, 300)}`);
  }

  let payload: ScriptResponse;
  try {
    payload = JSON.parse(text) as ScriptResponse;
  } catch {
    throw new Error(
      "Réponse inattendue du Google Sheet. Vérifiez que le script est déployé en accès « Tout le monde ».",
    );
  }

  if (payload.success === false) {
    throw new Error(payload.error ?? "Erreur inconnue renvoyée par le Google Sheet.");
  }

  return payload;
}

export async function fetchSheetRequests(): Promise<SalesRequest[]> {
  const payload = await callScript();
  const rows = Array.isArray(payload.requests) ? payload.requests : [];
  return rows
    .map(normalizeRow)
    .filter((r): r is SalesRequest => r !== null);
}

export async function pushSheetStatus(input: {
  id: string;
  statut: RequestStatus;
  date_action: string;
}): Promise<void> {
  await callScript({
    action: "update",
    id: input.id,
    statut: input.statut,
    date_action: input.date_action,
  });
}
