import { MockSmartDraftProvider } from "../smartDraft/mock";

describe("MockSmartDraftProvider", () => {
  const provider = new MockSmartDraftProvider();

  it("returns subject and body with sku and eventType", async () => {
    const result = await provider.generate({
      customerEmail: "alice@example.com",
      recentEventType: "added_to_cart",
      recommendedSku: "WIDGET-42",
    });

    expect(result.subject).toBe("Still thinking about WIDGET-42?");
    expect(result.body).toContain("alice");
    expect(result.body).toContain("added to cart");
    expect(result.body).toContain("WIDGET-42");
  });

  it("returns sku-only copy when eventType is absent", async () => {
    const result = await provider.generate({
      customerEmail: "bob@example.com",
      recommendedSku: "GADGET-7",
    });

    expect(result.subject).toBe("Still thinking about GADGET-7?");
    expect(result.body).toContain("bob");
    expect(result.body).toContain("GADGET-7");
    expect(result.body).not.toContain("added_to_cart");
  });

  it("returns eventType-only copy when sku is absent", async () => {
    const result = await provider.generate({
      customerEmail: "carol@example.com",
      recentEventType: "purchase",
    });

    expect(result.subject).toBe("We have something special for you");
    expect(result.body).toContain("carol");
    expect(result.body).toContain("purchase");
  });

  it("returns generic copy when both sku and eventType are absent", async () => {
    const result = await provider.generate({
      customerEmail: "dave@example.com",
    });

    expect(result.subject).toBe("We have something special for you");
    expect(result.body).toContain("dave");
    expect(result.body).not.toContain("undefined");
    expect(result.body).not.toContain("null");
  });

  it("extracts first name from email address", async () => {
    const result = await provider.generate({
      customerEmail: "first.last@company.org",
    });
    expect(result.body).toContain("first.last");
  });

  it("replaces underscores with spaces in event type", async () => {
    const result = await provider.generate({
      customerEmail: "user@test.com",
      recentEventType: "added_to_cart",
      recommendedSku: "SKU-1",
    });
    expect(result.body).toContain("added to cart");
    expect(result.body).not.toContain("added_to_cart");
  });

  it("treats null sku as absent (falls through to eventType branch)", async () => {
    const result = await provider.generate({
      customerEmail: "user@test.com",
      recentEventType: "page_view",
      recommendedSku: null,
    });
    expect(result.subject).toBe("We have something special for you");
    expect(result.body).toContain("page view");
  });
});
