import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ConstellationBackdrop } from "./ConstellationBackdrop.js";

describe("ConstellationBackdrop (Task 4.1)", () => {
  it("renders an svg with the constellation testid", () => {
    const { getByTestId } = render(<ConstellationBackdrop accent="#6366f1" />);
    expect(getByTestId("constellation-backdrop")).toBeDefined();
  });

  it("is aria-hidden (purely decorative)", () => {
    const { getByTestId } = render(<ConstellationBackdrop accent="#6366f1" />);
    expect(getByTestId("constellation-backdrop").getAttribute("aria-hidden")).toBe("true");
  });

  it("has no interactive elements (no buttons, links, or inputs)", () => {
    const { container } = render(<ConstellationBackdrop accent="#6366f1" />);
    expect(container.querySelectorAll("button, a, input, [role='button']").length).toBe(0);
  });

  it("does not render any text content (decorative only)", () => {
    const { container } = render(<ConstellationBackdrop accent="#6366f1" />);
    expect(container.textContent).toBe("");
  });
});
