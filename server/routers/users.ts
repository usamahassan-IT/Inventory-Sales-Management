import { asc, count, desc, like, or } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { adminProcedure } from "../_core/trpc";
import { applicationRoles } from "../permissions";
import { pageResult, paginationSchema, requireDatabase } from "./utils";

const inputSchema = paginationSchema.extend({ sortBy: z.enum(["name", "email", "role", "createdAt"]).default("createdAt") });

export const usersRouter = {
  list: adminProcedure.input(inputSchema).query(async ({ input }) => {
    const db = await requireDatabase();
    const filters = input.search
      ? [or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`))]
      : [];
    const where = filters.length ? filters[0] : undefined;
    const orderColumn = { name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }[input.sortBy];
    const order = input.sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);
    const items = await db.select().from(users).where(where).orderBy(order).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
    const [{ total }] = await db.select({ total: count() }).from(users).where(where);
    return pageResult(items, Number(total), input.page, input.pageSize);
  }),
  updateRole: adminProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(applicationRoles) })).mutation(async ({ input, ctx }) => {
    if (input.id === ctx.user.id) throw new Error("Administrators cannot change their own role.");
    const db = await requireDatabase();
    await db.update(users).set({ role: input.role }).where((await import("drizzle-orm")).eq(users.id, input.id));
    return { success: true };
  }),
};
