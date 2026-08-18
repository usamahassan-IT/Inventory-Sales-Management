import { and, asc, count, desc, eq, getTableColumns, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { products, suppliers } from "../../drizzle/schema";
import { managerProcedure, salesProcedure } from "../permissions";
import { idSchema, nonEmptyText, pageResult, paginationSchema, requireDatabase } from "./utils";

const supplierSchema = z.object({
  name: nonEmptyText(160),
  contactName: z.string().trim().max(160).nullable().optional(),
  email: z.string().trim().email().max(320).nullable().optional(),
  phone: z.string().trim().max(64).nullable().optional(),
  address: z.string().trim().max(2000).nullable().optional(),
});

const listSchema = paginationSchema.extend({
  sortBy: z.enum(["name", "contactName", "createdAt"]).default("name"),
  relationship: z.enum(["all", "withProducts", "withoutProducts"]).default("all"),
});

export const suppliersRouter = {
  list: salesProcedure.input(listSchema).query(async ({ input }) => {
    const db = await requireDatabase();
    const conditions = [] as any[];
    if (input.search) conditions.push(or(like(suppliers.name, `%${input.search}%`), like(suppliers.contactName, `%${input.search}%`), like(suppliers.email, `%${input.search}%`)));
    if (input.relationship === "withProducts") conditions.push(isNotNull(products.id));
    if (input.relationship === "withoutProducts") conditions.push(isNull(products.id));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderColumn = { name: suppliers.name, contactName: suppliers.contactName, createdAt: suppliers.createdAt }[input.sortBy];
    const order = input.sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);
    const items = await db.select({ ...getTableColumns(suppliers), productCount: count(products.id), productNames: sql<string | null>`GROUP_CONCAT(${products.name} ORDER BY ${products.name} SEPARATOR ', ')` }).from(suppliers).leftJoin(products, eq(products.supplierId, suppliers.id)).where(where).groupBy(suppliers.id).orderBy(order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
    const totalRows = await db.select({ id: suppliers.id }).from(suppliers).leftJoin(products, eq(products.supplierId, suppliers.id)).where(where).groupBy(suppliers.id);
    return pageResult(items, totalRows.length, input.page, input.pageSize);
  }),
  create: managerProcedure.input(supplierSchema).mutation(async ({ input }) => {
    const db = await requireDatabase();
    const result = await db.insert(suppliers).values(input);
    return { id: Number(result[0].insertId) };
  }),
  update: managerProcedure.input(idSchema.merge(supplierSchema)).mutation(async ({ input }) => {
    const db = await requireDatabase();
    const { id, ...values } = input;
    await db.update(suppliers).set(values).where(eq(suppliers.id, id));
    return { success: true };
  }),
  remove: managerProcedure.input(idSchema).mutation(async ({ input }) => {
    const db = await requireDatabase();
    await db.delete(suppliers).where(eq(suppliers.id, input.id));
    return { success: true };
  }),
};
