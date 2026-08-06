import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ArgumentPanel } from "./ArgumentPanel.js";

describe("ArgumentPanel", () => {
  const thesis = "A tight, morally grey Western.";

  it("links the counterpoint to /title when tmdbId is present", () => {
    const counterpoint = {
      title: "X",
      relation: "similar",
      tmdbId: 456,
      mediaType: "movie",
    } as any;

    render(
      <MemoryRouter>
        <ArgumentPanel thesis={thesis} counterpoint={counterpoint} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /X/i });
    expect(link).toHaveAttribute("href", "/title/movie/456");
  });

  it("renders the counterpoint as plain text (no link) when tmdbId is absent", () => {
    const counterpoint = {
      title: "Y",
      relation: "contrasts with",
    } as any;

    const { container } = render(
      <MemoryRouter>
        <ArgumentPanel thesis={thesis} counterpoint={counterpoint} />
      </MemoryRouter>,
    );

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("Y", { selector: "span" })).toBeTruthy();
  });
});
