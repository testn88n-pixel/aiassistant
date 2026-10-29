import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { REQUEST_STATUSES, type SalesRequest } from "@/data/types";

export const listRegistre = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ hotelCode: z.string().min(1).max(100) }).parse(data))
  .handler(async ({ data, context }): Promise<SalesRequest[]> => {
    const { fetchRegistre } = await import("./registre.server");
    return fetchRegistre(data.hotelCode, context.userId);
  });

export const getRegistreByIdFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<SalesRequest | null> => {
    const { fetchRegistreById } = await import("./registre.server");
    return fetchRegistreById(data.id);
  });

export const updateRegistreStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ id: z.string().min(1), statut: z.enum(REQUEST_STATUSES), date_action: z.string().min(1) })
      .parse(data),
  )
  .handler(async ({ data }): Promise<SalesRequest | null> => {
    const { updateRegistreStatus } = await import("./registre.server");
    return updateRegistreStatus(data);
  });
export const updateRegistrePricesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().min(1),
        tarif_recommande: z.string().optional(),
        chambres: z.number().optional(),
        pax: z.number().optional(),
        seminaire_jours: z.string().optional(),
        total_seminaire: z.number().optional(),
        seminaire_salle_prix: z.number().optional(),
        cafe_d_accueil_prix: z.number().optional(),
        pause_matin_prix: z.number().optional(),
        pause_apres_midi_prix: z.number().optional(),
        fb_cocktail_prix: z.number().optional(),
        fb_dejeuner_prix: z.number().optional(),
        fb_diner_prix: z.number().optional(),
        fb_dejeuner_assis_prix: z.number().optional(),
        fb_diner_assis_prix: z.number().optional(),
        tarifs_par_nuit: z.array(z.object({ date: z.string(), prix_bb: z.number().optional() })).optional(),
        total_hebergement: z.number().optional(),
        fb_planning: z.array(z.any()).optional(),
        total_fb: z.number().optional(),
        total_devis: z.number().optional(),
        autres_demandes: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<SalesRequest | null> => {
    const { updateRegistrePrices } = await import("./registre.server");
    return updateRegistrePrices(data);
  });


export const updateRegistreOtherRequestsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      id: z.string().min(1),
      autres_demandes: z.string().max(20000),
    }).strict().parse(data),
  )
  .handler(async ({ data }): Promise<SalesRequest> => {
    const { updateRegistreOtherRequests } = await import("./registre.server");
    return updateRegistreOtherRequests(data);
  });



export const markRegistreReponduFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<SalesRequest | null> => {
    const { markRegistreRepondu } = await import("./registre.server");
    return markRegistreRepondu(data.id);
  });

export const updateRegistreEmailsCopieFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().min(1), emails_copie: z.string() }).parse(data),
  )
  .handler(async ({ data }): Promise<SalesRequest | null> => {
    const { updateRegistreEmailsCopie } = await import("./registre.server");
    return updateRegistreEmailsCopie(data);
  });

