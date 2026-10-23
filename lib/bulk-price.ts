export type PriceDirection = "increase" | "decrease";

export function calculateBulkPrice(
  basePrice: number,
  percentage: number,
  direction: PriceDirection
): number {
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error("Base price must be greater than zero");
  }
  if (!Number.isFinite(percentage) || percentage < 0) {
    throw new Error("Percentage must be a non-negative number");
  }
  if (direction !== "increase" && direction !== "decrease") {
    throw new Error("Invalid price direction");
  }
  if (direction === "decrease" && percentage > 100) {
    throw new Error("Decrease percentage cannot exceed 100");
  }

  const multiplier = direction === "increase" ? 1 + percentage / 100 : 1 - percentage / 100;
  return Math.round(basePrice * multiplier);
}
