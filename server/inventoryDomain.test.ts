import { describe, expect, it } from "vitest";
import { canFulfilQuantity, isLowStock, lineTotal, quantityAfterMovement, saleTotal } from "./inventoryDomain";
import { pageResult } from "./routers/utils";

describe("inventory domain safeguards", () => {
  it("flags quantities at or below the configured low-stock threshold", () => {
    expect(isLowStock(10, 10)).toBe(true);
    expect(isLowStock(9, 10)).toBe(true);
    expect(isLowStock(11, 10)).toBe(false);
  });

  it("calculates inbound and outbound adjustments while exposing an invalid negative balance", () => {
    expect(quantityAfterMovement(8, "inbound", 5)).toBe(13);
    expect(quantityAfterMovement(8, "outbound", 5)).toBe(3);
    expect(quantityAfterMovement(3, "outbound", 5)).toBe(-2);
  });

  it("protects sales against insufficient stock and maintains currency precision", () => {
    expect(canFulfilQuantity(7, 7)).toBe(true);
    expect(canFulfilQuantity(6, 7)).toBe(false);
    expect(lineTotal(19.995, 2)).toBe(39.99);
    expect(saleTotal([{ totalAmount: 19.99 }, { totalAmount: 0.01 }])).toBe(20);
  });

  it("returns stable simultaneous pagination metadata for filtered and sorted lists", () => {
    const result = pageResult([{ id: 1 }, { id: 2 }], 22, 2, 10);
    expect(result).toEqual({ items: [{ id: 1 }, { id: 2 }], total: 22, page: 2, pageSize: 10, pageCount: 3 });
  });
});
