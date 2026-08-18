import { and, asc, count, desc, eq, getTableColumns, like, or } from "drizzle-orm";
import { z } from "zod";
import { products, stockMovements, suppliers } from "../../drizzle/schema";
import { isLowStock } from "../inventoryDomain";
import { managerProcedure, salesProcedure } from "../permissions";
import { getInventorySettings, idSchema, nonEmptyText, pageResult, paginationSchema, requireDatabase } from "./utils";

const productSchema = z.object({
  name: nonEmptyText(200),
  sku: nonEmptyText(80).transform(value => value.toUpperCase()),
  category: nonEmptyText(100),
  price: z.number().finite().min(0).max(99999999.99),
  supplierId: z.number().int().positive().nullable().optional(),
});
const createSchema = productSchema.extend({ quantity: z.number().int().min(0).max(1000000).default(0) });
const listSchema = paginationSchema.extend({
  sortBy: z.enum(["name", "sku", "category", "price", "quantity", "createdAt"]).default("createdAt"),
  category: z.string().trim().max(100).optional(),
  supplierId: z.number().int().positive().optional(),
  lowStockOnly: z.boolean().optional(),
});

export const productsRouter = {
  list: salesProcedure.input(listSchema).query(async ({ input }) => {
    const db = await requireDatabase();
    const settings = await getInventorySettings(db);
    const conditions = [] as any[];
    if (input.search) conditions.push(or(like(products.name, `%${input.search}%`), like(products.sku, `%${input.search}%`), like(products.category, `%${input.search}%`)));
    if (input.category) conditions.push(eq(products.category, input.category));
    if (input.supplierId) conditions.push(eq(products.supplierId, input.supplierId));
    if (input.lowStockOnly) conditions.push((await import("drizzle-orm")).lte(products.quantity, settings.lowStockThreshold));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderColumn = { name: products.name, sku: products.sku, category: products.category, price: products.price, quantity: products.quantity, createdAt: products.createdAt }[input.sortBy];
    const order = input.sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);
    const items = await db.select({ ...getTableColumns(products), supplierName: suppliers.name }).from(products).leftJoin(suppliers, eq(products.supplierId, suppliers.id)).where(where).orderBy(order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
    const [{ total }] = await db.select({ total: count() }).from(products).where(where);
    return { ...pageResult(items.map(item => ({ ...item, isLowStock: isLowStock(item.quantity, settings.lowStockThreshold) })), Number(total), input.page, input.pageSize), lowStockThreshold: settings.lowStockThreshold };
  }),
  categories: salesProcedure.query(async () => {
    const db = await requireDatabase();
    return db.selectDistinct({ category: products.category }).from(products).orderBy(asc(products.category));
  }),
  create: managerProcedure.input(createSchema).mutation(async ({ input, ctx }) => {
    const db = await requireDatabase();
    const { quantity, price, ...product } = input;
    const result = await db.transaction(async tx => {
      const created = await tx.insert(products).values({ ...product, price: price.toFixed(2), quantity });
      const productId = Number(created[0].insertId);
      if (quantity > 0) {
        await tx.insert(stockMovements).values({ productId, direction: "inbound", quantity, quantityBefore: 0, quantityAfter: quantity, reason: "Initial stock", createdByUserId: ctx.user.id });
      }
      return productId;
    });
    return { id: result };
  }),
  update: managerProcedure.input(idSchema.merge(productSchema)).mutation(async ({ input }) => {
    const db = await requireDatabase();
    const { id, price, ...values } = input;
    await db.update(products).set({ ...values, price: price.toFixed(2) }).where(eq(products.id, id));
    return { success: true };
  }),
  remove: managerProcedure.input(idSchema).mutation(async ({ input }) => {
    const db = await requireDatabase();
    await db.delete(products).where(eq(products.id, input.id));
    return { success: true };
  }),
};
