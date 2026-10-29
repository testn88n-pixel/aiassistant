interface Hotel {
  code: string;
  nom: string;
  adresse?: string;
  ville?: string;
  actif: boolean;
}

const SUPABASE_BASE = "https://bhbfeltpybjtenndvcaj.supabase.co/rest/v1";

function headers(): Record<string, string> {
  const key = process.env["APISUPABASE"];
  if (!key) throw new Error("Clé APISUPABASE manquante.");
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("ey")) h["Authorization"] = `Bearer ${key}`;
  return h;
}

export async function fetchAvailableHotels(userId: string): Promise<Hotel[]> {
  // 1. Vérifier si ce commercial a des attributions spécifiques
  const userRes = await fetch(
    `${SUPABASE_BASE}/commercial_hotels?user_id=eq.${encodeURIComponent(userId)}&select=hotel_code`,
    { headers: headers() }
  );
  const userRows: { hotel_code: string }[] = userRes.ok ? await userRes.json() : [];

  // 2. Charger les hôtels actifs
  const hotelsRes = await fetch(
    `${SUPABASE_BASE}/hotels?actif=eq.true&select=code,nom,adresse,ville,actif&order=nom.asc`,
    { headers: headers() }
  );
  const allHotels: Hotel[] = hotelsRes.ok ? await hotelsRes.json() : [];

  // 3. Filtrer si des restrictions existent pour ce commercial
  if (userRows.length > 0) {
    const allowedCodes = new Set(userRows.map((r) => r.hotel_code));
    return allHotels.filter((h) => allowedCodes.has(h.code));
  }

  return allHotels;
}
