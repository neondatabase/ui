import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("resolves conflicting tailwind classes to the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy and undefined values", () => {
    const hidden: boolean = Math.random() < 0;
    expect(cn("a", hidden && "b", undefined, "c")).toBe("a c");
  });
});
