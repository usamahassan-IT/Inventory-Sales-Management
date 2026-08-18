import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({ db: null as any }));

vi.mock("./routers/utils", async () => {
  const actual = await vi.importActual<typeof import("./routers/utils")>("./routers/utils");
  return {
    ...actual,
    requireDatabase: async () => state.db,
    getInventorySettings: async () => ({ lowStockThreshold: 10 }),
  };
});

import { appRouter } from "./routers";

function containsQueryValue(value: unknown, expected: unknown, seen = new Set<unknown>()): boolean {
  if (value === expected) return true;
  if (value === null || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  for (const key of Object.keys(value as object)) {
    try {
      if (containsQueryValue((value as Record<string, unknown>)[key], expected, seen)) return true;
    } catch {
      // Some query-builder properties are inaccessible and are not needed for the test assertion.
    }
  }
  return false;
}

function contextFor(role: "admin" | "manager" | "staff"): TrpcContext {
  return {
    user: { id: 42, openId: `live-test-${role}`, name: "Test User", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

function productsListDb() {
  const offset = vi.fn().mockResolvedValue([
    { id: 1, name: "Atlas Clamp", sku: "ATL-1", category: "Hardware", price: "12.00", quantity: 8, supplierId: null, supplierName: null },
    { id: 2, name: "Signal Cable", sku: "SIG-2", category: "Electronics", price: "18.00", quantity: 14, supplierId: null, supplierName: null },
  ]);
  const limit = vi.fn(() => ({ offset }));
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ orderBy }));
  const leftJoin = vi.fn(() => ({ where }));
  const listFrom = vi.fn(() => ({ leftJoin }));
  const totalWhere = vi.fn().mockResolvedValue([{ total: 12 }]);
  const totalFrom = vi.fn(() => ({ where: totalWhere }));
  state.db = { select: vi.fn().mockReturnValueOnce({ from: listFrom }).mockReturnValueOnce({ from: totalFrom }) };
  return { where, orderBy, limit, offset };
}

function stockTransactionDb(quantity: number) {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const movementValues = vi.fn().mockResolvedValue([{ insertId: 7 }]);
  const tx = {
    select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([{ id: 1, name: "Atlas Clamp", quantity }]) }) }) })),
    update: vi.fn(() => ({ set: updateSet })),
    insert: vi.fn(() => ({ values: movementValues })),
  };
  state.db = { transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) };
  return { updateSet, movementValues };
}

function salesTransactionDb(quantity: number) {
  const saleValues = vi.fn().mockResolvedValue([{ insertId: 101 }]);
  const itemValues = vi.fn().mockResolvedValue(undefined);
  const movementValues = vi.fn().mockResolvedValue(undefined);
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const tx = {
    select: vi.fn(() => ({ from: () => ({ where: vi.fn().mockResolvedValue([{ id: 1, name: "Atlas Clamp", sku: "ATL-1", price: "19.95", quantity }]) }) })),
    insert: vi.fn()
      .mockReturnValueOnce({ values: saleValues })
      .mockReturnValueOnce({ values: itemValues })
      .mockReturnValueOnce({ values: movementValues }),
    update: vi.fn(() => ({ set: updateSet })),
  };
  state.db = { transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) };
  return { tx, saleValues, itemValues, movementValues, updateSet };
}

function suppliersListDb() {
  const offset = vi.fn().mockResolvedValue([{ id: 2, name: "Northline Supply", contactName: "Morgan Lee", email: "team@northline.test", phone: "555-0100", address: null, productCount: 2, productNames: "Atlas Clamp, Signal Cable", createdAt: new Date("2026-08-16") }]);
  const limit = vi.fn(() => ({ offset }));
  const orderBy = vi.fn(() => ({ limit }));
  const groupBy = vi.fn(() => ({ orderBy }));
  const where = vi.fn(() => ({ groupBy }));
  const totalGroupBy = vi.fn().mockResolvedValue([{ id: 2 }]);
  const totalWhere = vi.fn(() => ({ groupBy: totalGroupBy }));
  state.db = { select: vi.fn().mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ where }) }) }).mockReturnValueOnce({ from: () => ({ leftJoin: () => ({ where: totalWhere }) }) }) };
  return { where, orderBy, limit, offset };
}

function stockListDb() {
  const offset = vi.fn().mockResolvedValue([{ id: 4, productId: 1, productName: "Atlas Clamp", sku: "ATL-1", direction: "inbound", quantity: 6, reason: "Purchase delivery", quantityBefore: 2, quantityAfter: 8, occurredAt: new Date("2026-08-16"), staffName: "Morgan Lee" }]);
  const limit = vi.fn(() => ({ offset }));
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ orderBy }));
  const totalWhere = vi.fn().mockResolvedValue([{ total: 1 }]);
  state.db = { select: vi.fn().mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ leftJoin: () => ({ where }) }) }) }).mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: totalWhere }) }) }) };
  return { where, orderBy, limit, offset };
}

function salesListDb() {
  const offset = vi.fn().mockResolvedValue([{ id: 9, reference: "SAL-TEST", customerName: "Walk-in", totalAmount: "39.90", saleDate: new Date("2026-08-16"), createdByUserId: 42, staffName: "Test User" }]);
  const limit = vi.fn(() => ({ offset }));
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ orderBy }));
  const totalWhere = vi.fn().mockResolvedValue([{ total: 1 }]);
  state.db = { select: vi.fn().mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where }) }) }).mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: totalWhere }) }) }) };
  return { where, orderBy, limit, offset };
}

