/**
 * Product content fields that online research is allowed to enrich.
 *
 * Deliberately limited to these three. Ingredients, usage instructions and skin
 * concerns are out of scope for this feature and are never populated.
 */
export interface ProductContentFields {
  description: string | null;
  purpose: string | null;
  benefits: string | null;
}

/** Researched values, any of which may be absent for a given product. */
export type ResearchedProductContent = Partial<ProductContentFields>;

export type ProductContentKey = keyof ProductContentFields;

export const PRODUCT_CONTENT_KEYS: ProductContentKey[] = ['description', 'purpose', 'benefits'];

export interface ContentMergeResult {
  /** Only the fields that should be written, and only when currently empty. */
  updates: Partial<ProductContentFields>;
  /** Fields left untouched because the clinic already has valid content. */
  preserved: ProductContentKey[];
  /** Fields populated from research on this pass. */
  filled: ProductContentKey[];
}

/** A field counts as "empty" when it is null or only whitespace. */
function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}

/**
 * Decide what researched content may be written.
 *
 * The clinic's own content always wins: a field that already holds a value is
 * preserved even when research disagrees, so re-running enrichment can never
 * silently replace approved information. Only empty fields with a non-empty
 * researched value are returned as updates, which makes the enrichment script
 * idempotent and safe to re-run.
 */
export function mergeResearchedContent(
  existing: ProductContentFields,
  researched: ResearchedProductContent,
): ContentMergeResult {
  const updates: Partial<ProductContentFields> = {};
  const preserved: ProductContentKey[] = [];
  const filled: ProductContentKey[] = [];

  for (const key of PRODUCT_CONTENT_KEYS) {
    const current = existing[key];
    const candidate = researched[key];

    if (!isBlank(current)) {
      preserved.push(key);
      continue;
    }

    if (!isBlank(candidate)) {
      updates[key] = candidate!.trim();
      filled.push(key);
    }
  }

  return { updates, preserved, filled };
}
