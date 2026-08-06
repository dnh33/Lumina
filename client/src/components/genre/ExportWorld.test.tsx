import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ExportWorld } from "./ExportWorld.js";

const NOTES_KEY = "lumina:notes";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ExportWorld (Task 6.8 / C6)", () => {
  it("saves a Markdown note (hook + titles + annotations) to the notes store", () => {
    render(
      <ExportWorld
        slug="documentary"
        hook="Why documentaries matter"
        titles={[
          { title: "Film A", year: 2010 },
          { title: "Film B", year: 2015 },
        ]}
        annotations={{ 1: "A sharp thesis", 2: "Another thesis" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /save note/i }));

    const raw = localStorage.getItem(NOTES_KEY);
    expect(raw).toBeTruthy();
    const notes = JSON.parse(raw as string);
    expect(Array.isArray(notes)).toBe(true);
    const note = notes[0];
    expect(note.slug).toBe("documentary");
    expect(note.markdown).toContain("Why documentaries matter");
    expect(note.markdown).toContain("Film A");
    expect(note.markdown).toContain("A sharp thesis");
  });

  it("toggles a printable view of the exported world", () => {
    render(
      <ExportWorld
        slug="documentary"
        titles={[{ title: "Film A" }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /printable|preview/i }));
    expect(screen.getByTestId("export-printable")).toBeTruthy();
  });

  it("Save note uses world-accent fill, not brand gold", () => {
    render(
      <ExportWorld slug="horror" titles={[{ title: "Film A" }]} />,
    );
    const save = screen.getByTestId("export-save-note");
    expect(save.className).toMatch(/world-accent-fill/);
    expect(save.className).not.toMatch(/bg-gold-400/);
  });
});
