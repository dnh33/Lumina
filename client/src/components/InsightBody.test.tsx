import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InsightBody } from "./InsightBody";
import type { TitleInsight } from "../lib/types";

function renderBody(insight: TitleInsight) {
  const onRegenerate = vi.fn();
  const onFollowup = vi.fn();
  render(
    <MemoryRouter>
      <InsightBody
        insight={insight}
        onRegenerate={onRegenerate}
        onFollowup={onFollowup}
      />
    </MemoryRouter>,
  );
  return { onRegenerate, onFollowup };
}

const richInsight: TitleInsight = {
  text: "Your rapture for Severance signals this is squarely your taste.",
  verdict: "maybe",
  matchScore: 62,
  comparisons: [
    {
      tmdbId: 1,
      mediaType: "tv",
      title: "Severance",
      year: 2022,
      relation: "echoes",
      note: "same identity pull",
    },
  ],
  hook: "Garland's existential inquiry may win you over.",
  followups: [
    { label: "Compare to my favorites", prefill: "how does it compare?" },
  ],
  profileState: "rich",
  cached: false,
  model: "x",
};

describe("InsightBody", () => {
  it("renders verdict, comparison link, and followup", () => {
    renderBody(richInsight);
    expect(screen.getByText("Maybe")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Severance/ });
    expect(link).toHaveAttribute("href", "/title/tv/1");
    expect(screen.getByText(/Garland's existential inquiry/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Compare to my favorites/ }),
    ).toBeInTheDocument();
  });

  it("renders the match score", () => {
    renderBody(richInsight);
    expect(screen.getByText("Match 62")).toBeInTheDocument();
  });

  it("fires onFollowup when a follow-up chip is clicked", () => {
    const { onFollowup } = renderBody(richInsight);
    screen.getByRole("button", { name: /Compare to my favorites/ }).click();
    expect(onFollowup).toHaveBeenCalledWith("how does it compare?");
  });

  it("old prose-only insight still renders (defaults)", () => {
    renderBody({
      text: "plain prose",
      cached: false,
      model: "x",
    } as TitleInsight);
    expect(screen.getByText("plain prose")).toBeInTheDocument();
    // verdict defaults to Maybe
    expect(screen.getByText("Maybe")).toBeInTheDocument();
  });

  it("splits paragraphs and renders **titles** as links (or emphasis when unknown)", () => {
    const { container } = render(
      <MemoryRouter>
        <InsightBody
          insight={{
            ...richInsight,
            text: "Your rapture for **Severance** signals this fits.\n\nA second paragraph praising **Unknown Film** at length.",
          }}
          onRegenerate={() => {}}
          onFollowup={() => {}}
        />
      </MemoryRouter>,
    );
    const prose = container.querySelector("[data-testid='insight-prose']")!;
    // two paragraphs, no raw asterisks leaked
    expect(prose.querySelectorAll("p")).toHaveLength(2);
    expect(prose.textContent).not.toContain("**");
    // known comparison title → in-prose link to its page
    const proseLinks = prose.querySelectorAll("a[href='/title/tv/1']");
    expect(proseLinks).toHaveLength(1);
    expect(proseLinks[0].textContent).toBe("Severance");
    // unmatched marked title → quiet emphasis, not a link
    const strong = prose.querySelector("strong");
    expect(strong?.textContent).toBe("Unknown Film");
  });

  it("omits comparison links when none present", () => {
    const { container: withOne } = render(
      <MemoryRouter>
        <InsightBody
          insight={richInsight}
          onRegenerate={() => {}}
          onFollowup={() => {}}
        />
      </MemoryRouter>,
    );
    expect(withOne.querySelectorAll('a[href^="/title/"]')).toHaveLength(1);

    const { container: withNone } = render(
      <MemoryRouter>
        <InsightBody
          insight={{ ...richInsight, comparisons: [] }}
          onRegenerate={() => {}}
          onFollowup={() => {}}
        />
      </MemoryRouter>,
    );
    expect(withNone.querySelector('a[href^="/title/"]')).toBeNull();
  });
});
