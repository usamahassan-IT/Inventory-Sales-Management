import { and, asc, count, desc, eq, gte, lte, sum } from "drizzle-orm";
import { z } from "zod";
import { products, saleItems, sales, stockMovements } from "../../drizzle/schema";
import { managerProcedure, salesProcedure } from "../permissions";
import { getInventorySettings, requireDatabase } from "./utils";

const rangeSchema = z.object({ dateFrom: z.coerce.date().optional(), dateTo: z.coerce.date().optional() });

export const insightsRouter = {
  dashboard: salesProcedure.query(async ({ ctx }) => {
    const db = await requireDatabase();
    const settings = await getInventorySettings(db);
    const [{ totalProducts }] = await db.select({ totalProducts: count() }).from(products);
    const [{ lowStockCount }] = await db.select({ lowStockCount: count() }).from(products).where(lte(products.quantity, settings.lowStockThreshold));
    const salesWhere = ctx.user.role === "staff" ? eq(sales.createdByUserId, ctx.user.id) : undefined;
    const [{ totalSalesRevenue, transactionCount }] = await db.select({ totalSalesRevenue: sum(sales.totalAmount), transactionCount: count() }).from(sales).where(salesWhere);
    const recentTransactions = await db.select({ id: sales.id, reference: sales.reference, customerName: sales.customerName, totalAmount: sales.totalAmount, saleDate: sales.saleDate }).from(sales).where(salesWhere).orderBy(desc(sales.saleDate)).limit(6);
    const lowStockProducts = await db.select({ id: products.id, name: products.name, sku: products.sku, quantity: products.quantity }).from(products).where(lte(products.quantity, settings.lowStockThreshold)).orderBy(asc(products.quantity)).limit(6);
    return { totalProducts: Number(totalProducts), lowStockCount: Number(lowStockCount), totalSalesRevenue: Number(totalSalesRevenue ?? 0), transactionCount: Number(transactionCount), lowStockThreshold: settings.lowStockThreshold, recentTransactions, lowStockProducts };
  }),
  reports: managerProcedure.input(rangeSchema).query(async ({ input }) => {
    const db = await requireDatabase();
    const salesConditions = [] as any[];
    const movementConditions = [] as any[];
    if (input.dateFrom) { salesConditions.push(gte(sales.saleDate, input.dateFrom)); movementConditions.push(gte(stockMovements.occurredAt, input.dateFrom)); }
    if (input.dateTo) { salesConditions.push(lte(sales.saleDate, input.dateTo)); movementConditions.push(lte(stockMovements.occurredAt, input.dateTo)); }
    const salesWhere = salesConditions.length ? and(...salesConditions) : undefined;
    const movementWhere = movementConditions.length ? and(...movementConditions) : undefined;
    const salesRows = await db.select({ saleDate: sales.saleDate, totalAmount: sales.totalAmount }).from(sales).where(salesWhere);
    const salesByDay = new Map<string, { revenue: number; transactions: number }>();
    for (const row of salesRows) {
      const date = row.saleDate.toISOString().slice(0, 10);
      const current = salesByDay.get(date) ?? { revenue: 0, transactions: 0 };
      current.revenue += Number(row.totalAmount);
      current.transactions += 1;
      salesByDay.set(date, current);
    }
    const salesOverTime = Array.from(salesByDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, revenue: values.revenue, transactions: values.transactions }));
    const saleItemRows = await db.select({ productId: saleItems.productId, name: saleItems.productName, sku: saleItems.sku, quantity: saleItems.quantity, totalAmount: saleItems.totalAmount }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).where(salesWhere);
    const productsById = new Map<number, { name: string; sku: string; quantity: number; revenue: number }>();
    for (const row of saleItemRows) {
      const current = productsById.get(row.productId) ?? { name: row.name, sku: row.sku, quantity: 0, revenue: 0 };
      current.quantity += row.quantity;
      current.revenue += Number(row.totalAmount);
      productsById.set(row.productId, current);
    }
    const topProducts = Array.from(productsById.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 8);
    const movementRows = await db.select({ occurredAt: stockMovements.occurredAt, direction: stockMovements.direction, quantity: stockMovements.quantity }).from(stockMovements).where(movementWhere);
    const movementByDay = new Map<string, number>();
    for (const row of movementRows) {
      const date = row.occurredAt.toISOString().slice(0, 10);
      movementByDay.set(date, (movementByDay.get(date) ?? 0) + (row.direction === "inbound" ? row.quantity : -row.quantity));
    }
    const stockTrend = Array.from(movementByDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, netMovement]) => ({ date, netMovement }));
    return { salesOverTime, topProducts, stockTrend };
  }),
};
