import {
  extractRecommendedSku,
  extractRecentEventType,
  type EventRow,
} from "../campaignUtils";

describe("extractRecommendedSku", () => {
  it("returns null for empty events", () => {
    expect(extractRecommendedSku([])).toBeNull();
  });

  it("returns null when no event has a sku property", () => {
    const events: EventRow[] = [
      {
        type: "page_view",
        properties: { path: "/home" },
        occurredAt: new Date(),
      },
      { type: "purchase", properties: { total: 99 }, occurredAt: new Date() },
    ];
    expect(extractRecommendedSku(events)).toBeNull();
  });

  it("returns sku from the first event that has it", () => {
    const events: EventRow[] = [
      { type: "page_view", properties: {}, occurredAt: new Date() },
      {
        type: "added_to_cart",
        properties: { sku: "WIDGET-42" },
        occurredAt: new Date(),
      },
      {
        type: "added_to_cart",
        properties: { sku: "GADGET-7" },
        occurredAt: new Date(),
      },
    ];
    expect(extractRecommendedSku(events)).toBe("WIDGET-42");
  });

  it("skips events where sku is an empty string", () => {
    const events: EventRow[] = [
      { type: "page_view", properties: { sku: "" }, occurredAt: new Date() },
      {
        type: "added_to_cart",
        properties: { sku: "  " },
        occurredAt: new Date(),
      },
      {
        type: "added_to_cart",
        properties: { sku: "REAL-SKU" },
        occurredAt: new Date(),
      },
    ];
    expect(extractRecommendedSku(events)).toBe("REAL-SKU");
  });

  it("ignores sku when properties is null", () => {
    const events: EventRow[] = [
      { type: "page_view", properties: null, occurredAt: new Date() },
      {
        type: "added_to_cart",
        properties: { sku: "SKU-1" },
        occurredAt: new Date(),
      },
    ];
    expect(extractRecommendedSku(events)).toBe("SKU-1");
  });

  it("ignores sku when it is not a string", () => {
    const events: EventRow[] = [
      { type: "click", properties: { sku: 123 }, occurredAt: new Date() },
      {
        type: "view",
        properties: { sku: "STRING-SKU" },
        occurredAt: new Date(),
      },
    ];
    expect(extractRecommendedSku(events)).toBe("STRING-SKU");
  });

  it("trims whitespace from sku", () => {
    const events: EventRow[] = [
      {
        type: "view",
        properties: { sku: "  TRIMMED  " },
        occurredAt: new Date(),
      },
    ];
    expect(extractRecommendedSku(events)).toBe("TRIMMED");
  });
});

describe("extractRecentEventType", () => {
  it("returns undefined for empty events", () => {
    expect(extractRecentEventType([])).toBeUndefined();
  });

  it("returns the type of the first (most recent) event", () => {
    const events: EventRow[] = [
      { type: "page_view", properties: {}, occurredAt: new Date() },
      { type: "purchase", properties: {}, occurredAt: new Date() },
    ];
    expect(extractRecentEventType(events)).toBe("page_view");
  });

  it("returns the only event type when there is one event", () => {
    const events: EventRow[] = [
      { type: "added_to_cart", properties: {}, occurredAt: new Date() },
    ];
    expect(extractRecentEventType(events)).toBe("added_to_cart");
  });
});
