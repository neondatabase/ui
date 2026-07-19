import { describe, expect, it } from "vitest";

import { scorePassword, validateEmail } from "@/components/auth-form/auth-form";

describe("validateEmail", () => {
  it("requires a value", () => {
    expect(validateEmail("")).toBe("Add your email.");
  });

  it("accepts a well-formed address", () => {
    expect(validateEmail("a@b.co")).toBeNull();
  });

  it("rejects a missing domain shape", () => {
    expect(validateEmail("nope")).toBe("Not a valid email.");
  });

  it("rejects an address with no dotted domain", () => {
    // EMAIL_SHAPE requires \S+@\S+\.\S+, so "a@b" has no dot after @.
    expect(validateEmail("a@b")).toBe("Not a valid email.");
  });
});

describe("scorePassword", () => {
  it("scores an empty password as zero", () => {
    expect(scorePassword("")).toBe(0);
  });

  it("scores length-only credit", () => {
    expect(scorePassword("aaaaaaaa")).toBe(1);
  });

  it("scores all five criteria", () => {
    expect(scorePassword("Aaaaaaa1!aaa")).toBe(5);
  });

  it("increases with more criteria met", () => {
    expect(scorePassword("Aa1!aaaa")).toBeGreaterThan(
      scorePassword("aaaaaaaa")
    );
  });
});
