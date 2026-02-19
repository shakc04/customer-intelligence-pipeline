// Pure utility functions for campaign draft generation.
// All functions operate on already-fetched data, making them testable without a DB.

export interface EventRow {
  type: string;
  properties: unknown;
  occurredAt: Date;
}

/**
 * Returns the sku string from the most recent event (sorted desc) that has
 * a non-empty `properties.sku` string. Returns null if none found.
 */
export function extractRecommendedSku(events: EventRow[]): string | null {
  for (const event of events) {
    const props = event.properties as Record<string, unknown> | null;
    if (props && typeof props.sku === "string" && props.sku.trim() !== "") {
      return props.sku.trim();
    }
  }
  return null;
}

/**
 * Returns the type of the most recent event (first element when sorted desc).
 * Returns undefined if the events array is empty.
 */
export function extractRecentEventType(events: EventRow[]): string | undefined {
  return events[0]?.type;
}
