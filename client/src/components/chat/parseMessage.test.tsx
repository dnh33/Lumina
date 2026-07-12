import { describe, it, expect } from "vitest";
import { parseMessage } from "./MessageBubble";

describe("parseMessage — suggestion/chip fences", () => {
  it("extracts items from a plain ```json fence (the reported bug)", () => {
    const content = `Here are picks.

\`\`\`json
{"items":[{"tmdbId":108545,"mediaType":"tv","title":"3 Body Problem","year":2024,"reason":"echoes Devs"}]}
\`\`\``;
    const { text, items, chips } = parseMessage(content);
    expect(items).toHaveLength(1);
    expect(items[0].tmdbId).toBe(108545);
    expect(text).not.toContain("```json");
  });

  it("extracts chips from a plain ```json fence", () => {
    const content = `Thoughts.

\`\`\`json
{"chips":["More like Devs","Avoid cliffhangers"]}
\`\`\``;
    const { chips, items } = parseMessage(content);
    expect(chips).toEqual(["More like Devs", "Avoid cliffhangers"]);
    expect(items).toHaveLength(0);
  });

  it("still handles the lumina-suggestions / lumina-followups tags", () => {
    const content = `\`\`\`lumina-suggestions
{"items":[{"tmdbId":1,"mediaType":"movie","title":"X","year":2020}]}
\`\`\`
\`\`\`lumina-followups
{"chips":["One"]}
\`\`\``;
    const { items, chips } = parseMessage(content);
    expect(items).toHaveLength(1);
    expect(chips).toEqual(["One"]);
  });

  it("leaves non-suggestion ```json fences (real code) untouched", () => {
    const content = `Config:

\`\`\`json
{"theme":"dark","notItems":true}
\`\`\``;
    const { text, items, chips } = parseMessage(content);
    expect(items).toHaveLength(0);
    expect(chips).toHaveLength(0);
    expect(text).toContain("```json");
  });

  it("drops invalid items but keeps valid ones", () => {
    const content = `\`\`\`json
{"items":[{"tmdbId":5,"mediaType":"movie"},{"tmdbId":"bad","mediaType":"tv"},{"title":"no id"}]}
\`\`\``;
    const { items } = parseMessage(content);
    expect(items).toHaveLength(1);
    expect(items[0].tmdbId).toBe(5);
  });

  it("caps chips at 3 and enforces length limit", () => {
    const content = `\`\`\`json
{"chips":["a","b","c","d","this chip is way too long to ever be accepted as a follow-up"]}
\`\`\``;
    const { chips } = parseMessage(content);
    expect(chips).toEqual(["a", "b", "c"]);
  });
});
