export type StockDirection = "inbound" | "outbound";

export function isLowStock(quantity: number, threshold: number) {
  return quantity <= threshold;
}

export function quantityAfterMovement(currentQuantity: number, direction: StockDirection, amount: number) {
  return direction === "inbound" ? currentQuantity + amount : currentQuantity - amount;
}

export function canFulfilQuantity(availableQuantity: number, requestedQuantity: number) {
  return availableQuantity >= requestedQuantity;
}

export function lineTotal(unitPrice: number, quantity: number) {
  return Number((unitPrice * quantity).toFixed(2));
}

export function saleTotal(lines: Array<{ totalAmount: number }>) {
  return Number(lines.reduce((total, line) => total + line.totalAmount, 0).toFixed(2));
}
