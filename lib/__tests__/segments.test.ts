import { validateSegmentDefinition } from "../segments";

describe("validateSegmentDefinition", () => {
  describe("general validation", () => {
    it("rejects null", () => {
      const result = validateSegmentDefinition(null);
      expect(result.valid).toBe(false);
    });

    it("rejects array", () => {
      const result = validateSegmentDefinition([]);
      expect(result.valid).toBe(false);
    });

    it("rejects string", () => {
      const result = validateSegmentDefinition("not an object");
      expect(result.valid).toBe(false);
    });

    it("rejects object without kind", () => {
      const result = validateSegmentDefinition({ eventType: "purchase" });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain("kind");
    });

    it("rejects unknown kind", () => {
      const result = validateSegmentDefinition({
        kind: "unknown_rule",
        eventType: "purchase",
        days: 7,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain("Unknown");
    });
  });

  describe("event_type_in_last_days", () => {
    it("accepts valid definition", () => {
      const result = validateSegmentDefinition({
        kind: "event_type_in_last_days",
        eventType: "purchase",
        days: 30,
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.definition.kind).toBe("event_type_in_last_days");
        expect(result.definition.eventType).toBe("purchase");
        expect(result.definition.days).toBe(30);
      }
    });

    it("trims eventType", () => {
      const result = validateSegmentDefinition({
        kind: "event_type_in_last_days",
        eventType: "  purchase  ",
        days: 7,
      });
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.definition.eventType).toBe("purchase");
    });

    it("rejects empty eventType", () => {
      const result = validateSegmentDefinition({
        kind: "event_type_in_last_days",
        eventType: "",
        days: 7,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects zero days", () => {
      const result = validateSegmentDefinition({
        kind: "event_type_in_last_days",
        eventType: "purchase",
        days: 0,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects negative days", () => {
      const result = validateSegmentDefinition({
        kind: "event_type_in_last_days",
        eventType: "purchase",
        days: -5,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects float days", () => {
      const result = validateSegmentDefinition({
        kind: "event_type_in_last_days",
        eventType: "purchase",
        days: 7.5,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("event_property_equals", () => {
    it("accepts valid definition", () => {
      const result = validateSegmentDefinition({
        kind: "event_property_equals",
        eventType: "page_view",
        path: "path",
        value: "/pricing",
        days: 7,
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.definition.kind).toBe("event_property_equals");
        expect(result.definition.path).toBe("path");
        expect(result.definition.value).toBe("/pricing");
      }
    });

    it("rejects missing path", () => {
      const result = validateSegmentDefinition({
        kind: "event_property_equals",
        eventType: "page_view",
        value: "/pricing",
        days: 7,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects empty path", () => {
      const result = validateSegmentDefinition({
        kind: "event_property_equals",
        eventType: "page_view",
        path: "  ",
        value: "/pricing",
        days: 7,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects non-string value", () => {
      const result = validateSegmentDefinition({
        kind: "event_property_equals",
        eventType: "page_view",
        path: "path",
        value: 123,
        days: 7,
      });
      expect(result.valid).toBe(false);
    });

    it("allows empty string value", () => {
      const result = validateSegmentDefinition({
        kind: "event_property_equals",
        eventType: "page_view",
        path: "path",
        value: "",
        days: 7,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("event_count_gte_in_last_days", () => {
    it("accepts valid definition", () => {
      const result = validateSegmentDefinition({
        kind: "event_count_gte_in_last_days",
        eventType: "page_view",
        days: 7,
        minCount: 3,
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.definition.kind).toBe("event_count_gte_in_last_days");
        expect(result.definition.minCount).toBe(3);
      }
    });

    it("rejects zero minCount", () => {
      const result = validateSegmentDefinition({
        kind: "event_count_gte_in_last_days",
        eventType: "page_view",
        days: 7,
        minCount: 0,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects negative minCount", () => {
      const result = validateSegmentDefinition({
        kind: "event_count_gte_in_last_days",
        eventType: "page_view",
        days: 7,
        minCount: -1,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects float minCount", () => {
      const result = validateSegmentDefinition({
        kind: "event_count_gte_in_last_days",
        eventType: "page_view",
        days: 7,
        minCount: 2.5,
      });
      expect(result.valid).toBe(false);
    });

    it("rejects missing minCount", () => {
      const result = validateSegmentDefinition({
        kind: "event_count_gte_in_last_days",
        eventType: "page_view",
        days: 7,
      });
      expect(result.valid).toBe(false);
    });
  });
});
