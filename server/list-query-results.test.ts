import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({ db: null as any }));

vi.mock("./routers/utils", async () => {
  const actual = await vi.importActual<typeof import("./routers/utils")>("./routers/utils");
  return { ...actual, requireDatabase: async () => state.db, getInventorySettings: async () => ({ lowStockThreshold: 10 }) };
});

import { appRouter } from "./routers";

function includesValue(value: unknown, expected: unknown, seen = new Set<unknown>()): boolean {
  if (value === expected) return true;
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.keys(value as object).some(key => {
    try { return includesValue((value as Record<string, unknown>)[key], expected, seen); } catch { return false; }
  });
}

function staffContext(): TrpcContext {
  return { user: { id: 7, openId: "query-test", name: "Query Test", email: "query@test.local", loginMethod: "test", role: "staff", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

function managerContext(): TrpcContext {
  return { ...staffContext(), user: { ...staffContext().user!, role: "manager" } };
}

describe("product table query results", () => {
  it("returns the expected page row only when simultaneous search, category, low-stock, sort, and pagination controls are included", async () => {
    let condition: unknown;
    const expected = { id: 9, name: "Atlas Clamp", sku: "ATL-9", category: "Hardware", price: "12.00", quantity: 8, supplierId: null, supplierName: null };
    const mismatch = { id: 10, name: "Unfiltered Row", sku: "MISS", category: "Other", price: "1.00", quantity: 99, supplierId: null, supplierName: null };
    const offset = vi.fn(async (offsetValue: number) => includesValue(condition, "%atlas%") && includesValue(condition, "Hardware") && includesValue(condition, 10) && offsetValue === 5 ? [expected] : [mismatch]);
    const limit = vi.fn(() => ({ offset }));
    const orderBy = vi.fn(() => ({ limit }));
    const where = vi.fn((nextCondition: unknown) => { condition = nextCondition; return { orderBy }; });
    state.db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ where }) }) })
        .mockReturnValueOnce({ from: () => ({ where: vi.fn().mockResolvedValue([{ total: 6 }]) }) }),
    };

    const caller = appRouter.createCaller(staffContext());
    const result = await caller.products.list({ page: 2, pageSize: 5, search: "atlas", category: "Hardware", lowStockOnly: true, sortBy: "name", sortDirection: "asc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 9, name: "Atlas Clamp", isLowStock: true });
    expect(result).toMatchObject({ page: 2, pageSize: 5, pageCount: 2, total: 6 });
    expect(orderBy).toHaveBeenCalledOnce();
    expect(limit).toHaveBeenCalledWith(5);
    expect(offset).toHaveBeenCalledWith(5);
  });

  it("returns the expected supplier, stock, and sales fixture rows only when their filters and page controls reach the query", async () => {
    let supplierCondition: unknown;
    const supplierOffset = vi.fn(async (pageOffset: number) => includesValue(supplierCondition, "%north%") && pageOffset === 0 ? [{ id: 2, name: "Northline Supply", contactName: null, email: null, phone: null, address: null, productCount: 1, productNames: "Atlas Clamp", createdAt: new Date() }] : [{ id: 3, name: "Mismatch Supplier", contactName: null, email: null, phone: null, address: null, productCount: 0, productNames: null, createdAt: new Date() }]);
    const supplierLimit = vi.fn(() => ({ offset: supplierOffset }));
    const supplierOrder = vi.fn(() => ({ limit: supplierLimit }));
    const supplierGroup = vi.fn(() => ({ orderBy: supplierOrder }));
    const supplierWhere = vi.fn((next: unknown) => { supplierCondition = next; return { groupBy: supplierGroup }; });
    state.db = { select: vi.fn().mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ where: supplierWhere }) }) }).mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ where: () => ({ groupBy: vi.fn().mockResolvedValue([{ id: 2 }]) }) }) }) }) };
    const suppliers = await appRouter.createCaller(staffContext()).suppliers.list({ page: 1, pageSize: 5, search: "north", relationship: "withProducts", sortBy: "name", sortDirection: "asc" });
    expect(suppliers.items[0]).toMatchObject({ name: "Northline Supply", productNames: "Atlas Clamp" });

    let stockCondition: unknown;
    const stockOffset = vi.fn(async (pageOffset: number) => includesValue(stockCondition, "%delivery%") && includesValue(stockCondition, "inbound") && includesValue(stockCondition, 1) && pageOffset === 0 ? [{ id: 4, productId: 1, productName: "Atlas Clamp", sku: "ATL-1", direction: "inbound", quantity: 6, reason: "Purchase delivery", quantityBefore: 2, quantityAfter: 8, occurredAt: new Date(), staffName: "Query Test" }] : [{ id: 5, productId: 2, productName: "Mismatch", sku: "MISS", direction: "outbound", quantity: 1, reason: "Other", quantityBefore: 2, quantityAfter: 1, occurredAt: new Date(), staffName: "Query Test" }]);
    const stockLimit = vi.fn(() => ({ offset: stockOffset }));
    const stockOrder = vi.fn(() => ({ limit: stockLimit }));
    const stockWhere = vi.fn((next: unknown) => { stockCondition = next; return { orderBy: stockOrder }; });
    state.db = { select: vi.fn().mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ leftJoin: () => ({ where: stockWhere }) }) }) }).mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: vi.fn().mockResolvedValue([{ total: 1 }]) }) }) }) };
    const stock = await appRouter.createCaller(managerContext()).stock.list({ page: 1, pageSize: 5, search: "delivery", direction: "inbound", productId: 1, sortBy: "quantity", sortDirection: "asc" });
    expect(stock.items[0]).toMatchObject({ productName: "Atlas Clamp", direction: "inbound" });

    let saleCondition: unknown;
    const saleOffset = vi.fn(async (pageOffset: number) => includesValue(saleCondition, "%walk%") && includesValue(saleCondition, 7) && pageOffset === 0 ? [{ id: 9, reference: "SAL-TEST", customerName: "Walk-in", totalAmount: "39.90", saleDate: new Date(), createdByUserId: 7, staffName: "Query Test" }] : [{ id: 10, reference: "MISMATCH", customerName: "Other", totalAmount: "1.00", saleDate: new Date(), createdByUserId: 7, staffName: "Query Test" }]);
    const saleLimit = vi.fn(() => ({ offset: saleOffset }));
    const saleOrder = vi.fn(() => ({ limit: saleLimit }));
    const saleWhere = vi.fn((next: unknown) => { saleCondition = next; return { orderBy: saleOrder }; });
    state.db = { select: vi.fn().mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: saleWhere }) }) }).mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: vi.fn().mockResolvedValue([{ total: 1 }]) }) }) }) };
    const sales = await appRouter.createCaller(staffContext()).sales.list({ page: 1, pageSize: 5, search: "walk", sortBy: "totalAmount", sortDirection: "desc" });
    expect(sales.items[0]).toMatchObject({ reference: "SAL-TEST", customerName: "Walk-in" });
  });
});
