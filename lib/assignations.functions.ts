// src/lib/assignations.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DemandeAssignation } from "./assignations.server";

/** Récupère la liste de toutes les assignations existantes */
export const listAssignationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<Record<string, DemandeAssignation>> => {
    const { fetchAllAssignations } = await import("./assignations.server");
    return fetchAllAssignations();
  });

/** Assigne automatiquement la demande lors de sa première consultation */
export const claimAssignationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        demande_id: z.string().min(1),
        user_id: z.string().nullish(),
        user_name: z.string().min(1),
        user_email: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<DemandeAssignation> => {
    const { claimIfUnassigned } = await import("./assignations.server");
    return claimIfUnassigned({
      ...data,
      user_id: data.user_id ?? null,
    });
  });

/** Réassigne manuellement la demande à un autre commercial */
export const updateAssignationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        demande_id: z.string().min(1),
        user_id: z.string().nullish(),
        user_name: z.string().min(1),
        user_email: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<DemandeAssignation> => {
    const { updateAssignation } = await import("./assignations.server");
    return updateAssignation({
      ...data,
      user_id: data.user_id ?? null,
    });
  });
/** Récupère les utilisateurs qui ont créé un compte */
export const listTeamUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    
    return (data?.users ?? []).map((u) => {
      const metaName = u.user_metadata?.["full_name"] as string | undefined;
      const fallbackName = u.email ? u.email.split("@")[0] : "Commercial";
      const name: string = (metaName && metaName.trim().length > 0 ? metaName.trim() : fallbackName) || "Commercial";
      return {
        id: u.id,
        email: u.email ?? "",
        name: name.charAt(0).toUpperCase() + name.slice(1),
      };
    });
  });
