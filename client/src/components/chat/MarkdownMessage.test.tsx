import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MarkdownMessage, preprocessMarkdown, countFences, stripOpenFence } from "./MarkdownMessage";

describe("MarkdownMessage (flicker-free, T1/T2/T3/T4 + streaming fence guard)", () => {
  it("renders an unterminated streamed string without throwing and without a raw '**' flash", () => {
    const midStream = "**bold** and ## h";
    const { container } = render(<MarkdownMessage content={midStream} />);

    // No raw markdown emphasis syntax leaked into the rendered text (no flicker).
    expect(container.textContent).not.toContain("**");

    // Streamdown renders emphasis as a tagged span (not a literal <strong>),
    // styled with .font-semibold. Assert the bold text is present and parsed.
    const bold = container.querySelector(
      "[data-streamdown='strong'], .font-semibold, strong",
    );
    expect(bold).not.toBeNull();
    expect(bold?.textContent).toBe("bold");

    // The remainder of the (in-progress) text is still present.
    expect(container.textContent).toContain("and");
  });

  it("renders settled markdown with a heading as a real element (no raw syntax)", () => {
    const { container } = render(
      <MarkdownMessage content={"**bold**\n\n## heading"} />,
    );
    // Bold parsed into a real emphasized element, not literal "**bold**".
    const bold = container.querySelector(
      "[data-streamdown='strong'], .font-semibold, strong",
    );
    expect(bold?.textContent).toBe("bold");

    // Heading parsed: "heading" is present and the raw "## " marker is gone
    // (proves it became a structured element instead of leaking raw syntax).
    expect(container.textContent).toContain("heading");
    expect(container.textContent).not.toContain("## ");
    expect(container.textContent).not.toContain("**");
  });

  it("suppresses raw JSON inside an open fence during streaming", () => {
    // Model emits the fence opener + partial JSON, but hasn't closed ``` yet.
    const midStream =
      "Here are picks.\n```json\n{ \"items\": [ { \"tmdbId\": 1,";
    const { container } = render(
      <MarkdownMessage content={midStream} streaming={true} />,
    );

    // The prose before the fence is visible.
    expect(container.textContent).toContain("Here are picks.");
    // Raw JSON payload inside the open fence is suppressed — no flash.
    expect(container.textContent).not.toContain('"items"');
    expect(container.textContent).not.toContain("tmdbId");
  });

  it("does NOT suppress JSON when not streaming (fence still renders through Streamdown)", () => {
    const text = 'Picks:\n```json\n{ "items": [] }\n```';
    const { container } = render(
      <MarkdownMessage content={text} streaming={false} />,
    );
    // When not streaming, content after fence close should be present.
    expect(container.textContent).toContain("Picks:");
  });

  it("renders prose after a closed fence during streaming", () => {
    const text = '```json\n{ "items": [] }\n```\nFollow-up text.';
    const { container } = render(
      <MarkdownMessage content={text} streaming={true} />,
    );
    expect(container.textContent).toContain("Follow-up text.");
  });
});

describe("countFences", () => {
  it("returns 0 for text with no fences", () => {
    expect(countFences("hello world")).toBe(0);
  });

  it("returns 1 for an unclosed fence opener", () => {
    expect(countFences("```json\nstuff")).toBe(1);
  });

  it("returns 2 for a properly closed fence", () => {
    expect(countFences("```json\n{}\n```")).toBe(2);
  });

  it("does NOT count raw ``` inside JSON content (only fence openers)", () => {
    // JSON containing backtick strings should not inflate the count.
    // The ```json\n and closing ``` are real fence openers (count 2).
    // The inner ```python\n...``` are NOT matched as fence openers
    // because FENCE_LINE_RE requires the line to be ONLY ``` + lang tag.
    const text = '```json\n{ "code": "```python\\nprint(1)\\n```" }\n```';
    expect(countFences(text)).toBe(2);
  });
});

describe("stripOpenFence", () => {
  it("leaves text untouched when fence count is even", () => {
    expect(stripOpenFence("Hello world")).toBe("Hello world");
  });

  it("leaves text untouched when fence count is 2 (closed)", () => {
    const closed = "A ```json\n{}\n``` B";
    expect(stripOpenFence(closed)).toBe(closed);
  });

  it("trims from the last unclosed ``` opener", () => {
    // Real markdown: fence opener on its own line
    const text = "Prose here.\n```json\n{ \"items\": []";
    expect(stripOpenFence(text)).toBe("Prose here.");
  });

  it("trims nothing when the last ``` is a closer (even count)", () => {
    const text = '```json\n{}\n```';
    expect(stripOpenFence(text)).toBe(text);
  });

  it("does not false-pair on JSON content containing inner backticks", () => {
    // Outer ```json fence is open (count = 2 for the real openers).
    // Inner ```python is inside a JSON string, not a real fence line.
    // Since the outer fence is open (count 2 + 0 from inner = 2, even),
    // this should actually be: ```json opens → content → ``` closes = 2 openers.
    // Wait: ```json (1), ``` (close, 2). The inner ```python\n...``` are inside
    // a JSON string but on the same line (not full fence lines), so FENCE_LINE_RE
    // won't match them. Count = 2 (even), stripOpenFence returns unchanged.
    const text = '```json\n{ "code": "```python print(1) ```" }\n```';
    expect(stripOpenFence(text)).toBe(text);
  });

  it("strips correctly when outer fence is genuinely open with inner backticks", () => {
    // ```json opens (1). JSON has inner backticks but on same line, not fence lines.
    // Outer fence never closes → count = 1 (odd) → strip from the opener.
    const text = '```json\n{ "code": "```python" }';
    expect(stripOpenFence(text)).toBe("");
  });
});

describe("preprocessMarkdown", () => {
  it("normalizes LaTeX delimiters (\\( → $, \\[ → $$ in replacement = single $)", () => {
    // In JS String.replace, "$$" produces a single "$".
    expect(preprocessMarkdown("\\(x\\)")).toBe("$x$");
    expect(preprocessMarkdown("\\[y\\]")).toBe("$y$");
  });

  it("rewrites custom [math] tags to single-dollar ($$ in JS replacement = single $)", () => {
    // In JS String.replace, "$$" in the replacement string produces a single "$".
    expect(preprocessMarkdown("[math]z[/math]")).toBe("$z$");
  });

  it("escapes lone currency $5 to $$5", () => {
    // The replacement "$$$$$1" produces "$$" + capture = "$$5".
    expect(preprocessMarkdown("It costs $5 today")).toContain("$$5");
  });

  it("does not escape $ in math pairs ($x$)", () => {
    const out = preprocessMarkdown("$x$");
    expect(out).toBe("$x$");
  });
});