describe("live inventory procedures", () => {
  beforeEach(() => { state.db = null; });

  it("applies search, category, low-stock, sorting, and pagination controls in one product-list request", async () => {
    const calls = productsListDb();
    const caller = appRouter.createCaller(contextFor("staff"));
    const result = await caller.products.list({ page: 2, pageSize: 5, search: "atlas", category: "Hardware", lowStockOnly: true, sortBy: "name", sortDirection: "asc" });
    expect(result).toMatchObject({ page: 2, pageSize: 5, total: 12, pageCount: 3, lowStockThreshold: 10 });
    expect(result.items.map(item => item.isLowStock)).toEqual([true, false]);
    expect(calls.where).toHaveBeenCalledOnce();
    expect(calls.orderBy).toHaveBeenCalledOnce();
    expect(calls.limit).toHaveBeenCalledWith(5);
    expect(calls.offset).toHaveBeenCalledWith(5);
    expect(containsQueryValue(calls.where.mock.calls[0][0], "%atlas%")).toBe(true);
    expect(containsQueryValue(calls.where.mock.calls[0][0], "Hardware")).toBe(true);
    expect(containsQueryValue(calls.where.mock.calls[0][0], 10)).toBe(true);
  });

  it("persists a successful inbound stock adjustment with the new available quantity", async () => {
    const operations = stockTransactionDb(8);
    const caller = appRouter.createCaller(contextFor("manager"));
    const result = await caller.stock.create({ productId: 1, direction: "inbound", quantity: 4, reason: "Purchase delivery" });
    expect(result).toEqual({ id: 7, quantityAfter: 12 });
    expect(operations.updateSet).toHaveBeenCalledWith({ quantity: 12 });
    expect(operations.movementValues).toHaveBeenCalledWith(expect.objectContaining({ direction: "inbound", quantity: 4, quantityBefore: 8, quantityAfter: 12, reason: "Purchase delivery" }));
  });

  it("returns supplier, stock, and sales rows under simultaneous table controls", async () => {
    const supplierCalls = suppliersListDb();
    const staff = appRouter.createCaller(contextFor("staff"));
    const suppliers = await staff.suppliers.list({ page: 1, pageSize: 5, search: "north", relationship: "withProducts", sortBy: "name", sortDirection: "asc" });
    expect(suppliers).toMatchObject({ total: 1, page: 1, pageSize: 5, items: [{ name: "Northline Supply", productNames: "Atlas Clamp, Signal Cable", productCount: 2 }] });
    expect(supplierCalls.offset).toHaveBeenCalledWith(0);
    expect(containsQueryValue(supplierCalls.where.mock.calls[0][0], "%north%")).toBe(true);

    const stockCalls = stockListDb();
    const manager = appRouter.createCaller(contextFor("manager"));
    const stock = await manager.stock.list({ page: 1, pageSize: 5, search: "delivery", direction: "inbound", productId: 1, sortBy: "quantity", sortDirection: "asc" });
    expect(stock).toMatchObject({ total: 1, page: 1, pageSize: 5, items: [{ productName: "Atlas Clamp", direction: "inbound", quantity: 6 }] });
    expect(stockCalls.offset).toHaveBeenCalledWith(0);
    expect(containsQueryValue(stockCalls.where.mock.calls[0][0], "%delivery%")).toBe(true);
    expect(containsQueryValue(stockCalls.where.mock.calls[0][0], "inbound")).toBe(true);
    expect(containsQueryValue(stockCalls.where.mock.calls[0][0], 1)).toBe(true);

    const saleCalls = salesListDb();
    const sales = await staff.sales.list({ page: 1, pageSize: 5, search: "walk", staffId: 99, sortBy: "totalAmount", sortDirection: "desc" });
    expect(sales).toMatchObject({ total: 1, page: 1, pageSize: 5, items: [{ reference: "SAL-TEST", totalAmount: "39.90", createdByUserId: 42 }] });
    expect(saleCalls.offset).toHaveBeenCalledWith(0);
    expect(containsQueryValue(saleCalls.where.mock.calls[0][0], "%walk%")).toBe(true);
    expect(containsQueryValue(saleCalls.where.mock.calls[0][0], 42)).toBe(true);
  });

  it("persists a sale, reduces stock, and rejects an insufficient-inventory transaction", async () => {
    const operations = salesTransactionDb(5);
    const caller = appRouter.createCaller(contextFor("staff"));
    const result = await caller.sales.create({ customerName: "Walk-in", items: [{ productId: 1, quantity: 2 }] });
    expect(result).toMatchObject({ id: 101, totalAmount: 39.9 });
    expect(operations.itemValues).toHaveBeenCalledWith([expect.objectContaining({ productId: 1, quantity: 2, unitPrice: "19.95", totalAmount: "39.90" })]);
    expect(operations.updateSet).toHaveBeenCalledWith({ quantity: 3 });
    expect(operations.movementValues).toHaveBeenCalledWith(expect.objectContaining({ productId: 1, direction: "outbound", quantity: 2, quantityBefore: 5, quantityAfter: 3 }));

    const constrained = salesTransactionDb(1);
    await expect(caller.sales.create({ items: [{ productId: 1, quantity: 2 }] })).rejects.toThrow("insufficient available stock");
    expect(constrained.tx.insert).not.toHaveBeenCalled();
  });
});
