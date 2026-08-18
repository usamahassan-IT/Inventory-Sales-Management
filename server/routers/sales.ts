import { and, asc, count, desc, eq, getTableColumns, gte, inArray, like, lte, or } from "drizzle-orm";
import { z } from "zod";
import { products, saleItems, sales, stockMovements, users } from "../../drizzle/schema";
import { canFulfilQuantity, lineTotal, saleTotal } from "../inventoryDomain";
import { salesProcedure } from "../permissions";
import { idSchema, pageResult, paginationSchema, requireDatabase } from "./utils";

const listSchema = paginationSchema.extend({
  sortBy: z.enum(["saleDate", "reference", "totalAmount", "staff"]).default("saleDate"),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  staffId: z.number().int().positive().optional(),
});

const createSaleSchema = z.object({
  customerName: z.string().trim().max(160).nullable().optional(),
  saleDate: z.coerce.date().optional(),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(1000000), unitPrice: z.number().finite().min(0).max(99999999.99).optional() })).min(1).max(100),
});

export const salesRouter = {
  list: salesProcedure.input(listSchema).query(async ({ input, ctx }) => {
    const db = await requireDatabase();
    const conditions = [] as any[];
    if (input.search) conditions.push(or(like(sales.reference, `%${input.search}%`), like(sales.customerName, `%${input.search}%`), like(users.name, `%${input.search}%`)));
    if (input.dateFrom) conditions.push(gte(sales.saleDate, input.dateFrom));
    if (input.dateTo) conditions.push(lte(sales.saleDate, input.dateTo));
    if (input.staffId && ctx.user.role !== "staff") conditions.push(eq(sales.createdByUserId, input.staffId));
    if (ctx.user.role === "staff") conditions.push(eq(sales.createdByUserId, ctx.user.id));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderColumn = { saleDate: sales.saleDate, reference: sales.reference, totalAmount: sales.totalAmount, staff: users.name }[input.sortBy];
    const order = input.sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);
    const items = await db.select({ ...getTableColumns(sales), staffName: users.name }).from(sales).innerJoin(users, eq(sales.createdByUserId, users.id)).where(where).orderBy(order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
    const [{ total }] = await db.select({ total: count() }).from(sales).innerJoin(users, eq(sales.createdByUserId, users.id)).where(where);
    return pageResult(items, Number(total), input.page, input.pageSize);
  }),
  get: salesProcedure.input(idSchema).query(async ({ input, ctx }) => {
    const db = await requireDatabase();
    const sale = (await db.select({ ...getTableColumns(sales), staffName: users.name }).from(sales).innerJoin(users, eq(sales.createdByUserId, users.id)).where(eq(sales.id, input.id)).limit(1))[0];
    if (!sale || (ctx.user.role === "staff" && sale.createdByUserId !== ctx.user.id)) throw new Error("Sale record not found.");
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, input.id));
    return { ...sale, items };
  }),
  create: salesProcedure.input(createSaleSchema).mutation(async ({ input, ctx }) => {
    const db = await requireDatabase();
    const reference = `SAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return db.transaction(async tx => {
      const ids = Array.from(new Set(input.items.map(item => item.productId)));
      const selectedProducts = await tx.select().from(products).where(inArray(products.id, ids));
      if (selectedProducts.length !== ids.length) throw new Error("One or more selected products are unavailable.");
      const productMap = new Map(selectedProducts.map(product => [product.id, product]));
      const requested = new Map<number, number>();
      for (const item of input.items) requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
      for (const [productId, quantity] of Array.from(requested.entries())) {
        const product = productMap.get(productId)!;
        if (!canFulfilQuantity(product.quantity, quantity)) throw new Error(`${product.name} has insufficient available stock.`);
      }
      const preparedItems = input.items.map(item => {
        const product = productMap.get(item.productId)!;
        const unitPrice = item.unitPrice ?? Number(product.price);
        return { ...item, product, unitPrice, totalAmount: lineTotal(unitPrice, item.quantity) };
      });
      const totalAmount = saleTotal(preparedItems);
      const createdSale = await tx.insert(sales).values({ reference, customerName: input.customerName ?? null, totalAmount: totalAmount.toFixed(2), createdByUserId: ctx.user.id, saleDate: input.saleDate });
      const saleId = Number(createdSale[0].insertId);
      await tx.insert(saleItems).values(preparedItems.map(item => ({ saleId, productId: item.productId, productName: item.product.name, sku: item.product.sku, quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2), totalAmount: item.totalAmount.toFixed(2) })));
      for (const [productId, quantity] of Array.from(requested.entries())) {
        const product = productMap.get(productId)!;
        const quantityAfter = product.quantity - quantity;
        await tx.update(products).set({ quantity: quantityAfter }).where(eq(products.id, productId));
        await tx.insert(stockMovements).values({ productId, direction: "outbound", quantity, quantityBefore: product.quantity, quantityAfter, reason: `Sale ${reference}`, createdByUserId: ctx.user.id, occurredAt: input.saleDate });
      }
      return { id: saleId, reference, totalAmount };
    });
  }),
};
