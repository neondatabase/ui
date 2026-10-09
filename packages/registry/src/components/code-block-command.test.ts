import { describe, expect, it } from "vitest";

import {
  getNextPackageManager,
  type PackageManager,
} from "@/components/code-block-command";

describe("getNextPackageManager", () => {
  const managers: PackageManager[] = ["pnpm", "yarn", "npm", "bun", "shadcn"];

  it("navigates forward with ArrowRight", () => {
    const next = getNextPackageManager(managers, 0, "ArrowRight");
    expect(next).toEqual({ index: 1, manager: "yarn" });
  });

  it("wraps around to the first item when pressing ArrowRight on the last item", () => {
    const next = getNextPackageManager(managers, 4, "ArrowRight");
    expect(next).toEqual({ index: 0, manager: "pnpm" });
  });

  it("navigates backward with ArrowLeft", () => {
    const next = getNextPackageManager(managers, 2, "ArrowLeft");
    expect(next).toEqual({ index: 1, manager: "yarn" });
  });

  it("wraps around to the last item when pressing ArrowLeft on the first item", () => {
    const next = getNextPackageManager(managers, 0, "ArrowLeft");
    expect(next).toEqual({ index: 4, manager: "shadcn" });
  });

  it("jumps to the first item with Home", () => {
    const next = getNextPackageManager(managers, 3, "Home");
    expect(next).toEqual({ index: 0, manager: "pnpm" });
  });

  it("jumps to the last item with End", () => {
    const next = getNextPackageManager(managers, 1, "End");
    expect(next).toEqual({ index: 4, manager: "shadcn" });
  });

  it("handles negative current index safely", () => {
    expect(getNextPackageManager(managers, -1, "ArrowRight")).toEqual({
      index: 0,
      manager: "pnpm",
    });
    expect(getNextPackageManager(managers, -1, "ArrowLeft")).toEqual({
      index: 4,
      manager: "shadcn",
    });
  });

  it("returns null for unsupported keys", () => {
    expect(getNextPackageManager(managers, 0, "Tab")).toBeNull();
    expect(getNextPackageManager(managers, 0, "Enter")).toBeNull();
    expect(getNextPackageManager(managers, 0, " ")).toBeNull();
    expect(getNextPackageManager(managers, 0, "ArrowDown")).toBeNull();
    expect(getNextPackageManager(managers, 0, "ArrowUp")).toBeNull();
  });

  it("returns null when available list is empty or has a single manager", () => {
    expect(getNextPackageManager([], 0, "ArrowRight")).toBeNull();
    expect(getNextPackageManager(["pnpm"], 0, "ArrowRight")).toBeNull();
    expect(getNextPackageManager(["pnpm"], 0, "Home")).toBeNull();
  });

  it("navigates correctly with a custom subset of package managers", () => {
    const subset: PackageManager[] = ["yarn", "bun"];
    expect(getNextPackageManager(subset, 0, "ArrowRight")).toEqual({
      index: 1,
      manager: "bun",
    });
    expect(getNextPackageManager(subset, 1, "ArrowRight")).toEqual({
      index: 0,
      manager: "yarn",
    });
    expect(getNextPackageManager(subset, 0, "ArrowLeft")).toEqual({
      index: 1,
      manager: "bun",
    });
  });
});
