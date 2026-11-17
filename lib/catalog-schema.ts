export type CollectionCategoryOwner = {
  id: string;
  categoryIds?: unknown;
};

export function collectionCategoryIds(collection: CollectionCategoryOwner): string[] {
  if (!Array.isArray(collection.categoryIds)) return [];
  return [...new Set(collection.categoryIds
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean))];
}

export function collectionHasCategory(collection: CollectionCategoryOwner, categoryId: string): boolean {
  return collectionCategoryIds(collection).includes(categoryId);
}

export function productBelongsToCollection(
  product: { categoryId?: unknown; collectionId?: unknown; category?: unknown },
  collection: CollectionCategoryOwner
): boolean {
  return product.collectionId === collection.id &&
    typeof product.categoryId === "string" &&
    collectionHasCategory(collection, product.categoryId);
}

/** A saved record (category or collection) as the sheet/label resolver sees it. */
export type CatalogRecordRef = {
  id: string;
  name?: unknown;
  slug?: unknown;
};

function labelKey(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Resolves an operator-typed label to exactly one saved record: exact ID first,
 * then slug, then case-insensitive name. Ambiguous or unknown labels resolve to
 * `undefined` rather than picking the first match — a wrong-but-plausible
 * assignment is worse than a row error.
 */
export function resolveCatalogRecord<T extends CatalogRecordRef>(
  records: T[],
  value: string
): T | undefined {
  const needle = value.trim();
  if (!needle) return undefined;

  const byId = records.filter((record) => record.id === needle);
  if (byId.length === 1) return byId[0];

  const key = needle.toLowerCase();
  const bySlug = records.filter((record) => labelKey(record.slug) === key);
  if (bySlug.length === 1) return bySlug[0];

  const byName = records.filter((record) => labelKey(record.name) === key);
  return byName.length === 1 ? byName[0] : undefined;
}

/** Display label for a resolved record: canonical name, else its ID. */
export function catalogRecordLabel(record: CatalogRecordRef): string {
  const name = typeof record.name === "string" ? record.name.trim() : "";
  return name || record.id;
}
