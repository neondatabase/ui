import { describe, expect, it } from "vitest";

import { hexToHsv, hsvToHex } from "@/components/color-picker/color-picker";

describe("hexToHsv / hsvToHex", () => {
  it("round-trips known hex values", () => {
    for (const hex of ["#00e599", "#ffffff", "#000000", "#ff0000", "#3b82f6"]) {
      const hsv = hexToHsv(hex);
      expect(hsv).not.toBeNull();
      expect(hsvToHex(hsv as NonNullable<typeof hsv>)).toBe(hex);
    }
  });

  it("anchors primary hues", () => {
    expect(hexToHsv("#ff0000")?.h).toBe(0);
    expect(hexToHsv("#00ff00")?.h).toBe(120);
    expect(hexToHsv("#0000ff")?.h).toBe(240);
  });

  it("reports zero saturation for grayscale", () => {
    expect(hexToHsv("#808080")?.s).toBe(0);
  });

  it("treats the leading # as optional", () => {
    expect(hexToHsv("00e599")).not.toBeNull();
  });

  it("returns null for anything that is not a 6-digit hex", () => {
    for (const bad of ["", "#fff", "#gggggg", "not a color", "#00e5991"]) {
      expect(hexToHsv(bad)).toBeNull();
    }
  });
});
