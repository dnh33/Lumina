import { describe, it, expect } from "vitest";
import {
  SHELF_STATUS_COPY,
  shelfCountLabel,
  shelfStatusAria,
  shelfStatusDetail,
  shelfStatusFromCount,
} from "./worldShelfStatus.js";

describe("worldShelfStatus", () => {
  it("thresholds match niche gate (0 empty, 1–5 sparse, ≥6 filled)", () => {
    expect(shelfStatusFromCount(0)).toBe("empty");
    expect(shelfStatusFromCount(1)).toBe("sparse");
    expect(shelfStatusFromCount(5)).toBe("sparse");
    expect(shelfStatusFromCount(6)).toBe("filled");
  });

  it("never uses bare Empty / Unseeded — shelf vs catalog", () => {
    expect(SHELF_STATUS_COPY.empty).toBe("No shelf");
    expect(shelfCountLabel(0)).toBe("0 on shelf · catalog live");
    expect(shelfStatusDetail(0)).toBe("catalog live");
    expect(shelfStatusAria("empty", 0)).toBe("No shelf, catalog live");
    expect(shelfStatusAria("empty", 0)).not.toMatch(/\bEmpty\b/);
    expect(shelfCountLabel(0)).not.toMatch(/Unseeded/i);
  });

  it("dense / thin shelf whisper for non-zero counts", () => {
    expect(SHELF_STATUS_COPY.sparse).toBe("Thin shelf");
    expect(SHELF_STATUS_COPY.filled).toBe("Dense shelf");
    expect(shelfCountLabel(1)).toBe("1 title on shelf");
    expect(shelfCountLabel(3)).toBe("3 titles on shelf");
    expect(shelfStatusAria("filled", 12)).toBe("Dense shelf, 12 on shelf");
  });
});
