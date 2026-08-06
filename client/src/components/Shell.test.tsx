import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Shell } from "./Shell";

function renderShell(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Shell>
        <div>page</div>
      </Shell>
    </MemoryRouter>,
  );
}

describe("Shell chat nav label (T7 — one companion verb)", () => {
  it("on /genre/:slug labels chat nav Archive chat, still links to /chat", () => {
    renderShell("/genre/horror");

    const links = screen.getAllByRole("link", { name: /archive chat/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/chat");
    }
    expect(screen.queryByRole("link", { name: /^companion$/i })).toBeNull();
  });

  it("off genre slug keeps Companion label", () => {
    renderShell("/library");

    const links = screen.getAllByRole("link", { name: /^companion$/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("link", { name: /archive chat/i })).toBeNull();
  });

  it("on Worlds hub /genre keeps Companion (Archive chat is in-world only)", () => {
    renderShell("/genre");

    expect(screen.getAllByRole("link", { name: /^companion$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("link", { name: /archive chat/i })).toBeNull();
  });
});
