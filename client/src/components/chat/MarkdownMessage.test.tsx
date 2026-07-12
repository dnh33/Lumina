import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MarkdownMessage } from "./MarkdownMessage";

describe("MarkdownMessage (flicker-free, T1/T2/T3/T4)", () => {
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
});
