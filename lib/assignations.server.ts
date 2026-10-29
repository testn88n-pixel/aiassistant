export interface DemandeAssignation {
  id?: string;
  demande_id: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  assigned_at: string;
  updated_at?: string;
}

const ASSIGNATIONS_URL = "https://bhbfeltpybjtenndvcaj.supabase.co/rest/v1/demande_assignations";

function headers(): Record<string, string> {
  const key = process.env["APISUPABASE"];
  if (!key) throw new Error("La connexion à la base des demandes n'est pas configurée.");
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("ey")) h["Authorization"] = `Bearer ${key}`;
  return h;
}

async function call(path: string, init?: RequestInit): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${ASSIGNATIONS_URL}${path}`, {
    ...init,
    headers: { ...headers(), ...init?.headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`La base des assignations a répondu ${res.status} : ${text.slice(0, 300)}`);
  return text ? (JSON.parse(text) as Record<string, unknown>[]) : [];
}

/** Récupère toutes les assignations sous forme de dictionnaire indexé par demande_id */
export async function fetchAllAssignations(): Promise<Record<string, DemandeAssignation>> {
  const rows = (await call("?select=*")) as unknown as DemandeAssignation[];
  const map: Record<string, DemandeAssignation> = {};
  for (const r of rows) {
    map[r.demande_id] = r;
  }
  return map;
}

/** Assigne automatiquement la demande si elle n'a pas encore de responsable */
export async function claimIfUnassigned(input: {
  demande_id: string;
  user_id?: string | null | undefined;
  user_name: string;
  user_email: string;
}): Promise<DemandeAssignation> {
  // 1. Vérifie si déjà assignée
  const existing = (await call(`?demande_id=eq.${encodeURIComponent(input.demande_id)}&select=*`)) as unknown as DemandeAssignation[];
  if (existing[0]) {
    return existing[0];
  }

  // 2. Première ouverture : on l'attribue à l'utilisateur courant
  const created = (await call("", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      demande_id: input.demande_id,
user_id: null,
      user_name: input.user_name,
      user_email: input.user_email,
      assigned_at: new Date().toISOString(),
    }),
  })) as unknown as DemandeAssignation[];

  const first = created[0];
  if (!first) throw new Error("Échec de création de l'assignation");
  return first;
}

/** Réassigne manuellement la demande à un autre commercial */
export async function updateAssignation(input: {
  demande_id: string;
  user_id?: string | null | undefined;
  user_name: string;
  user_email: string;
}): Promise<DemandeAssignation> {
  const rows = (await call(`?demande_id=eq.${encodeURIComponent(input.demande_id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
user_id: null,
      user_name: input.user_name,
      user_email: input.user_email,
      updated_at: new Date().toISOString(),
    }),
  })) as unknown as DemandeAssignation[];

  if (rows[0]) return rows[0];
  return claimIfUnassigned(input);
}
