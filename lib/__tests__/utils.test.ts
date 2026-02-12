import { normalizeEmail, isValidEmail } from "../utils";

describe("utils", () => {
  describe("normalizeEmail", () => {
    it("converts email to lowercase", () => {
      expect(normalizeEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
    });

    it("trims whitespace", () => {
      expect(normalizeEmail("  test@example.com  ")).toBe("test@example.com");
    });

    it("handles mixed case and whitespace", () => {
      expect(normalizeEmail("  TeSt@ExAmPlE.CoM  ")).toBe("test@example.com");
    });
  });

  describe("isValidEmail", () => {
    it("returns true for valid email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("returns false for email without @", () => {
      expect(isValidEmail("testexample.com")).toBe(false);
    });

    it("returns false for email without domain", () => {
      expect(isValidEmail("test@")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("returns true for email with subdomain", () => {
      expect(isValidEmail("test@mail.example.com")).toBe(true);
    });
  });
});
