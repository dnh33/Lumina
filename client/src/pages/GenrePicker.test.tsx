import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import type { GuidedSessionPayload } from "../lib/types.js";

vi.mock("../lib/api.js", () => ({
  api: {
    genres: vi.fn(async () => []),
    library: vi.fn(async () => []),
    guidedSession: vi.fn(),
  },
}));

import GenrePicker from "./GenrePicker.js";

function emptySession(slug: string): GuidedSessionPayload {
  return {
    session: {
      slug,
      mediaType: "movie",
      status: "active",
      answers: {},
      picks: [],
      acted: [],
      conversationId: null,
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:00.000Z",
    },
    beats: [],
  };
}

function progressSession(slug: string): GuidedSessionPayload {
  return {
    ...emptySession(slug),
    session: {
      ...emptySession(slug).session,
      status: "complete",
      answers: { tempo: "slow", era: "classic", risk: "stretch" },
    },
  };
}

function renderPicker() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GenrePicker />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenrePicker Hub Resume chip", () => {
  beforeEach(() => {
    vi.mocked(api.genres).mockResolvedValue([]);
    vi.mocked(api.library).mockResolvedValue([]);
    vi.mocked(api.guidedSession).mockImplementation(async (slug: string) =>
      slug === "horror" ? progressSession("horror") : emptySession(slug),
    );
  });

  it("keeps Enter on Self and shows Resume tour only when Guided progress exists", async () => {
    renderPicker();

    const enterHorror = await screen.findByTestId("enter-horror");
    expect(enterHorror).toHaveAttribute("href", "/genre/horror?mode=self");

    const resume = await screen.findByTestId("resume-tour-horror");
    expect(resume).toHaveAttribute("href", "/genre/horror?mode=guided");
    expect(resume).toHaveTextContent("Resume tour");

    await waitFor(() => {
      expect(screen.queryByTestId("resume-tour-romance")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("enter-romance")).toHaveAttribute(
      "href",
      "/genre/romance?mode=self",
    );
  });
});
