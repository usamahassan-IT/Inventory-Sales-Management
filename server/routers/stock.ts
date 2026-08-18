import { and, asc, count, desc, eq, getTableColumns, gte, like, lte, or } from "drizzle-orm";
import { z } from "zod";
import { products, stockMovements, users } from "../../drizzle/schema";
import { quantityAfterMovement } from "../inventoryDomain";
import { managerProcedure } from "../permissions";
import { idSchema, nonEmptyText, pageResult, paginationSchema, requireDatabase } from "./utils";

const listSchema = paginationSchema.extend({
  sortBy: z.enum(["occurredAt", "quantity", "direction", "product"]).default("occurredAt"),
  direction: z.enum(["inbound", "outbound"]).optional(),
  productId: z.number().int().positive().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const movementSchema = z.object({
  productId: z.number().int().positive(),
  direction: z.enum(["inbound", "outbound"]),
  quantity: z.number().int().positive().max(1000000),
  reason: nonEmptyText(200),
  notes: z.string().trim().max(2000).nullable().optional(),
  occurredAt: z.coerce.date().optional(),
});

export const stockRouter = {
  list: managerProcedure.input(listSchema).query(async ({ input }) => {
    const db = await requireDatabase();
    const conditions = [] as any[];
    if (input.search) conditions.push(or(like(products.name, `%${input.search}%`), like(products.sku, `%${input.search}%`), like(stockMovements.reason, `%${input.search}%`)));
    if (input.direction) conditions.push(eq(stockMovements.direction, input.direction));
    if (input.productId) conditions.push(eq(stockMovements.productId, input.productId));
    if (input.dateFrom) conditions.push(gte(stockMovements.occurredAt, input.dateFrom));
    if (input.dateTo) conditions.push(lte(stockMovements.occurredAt, input.dateTo));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderColumn = { occurredAt: stockMovements.occurredAt, quantity: stockMovements.quantity, direction: stockMovements.direction, product: products.name }[input.sortBy];
    const order = input.sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);
    const items = await db.select({ ...getTableColumns(stockMovements), productName: products.name, sku: products.sku, staffName: users.name }).from(stockMovements).innerJoin(products, eq(stockMovements.productId, products.id)).leftJoin(users, eq(stockMovements.createdByUserId, users.id)).where(where).orderBy(order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
    const [{ total }] = await db.select({ total: count() }).from(stockMovements).innerJoin(products, eq(stockMovements.productId, products.id)).where(where);
    return pageResult(items, Number(total), input.page, input.pageSize);
  }),
  create: managerProcedure.input(movementSchema).mutation(async ({ input, ctx }) => {
    const db = await requireDatabase();
    return db.transaction(async tx => {
      const product = (await tx.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
      if (!product) throw new Error("The selected product no longer exists.");
      const quantityAfter = quantityAfterMovement(product.quantity, input.direction, input.quantity);
      if (quantityAfter < 0) throw new Error("Outbound movement cannot reduce inventory below zero.");
      await tx.update(products).set({ quantity: quantityAfter }).where(eq(products.id, input.productId));
      const created = await tx.insert(stockMovements).values({
        productId: input.productId,
        direction: input.direction,
        quantity: input.quantity,
        quantityBefore: product.quantity,
        quantityAfter,
        reason: input.reason,
        notes: input.notes ?? null,
        createdByUserId: ctx.user.id,
        occurredAt: input.occurredAt,
      });
      return { id: Number(created[0].insertId), quantityAfter };
    });
  }),
  productHistory: managerProcedure.input(idSchema).query(async ({ input }) => {
    const db = await requireDatabase();
    return db.select().from(stockMovements).where(eq(stockMovements.productId, input.id)).orderBy(desc(stockMovements.occurredAt)).limit(50);
  }),
};
