import { describe, expect, it } from "vitest";

import { monthCells } from "@/components/date-range-picker/date-range-picker";

// Runs under TZ=America/New_York (see the registry test script). 2026 DST:
// spring forward Mar 8, fall back Nov 1.
const MONTHS = {
  january: new Date(2026, 0, 1),
  march: new Date(2026, 2, 1),
  november: new Date(2026, 10, 1),
};

const nextCalendarDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

describe("monthCells", () => {
  for (const [name, month] of Object.entries(MONTHS)) {
    describe(name, () => {
      const cells = monthCells(month);

      it("returns 42 cells starting on a Monday", () => {
        expect(cells).toHaveLength(42);
        expect(cells[0]?.getDay()).toBe(1);
      });

      it("places every cell at local midnight", () => {
        for (const cell of cells) {
          expect(cell.getHours()).toBe(0);
          expect(cell.getMinutes()).toBe(0);
        }
      });

      it("advances exactly one calendar day per cell", () => {
        for (let i = 1; i < cells.length; i += 1) {
          const expected = nextCalendarDay(cells[i - 1] as Date);
          const cell = cells[i] as Date;
          expect(cell.getFullYear()).toBe(expected.getFullYear());
          expect(cell.getMonth()).toBe(expected.getMonth());
          expect(cell.getDate()).toBe(expected.getDate());
        }
      });

      it("contains the first of the month exactly once", () => {
        const firsts = cells.filter(
          (cell) => cell.getDate() === 1 && cell.getMonth() === month.getMonth()
        );
        expect(firsts).toHaveLength(1);
      });
    });
  }
});
