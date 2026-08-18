import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { inventorySettings } from "../../drizzle/schema";
import { getDb } from "../db";

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(10),
  search: z.string().trim().max(120).optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export async function requireDatabase() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The database connection is unavailable." });
  }
  return db;
}

export function pageResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getInventorySettings(db: any) {
  const existing = await db.select().from(inventorySettings).limit(1);
  if (existing[0]) return existing[0];

  await db.insert(inventorySettings).values({ lowStockThreshold: 10 });
  const created = await db.select().from(inventorySettings).limit(1);
  return created[0];
}

export function internalError(error: unknown): never {
  console.error("[Inventory] Database operation failed", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to complete the requested operation." });
}

export const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);

export const idSchema = z.object({ id: z.number().int().positive() });

export const updateSettingsSchema = z.object({
  lowStockThreshold: z.number().int().min(0).max(100000),
});
