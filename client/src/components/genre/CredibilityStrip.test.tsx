import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CredibilityStrip } from "./CredibilityStrip.js";
import type { Credibility } from "./CredibilityStrip.js";

const renderStrip = (cred: Credibility) =>
  render(<CredibilityStrip cred={cred} />);

describe("CredibilityStrip", () => {
  it("renders the real distributor name, not a fake 'Available' string", () => {
    renderStrip({
      distributor: "Netflix",
      streaming: true,
      consensus: "RT 94%",
      stance: "advocacy",
    });
    expect(screen.getByText(/Distributor: Netflix/)).toBeDefined();
    expect(screen.queryByText("Available")).toBeNull();
    expect(screen.getByText(/RT 94%/)).toBeDefined();
    expect(screen.getByText(/Stance: advocacy/)).toBeDefined();
  });

  it("shows multiple provider names when a distributor list is provided", () => {
    renderStrip({
      distributor: "Netflix, Hulu",
      streaming: true,
      consensus: null,
      stance: null,
    });
    expect(screen.getByText(/Distributor: Netflix, Hulu/)).toBeDefined();
    expect(screen.queryByText("Available")).toBeNull();
  });

  it("renders nothing when no fields are present", () => {
    const { container } = renderStrip({});
    expect(container.firstChild).toBeNull();
  });
});
