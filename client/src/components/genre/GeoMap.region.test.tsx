import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GeoMap } from "./GeoMap.js";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("GeoMap region (Task 6.2 / D4)", () => {
  it("resolves an ISO 3166-1 alpha-2 code to its country name when name is absent", () => {
    render(<GeoMap regions={[{ code: "JP", name: "", count: 3 }]} />);
    // countryName("JP") === "Japan" via Intl.DisplayNames fallback
    expect(screen.getByText("Japan")).toBeTruthy();
  });

  it("renders a region-vs-world comparison against the user's library countries", () => {
    render(
      <GeoMap
        regions={[
          { code: "US", name: "United States", count: 3 },
          { code: "FR", name: "France", count: 2 },
        ]}
        libraryCountries={["US", "GB"]}
      />,
    );
    // comparison section frames the item's origin against the user's library
    expect(screen.getByText(/in your library/i)).toBeTruthy();
    // FR is new to the user (not in their library of US/GB)
    expect(screen.getByText(/new to you/i)).toBeTruthy();
    expect(screen.getByText("France")).toBeTruthy();
  });

  it("renders nothing when there are no regions", () => {
    const { container } = render(<GeoMap regions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
