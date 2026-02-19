import { MockSmartGenerateProvider } from "../smartGenerate/mock";

describe("MockSmartGenerateProvider", () => {
  const provider = new MockSmartGenerateProvider();

  it("generates event_type_in_last_days for 'added to cart last 7 days'", async () => {
    const result = await provider.generate(
      "Users who added to cart in the last 7 days"
    );
    expect(result.kind).toBe("event_type_in_last_days");
    expect(result.eventType).toBe("added_to_cart");
    expect(result.days).toBe(7);
  });

  it("generates event_property_equals for 'visited /pricing'", async () => {
    const result = await provider.generate(
      "Users who visited /pricing in the last 30 days"
    );
    expect(result.kind).toBe("event_property_equals");
    if (result.kind === "event_property_equals") {
      expect(result.eventType).toBe("page_view");
      expect(result.path).toBe("path");
      expect(result.value).toBe("/pricing");
      expect(result.days).toBe(30);
    }
  });

  it("generates event_count_gte for 'at least 5 purchases'", async () => {
    const result = await provider.generate(
      "Customers with at least 5 purchases in the last 30 days"
    );
    expect(result.kind).toBe("event_count_gte_in_last_days");
    if (result.kind === "event_count_gte_in_last_days") {
      expect(result.eventType).toBe("purchase");
      expect(result.minCount).toBe(5);
      expect(result.days).toBe(30);
    }
  });

  it("generates event_count_gte for '>= 3 page views'", async () => {
    const result = await provider.generate(
      "Users with >= 3 page views last 14 days"
    );
    expect(result.kind).toBe("event_count_gte_in_last_days");
    if (result.kind === "event_count_gte_in_last_days") {
      expect(result.eventType).toBe("page_view");
      expect(result.minCount).toBe(3);
      expect(result.days).toBe(14);
    }
  });

  it("parses 'last week' as 7 days", async () => {
    const result = await provider.generate("Users who signed up last week");
    expect(result.days).toBe(7);
    expect(result.eventType).toBe("signup");
  });

  it("parses 'last month' as 30 days", async () => {
    const result = await provider.generate(
      "Customers who checked out last month"
    );
    expect(result.days).toBe(30);
    expect(result.eventType).toBe("checkout");
  });

  it("defaults to page_view and 30 days for ambiguous prompt", async () => {
    const result = await provider.generate("active users");
    expect(result.eventType).toBe("page_view");
    expect(result.days).toBe(30);
  });
});
