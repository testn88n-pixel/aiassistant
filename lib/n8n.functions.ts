import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const N8N_BASE_URL = "https://redburke.app.n8n.cloud/webhook";

export type N8nDecision = "accept" | "refuse";

export type N8nPayload = {
  decision: N8nDecision;
  body: Record<string, unknown>;
};

type N8nResult = { ok: boolean; action?: string | undefined };

/**
 * 1 & 2. Valider (/demandes/valider) ou Bloquer (/demandes/bloquer)
 */
export const notifyN8nDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: N8nPayload) => input)
  .handler(async ({ data }): Promise<N8nResult> => {
    const apiKey = process.env["N8N_API_KEY"];
    if (!apiKey) {
      throw new Error("Clé secrète N8N_API_KEY absente des variables d'environnement serveur.");
    }

    const path = data.decision === "accept" ? "/demandes/valider" : "/demandes/bloquer";

    const response = await fetch(`${N8N_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(data.body),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`n8n a répondu ${response.status} : ${text.slice(0, 200)}`);
    }

    try {
      const parsed = JSON.parse(text) as N8nResult;
      return { ok: parsed.ok === true, action: parsed.action };
    } catch {
      return { ok: false };
    }
  });

export type ModifyDevisResult = {
  ok: boolean;
  devis_lien?: string;
  devis_version?: number;
};

/**
 * 3. Modifier le devis (/demandes/modifier)
 */
export const modifyDevisFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      commentaire?: string | undefined;
      modifie_par?: string | undefined;
      hotel?: string | undefined;
      hotel_code?: string | undefined;
      hotel_adresse?: string | undefined;
    }) => input
  )
  .handler(async ({ data }): Promise<ModifyDevisResult> => {
    const apiKey = process.env["N8N_API_KEY"];
    if (!apiKey) {
      throw new Error("Clé secrète N8N_API_KEY absente des variables d'environnement serveur.");
    }

    const response = await fetch(`${N8N_BASE_URL}/demandes/modifier`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(data),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`n8n a répondu ${response.status} : ${text.slice(0, 200)}`);
    }

    try {
      const parsed = JSON.parse(text);
      return {
        ok: parsed.ok === true,
        devis_lien: parsed.devis_lien,
        devis_version: parsed.devis_version,
      };
    } catch {
      return { ok: false };
    }
  });

export type SendClientEmailResult = {
  ok: boolean;
  status?: number | undefined;
  error?: string | undefined;
};

/**
 * 4. Relancer en attente d'infos (/demandes/relancer)
 */
export const sendClientEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      message: string;
      email?: string | undefined;
      hotel?: string | undefined;
      hotel_code?: string | undefined;
      hotel_adresse?: string | undefined;
      cc?: string[] | undefined;
    }) => input
  )
  .handler(async ({ data }): Promise<SendClientEmailResult> => {
    const apiKey = process.env["N8N_API_KEY"];
    if (!apiKey) {
      throw new Error("Clé secrète N8N_API_KEY absente des variables d'environnement serveur.");
    }

    const response = await fetch(`${N8N_BASE_URL}/demandes/relancer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        id: data.id,
        message: data.message,
        hotel: data.hotel,
        hotel_code: data.hotel_code,
        hotel_adresse: data.hotel_adresse,
        cc: data.cc ?? [],
      }),
    });

    if (response.status === 409) {
      return { ok: false, status: 409, error: "Cette demande n'est plus en attente d'infos" };
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`n8n a répondu ${response.status} : ${text.slice(0, 200)}`);
    }

    try {
      const parsed = JSON.parse(text);
      return { ok: parsed.ok === true };
    } catch {
      return { ok: response.ok };
    }
  });

/**
 * 5. Relancer un devis validé (/demandes/relance-devis)
 */
export const relanceDevisFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      hotel?: string | undefined;
      hotel_code?: string | undefined;
      hotel_adresse?: string | undefined;
      cc?: string[] | undefined;
    }) => input
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const apiKey = process.env["N8N_API_KEY"];
    if (!apiKey) {
      throw new Error("Clé secrète N8N_API_KEY absente des variables d'environnement serveur.");
    }

    const response = await fetch(`${N8N_BASE_URL}/demandes/relance-devis`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({
        id: data.id,
        action: "relance à faire",
        hotel: data.hotel,
        hotel_code: data.hotel_code,
        hotel_adresse: data.hotel_adresse,
        cc: data.cc ?? [],
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`n8n a répondu ${response.status} : ${text.slice(0, 200)}`);
    }
    try {
      return { ok: JSON.parse(text).ok === true };
    } catch {
      return { ok: false };
    }
  });
