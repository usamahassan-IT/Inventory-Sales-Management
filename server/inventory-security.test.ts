import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "admin" | "manager" | "staff"): TrpcContext {
  return {
    user: {
      id: 42,
      openId: `test-${role}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("inventory role protection", () => {
  it("blocks staff from creating catalogue products", async () => {
    const caller = appRouter.createCaller(contextFor("staff"));
    await expect(caller.products.create({ name: "Widget", sku: "WID-1", category: "Tools", price: 12.5, quantity: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks managers from changing administrator-only low-stock settings", async () => {
    const caller = appRouter.createCaller(contextFor("manager"));
    await expect(caller.settings.update({ lowStockThreshold: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates a sales transaction before accessing inventory", async () => {
    const caller = appRouter.createCaller(contextFor("staff"));
    await expect(caller.sales.create({ customerName: "", items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects invalid stock movement quantities before mutating inventory", async () => {
    const caller = appRouter.createCaller(contextFor("manager"));
    await expect(caller.stock.create({ productId: 1, direction: "inbound", quantity: 0, reason: "Invalid test movement" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks staff from creating supplier records", async () => {
    const caller = appRouter.createCaller(contextFor("staff"));
    await expect(caller.suppliers.create({ name: "Northline Supply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
