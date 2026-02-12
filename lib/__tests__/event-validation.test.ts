import { isValidEmail } from "../utils";

describe("Event Validation", () => {
  describe("Email validation for events", () => {
    it("rejects invalid email format", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("missing@domain")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("accepts valid email format", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user@subdomain.example.com")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
    });
  });

  describe("Event type validation", () => {
    it("validates event type is non-empty string", () => {
      const isValidEventType = (type: unknown): boolean => {
        return typeof type === "string" && type.trim() !== "";
      };

      expect(isValidEventType("page_view")).toBe(true);
      expect(isValidEventType("add_to_cart")).toBe(true);
      expect(isValidEventType("purchase")).toBe(true);
      expect(isValidEventType("")).toBe(false);
      expect(isValidEventType("   ")).toBe(false);
      expect(isValidEventType(123)).toBe(false);
      expect(isValidEventType(null)).toBe(false);
      expect(isValidEventType(undefined)).toBe(false);
    });
  });

  describe("Properties validation", () => {
    it("validates properties is an object", () => {
      const isValidProperties = (properties: unknown): boolean => {
        return (
          typeof properties === "object" &&
          properties !== null &&
          !Array.isArray(properties)
        );
      };

      expect(isValidProperties({ page: "/home" })).toBe(true);
      expect(isValidProperties({})).toBe(true);
      expect(isValidProperties({ nested: { key: "value" } })).toBe(true);
      expect(isValidProperties(null)).toBe(false);
      expect(isValidProperties([])).toBe(false);
      expect(isValidProperties("string")).toBe(false);
      expect(isValidProperties(123)).toBe(false);
    });
  });
});

// Note: Idempotency is tested at the integration level via Playwright e2e tests
// since it requires database state and API interaction.
