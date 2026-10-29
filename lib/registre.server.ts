import type { FbPlanningItem, NightPrice, RequestStatus, SalesRequest } from "@/data/types";

import { normalizeRow } from "./sheets.server";
import { fetchAvailableHotels } from "./hotels.server";

/** Supabase project fed by n8n (table public.registre). */
const REGISTRE_URL = "https://bhbfeltpybjtenndvcaj.supabase.co/rest/v1/registre";

function headers(): Record<string, string> {
  const key = process.env["APISUPABASE"];
  if (!key) throw new Error("La connexion à la base des demandes n'est pas configurée.");
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("ey")) h["Authorization"] = `Bearer ${key}`;
  return h;
}

function escapeFilter(value: string): string {
  return value.replace(/[(),.]/g, (character) => `\\${character}`);
}

/** DB column names that differ from the app's field names. */
function toAppRow(row: Record<string, unknown>): Record<string, unknown> {
  const { seminaire_salle_demandee, ...rest } = row;
  return { ...rest, seminaire_salle_demande: seminaire_salle_demandee };
}

async function call(path: string, init?: RequestInit): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${REGISTRE_URL}${path}`, { ...init, headers: { ...headers(), ...init?.headers } });
  const text = await res.text();
  if (!res.ok) throw new Error(`La base des demandes a répondu ${res.status} : ${text.slice(0, 300)}`);
  return text ? (JSON.parse(text) as Record<string, unknown>[]) : [];
}

/** Returns only requests belonging to a hotel the signed-in user may access. */
export async function fetchRegistre(hotelCode: string, userId: string): Promise<SalesRequest[]> {
  const allowedHotels = await fetchAvailableHotels(userId);
  if (!allowedHotels.some((hotel) => hotel.code === hotelCode)) {
    throw new Error("Vous n'avez pas accès aux demandes de cet hôtel.");
  }
  const rows = await call(`?hotel_code=eq.${encodeURIComponent(escapeFilter(hotelCode))}&select=*&order=created_at.desc`);
  return rows.map((r) => normalizeRow(toAppRow(r))).filter((r): r is SalesRequest => r !== null);
}

export async function fetchRegistreById(id: string): Promise<SalesRequest | null> {
  const rows = await call(`?id=eq.${encodeURIComponent(id)}&select=*`);
  const row = rows[0];
  if (!row) return null;
  return normalizeRow(toAppRow(row));
}

const DB_STATUS: Partial<Record<RequestStatus, string>> = {
  Acceptée: "validee",
  Refusée: "bloquee",
  Nouvelle: "nouveau",
  "Prête à valider": "prete a valider",
  "Attente retour client": "attente retour client",
};

export async function updateRegistreStatus(input: {
  id: string;
  statut: RequestStatus;
  date_action: string;
}): Promise<SalesRequest | null> {
  const rows = await call(`?id=eq.${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ statut: DB_STATUS[input.statut] ?? "nouveau", date_action: input.date_action }),
  });
  const row = rows[0];
  return row ? normalizeRow(toAppRow(row)) : null;
}

export async function updateRegistrePrices(input: {
  id: string;
  tarif_recommande?: string | undefined;
  chambres?: number | undefined;
  pax?: number | undefined;
  seminaire_jours?: string | undefined;
  total_seminaire?: number | undefined;
  seminaire_salle_prix?: number | undefined;
  cafe_d_accueil_prix?: number | undefined;
  pause_matin_prix?: number | undefined;
  pause_apres_midi_prix?: number | undefined;
  fb_cocktail_prix?: number | undefined;
  fb_dejeuner_prix?: number | undefined;
  fb_diner_prix?: number | undefined;
  fb_dejeuner_assis_prix?: number | undefined;
  fb_diner_assis_prix?: number | undefined;
  tarifs_par_nuit?: NightPrice[] | undefined;
  total_hebergement?: number | undefined;
  fb_planning?: FbPlanningItem[] | undefined;
  total_fb?: number | undefined;
  total_devis?: number | undefined;
  autres_demandes?: string | undefined;
}): Promise<SalesRequest | null> {
  const body: Record<string, unknown> = {};
  const fields = [
    "tarif_recommande", "chambres", "pax", "seminaire_jours",
    "total_seminaire", "seminaire_salle_prix", "cafe_d_accueil_prix",
    "pause_matin_prix", "pause_apres_midi_prix", "fb_cocktail_prix",
    "fb_dejeuner_prix", "fb_diner_prix", "fb_dejeuner_assis_prix",
    "fb_diner_assis_prix", "tarifs_par_nuit", "total_hebergement",
    "fb_planning", "total_fb", "total_devis", "autres_demandes"
  ] as const;

  for (const f of fields) {
    if (input[f] !== undefined) body[f] = input[f];
  }

  const rows = await call(`?id=eq.${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const row = rows[0];
  return row ? normalizeRow(toAppRow(row)) : null;
}


export async function updateRegistreOtherRequests(input: {
  id: string;
  autres_demandes: string;
}): Promise<SalesRequest> {
  const rows = await call(`?id=eq.${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ autres_demandes: input.autres_demandes }),
  });

  const row = rows[0];
  const updated = row ? normalizeRow(toAppRow(row)) : null;
  if (!updated) throw new Error("Cette demande n’est plus disponible.");
  return updated;
}


export async function markRegistreRepondu(id: string): Promise<SalesRequest | null> {
  const rows = await call(`?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ repondu: true }),
  });
  const row = rows[0];
  return row ? normalizeRow(toAppRow(row)) : null;
}

export async function updateRegistreEmailsCopie(input: {
  id: string;
  emails_copie: string;
}): Promise<SalesRequest | null> {
  const rows = await call(`?id=eq.${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ emails_copie: input.emails_copie }),
  });
  const row = rows[0];
  return row ? normalizeRow(toAppRow(row)) : null;
}

