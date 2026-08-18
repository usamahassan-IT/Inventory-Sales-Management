import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({ db: null as any }));
vi.mock("./routers/utils", async () => {
  const actual = await vi.importActual<typeof import("./routers/utils")>("./routers/utils");
  return { ...actual, requireDatabase: async () => state.db, getInventorySettings: async () => ({ lowStockThreshold: 10 }) };
});
import { appRouter } from "./routers";

const user = (role: "manager" | "staff"): TrpcContext => ({ user: { id: 11, openId: `sort-${role}`, name: "Sort Test", email: "sort@test.local", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] });

function dualSupplierDb() {
  let call = 0;
  const alpha = { id: 1, name: "Alpha Supply", contactName: null, email: null, phone: null, address: null, productCount: 1, productNames: "Atlas", createdAt: new Date() };
  const zulu = { id: 2, name: "Zulu Supply", contactName: null, email: null, phone: null, address: null, productCount: 1, productNames: "Zenith", createdAt: new Date() };
  const data = (row: typeof alpha) => ({ from: () => ({ leftJoin: () => ({ where: () => ({ groupBy: () => ({ orderBy: () => ({ limit: () => ({ offset: async () => [row] }) }) }) }) }) }) });
  const total = { from: () => ({ leftJoin: () => ({ where: () => ({ groupBy: async () => [{ id: 1 }, { id: 2 }] }) }) }) };
  state.db = { select: vi.fn(() => { call += 1; return call === 1 ? data(alpha) : call === 3 ? data(zulu) : total; }) };
}

function dualStockDb() {
  let call = 0;
  const first = { id: 1, productId: 1, productName: "Atlas", sku: "A-1", direction: "inbound", quantity: 9, reason: "Delivery", quantityBefore: 0, quantityAfter: 9, occurredAt: new Date(), staffName: "Sort Test" };
  const second = { id: 2, productId: 2, productName: "Zenith", sku: "Z-1", direction: "outbound", quantity: 1, reason: "Sale", quantityBefore: 9, quantityAfter: 8, occurredAt: new Date(), staffName: "Sort Test" };
  const data = (row: typeof first) => ({ from: () => ({ innerJoin: () => ({ leftJoin: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: async () => [row] }) }) }) }) }) }) });
  const total = { from: () => ({ innerJoin: () => ({ where: async () => [{ total: 2 }] }) }) };
  state.db = { select: vi.fn(() => { call += 1; return call === 1 ? data(first) : call === 3 ? data(second) : total; }) };
}

function dualSalesDb() {
  let call = 0;
  const first = { id: 1, reference: "SAL-ALPHA", customerName: "Alpha", totalAmount: "10.00", saleDate: new Date(), createdByUserId: 11, staffName: "Sort Test" };
  const second = { id: 2, reference: "SAL-ZULU", customerName: "Zulu", totalAmount: "90.00", saleDate: new Date(), createdByUserId: 11, staffName: "Sort Test" };
  const data = (row: typeof first) => ({ from: () => ({ innerJoin: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: async () => [row] }) }) }) }) }) });
  const total = { from: () => ({ innerJoin: () => ({ where: async () => [{ total: 2 }] }) }) };
  state.db = { select: vi.fn(() => { call += 1; return call === 1 ? data(first) : call === 3 ? data(second) : total; }) };
}

describe("alternate table pages and sorting", () => {
  it("returns different supplier rows for alternate sort and page requests", async () => {
    dualSupplierDb();
    const caller = appRouter.createCaller(user("staff"));
    const ascending = await caller.suppliers.list({ page: 1, pageSize: 5, sortBy: "name", sortDirection: "asc" });
    const descending = await caller.suppliers.list({ page: 2, pageSize: 5, sortBy: "name", sortDirection: "desc" });
    expect([ascending.items[0]?.name, descending.items[0]?.name]).toEqual(["Alpha Supply", "Zulu Supply"]);
  });

  it("returns different stock rows for alternate sort and page requests", async () => {
    dualStockDb();
    const caller = appRouter.createCaller(user("manager"));
    const ascending = await caller.stock.list({ page: 1, pageSize: 5, sortBy: "quantity", sortDirection: "asc" });
    const descending = await caller.stock.list({ page: 2, pageSize: 5, sortBy: "quantity", sortDirection: "desc" });
    expect([ascending.items[0]?.productName, descending.items[0]?.productName]).toEqual(["Atlas", "Zenith"]);
  });

  it("returns different sales rows for alternate sort and page requests", async () => {
    dualSalesDb();
    const caller = appRouter.createCaller(user("staff"));
    const ascending = await caller.sales.list({ page: 1, pageSize: 5, sortBy: "totalAmount", sortDirection: "asc" });
    const descending = await caller.sales.list({ page: 2, pageSize: 5, sortBy: "totalAmount", sortDirection: "desc" });
    expect([ascending.items[0]?.reference, descending.items[0]?.reference]).toEqual(["SAL-ALPHA", "SAL-ZULU"]);
  });
});
