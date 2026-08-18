import { inventorySettings } from "../../drizzle/schema";
import { adminProcedure, protectedProcedure } from "../_core/trpc";
import { getInventorySettings, requireDatabase, updateSettingsSchema } from "./utils";

export const settingsRouter = {
  get: protectedProcedure.query(async () => {
    const db = await requireDatabase();
    return getInventorySettings(db);
  }),
  update: adminProcedure.input(updateSettingsSchema).mutation(async ({ input }) => {
    const db = await requireDatabase();
    const current = await getInventorySettings(db);
    if (current?.id) {
      const { eq } = await import("drizzle-orm");
      await db
        .update(inventorySettings)
        .set({ lowStockThreshold: input.lowStockThreshold })
        .where(eq(inventorySettings.id, current.id));
    } else {
      await db.insert(inventorySettings).values({ lowStockThreshold: input.lowStockThreshold });
    }
    return { success: true, lowStockThreshold: input.lowStockThreshold };
  }),
};
