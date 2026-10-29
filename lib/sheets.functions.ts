import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { REQUEST_STATUSES, type SalesRequest } from "@/data/types";

const statusSchema = z.enum(REQUEST_STATUSES);

export const listSheetRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<SalesRequest[]> => {
    const { fetchSheetRequests } = await import("./sheets.server");
    return fetchSheetRequests();
  },
);

export const updateSheetRequestStatus = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().min(1),
        statut: statusSchema,
        date_action: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<SalesRequest | null> => {
    const { pushSheetStatus, fetchSheetRequests } = await import("./sheets.server");
    await pushSheetStatus(data);
    const all = await fetchSheetRequests();
    return all.find((r) => r.id === data.id) ?? null;
  });
