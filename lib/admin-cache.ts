// Tiny in-memory caches for the admin dashboard so repeated tab loads /
// refreshes within the TTL don't re-read Firestore. Invalidated on write.

type Entry<T> = { at: number; data: T };

const TTL_MS = 30_000;

let orders: Entry<any[]> | null = null;
let refunds: Entry<any[]> | null = null;

export function getCachedOrders(): any[] | null {
  return orders && Date.now() - orders.at < TTL_MS ? orders.data : null;
}

export function setCachedOrders(data: any[]) {
  orders = { at: Date.now(), data };
}

export function clearOrdersCache() {
  orders = null;
}

export function getCachedRefunds(): any[] | null {
  return refunds && Date.now() - refunds.at < TTL_MS ? refunds.data : null;
}

export function setCachedRefunds(data: any[]) {
  refunds = { at: Date.now(), data };
}

export function clearRefundsCache() {
  refunds = null;
}
