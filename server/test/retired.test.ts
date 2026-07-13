import { describe, it, expect } from "vitest";
import { memoryDb, seedEntry } from "./helpers.js";
import { setRetired } from "../src/services/anchorService.js";
import { listRetiredAnchors } from "../src/services/libraryService.js";

describe("retired anchors", () => {
  it("lists retired anchor titles for management", () => {
    const db = memoryDb();
    const libId = seedEntry(db, { tmdbId: 9, mediaType: "movie", title: "LOTR" }, { rating: 10, favorite: true });
    seedEntry(db, { tmdbId: 10, mediaType: "movie", title: "NotRetired" }, { rating: 10, favorite: true });

    // nothing retired yet
    expect(listRetiredAnchors(db)).toHaveLength(0);

    setRetired(db, libId, true);
    const retired = listRetiredAnchors(db);
    expect(retired).toHaveLength(1);
    expect(retired[0].title).toBe("LOTR");
    expect(retired[0].tmdbId).toBe(9);
    expect(retired[0].mediaType).toBe("movie");
    expect(typeof retired[0].id).toBe("number");
  });
});
