import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CredibilityStrip, type Credibility } from "./CredibilityStrip.js";

const renderStrip = (cred: Credibility, opts?: { item?: any; userRating?: number | null }) =>
  render(<CredibilityStrip cred={cred} {...opts} />);

describe("CredibilityStrip — D5 critic deepen", () => {
  it("flags a Critics split when IMDb and RT diverge by > 1.5", () => {
    renderStrip({ imdbRating: 8.5, rtRating: 6.0 });
    expect(screen.getByText(/Critics split/)).toBeDefined();
    expect(screen.getByText(/IMDb 8\.5/)).toBeDefined();
    expect(screen.getByText(/RT 6/)).toBeDefined();
  });

  it("does NOT flag a split for minor disagreement", () => {
    renderStrip({ imdbRating: 7.8, rtRating: 8.2 });
    expect(screen.queryByText(/Critics split/)).toBeNull();
  });

  it("falls back to imdbRating/rtRating on the item prop", () => {
    renderStrip({}, { item: { imdbRating: 9.1, rtRating: 5.0 } });
    expect(screen.getByText(/Critics split/)).toBeDefined();
    expect(screen.getByText(/IMDb 9\.1/)).toBeDefined();
  });

  it("renders the viewer's own rating overlay as 'You: n'", () => {
    renderStrip({}, { userRating: 9 });
    expect(screen.getByText(/You: 9/)).toBeDefined();
  });

  it("prefers cred.userRating over the page userRating prop", () => {
    renderStrip({ userRating: 7 }, { userRating: 3 });
    expect(screen.getByText(/You: 7/)).toBeDefined();
    expect(screen.queryByText(/You: 3/)).toBeNull();
  });

  it("renders the first provider as a deep-link opening in a new tab", () => {
    const url = "https://example.com/watch";
    renderStrip({ providers: [{ name: "Netflix", url }] });
    const link = screen.getByRole("link", { name: "Netflix" }) as HTMLAnchorElement;
    expect(link).toBeDefined();
    expect(link.href).toBe(url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("derives a provider deep-link from the item's watchProviders", () => {
    const url = "https://www.themoviedb.org/xyz";
    renderStrip(
      {},
      {
        item: {
          enrichment: {
            watchProviders: { link: url, flatrate: [{ name: "Max" }] },
          },
        },
      },
    );
    const link = screen.getByRole("link", { name: "Max" }) as HTMLAnchorElement;
    expect(link.href).toBe(url);
  });

  it("renders nothing when all critic fields are absent", () => {
    const { container } = renderStrip({});
    expect(container.firstChild).toBeNull();
  });
});
