import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TopicCluster, type TopicSpine } from "./TopicCluster.js";
import { GenreModules } from "./GenreModules.js";
import type { CatalogItem } from "../../lib/types.js";

const qc = new QueryClient();

const mkItem = (tmdbId: number, title: string, genreId: number): CatalogItem => ({
  tmdbId,
  mediaType: "movie",
  title,
  year: 2010,
  overview: "",
  posterPath: null,
  backdropPath: null,
  voteAverage: 7,
  genreIds: [genreId],
  popularity: 1,
  inLibrary: false,
});

const topics: TopicSpine[] = [
  { id: 99, label: "Documentary", items: [mkItem(1, "Doc A", 99), mkItem(2, "Doc B", 99)] },
  { id: 878, label: "Science Fiction", items: [mkItem(3, "Sci C", 878)] },
];

describe("TopicCluster axis (D7)", () => {
  it("calls onTopicSelect with the topic id when a spine is clicked", () => {
    const onTopicSelect = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TopicCluster topics={topics} onTopicSelect={onTopicSelect} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    screen.getByRole("button", { name: "Documentary" }).click();
    expect(onTopicSelect).toHaveBeenCalledTimes(1);
    expect(onTopicSelect).toHaveBeenCalledWith(99);
  });

  it("emits the correct topic id for each spine", () => {
    const onTopicSelect = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TopicCluster topics={topics} onTopicSelect={onTopicSelect} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    screen.getByRole("button", { name: "Science Fiction" }).click();
    expect(onTopicSelect).toHaveBeenCalledWith(878);
  });

  it("renders non-clickable headings when onTopicSelect is omitted", () => {
    const onTopicSelect = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TopicCluster topics={topics} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Documentary" })).toBeNull();
    expect(screen.getByText("Documentary")).toBeDefined();
    // no callbacks fired when there's no handler
    expect(onTopicSelect).not.toHaveBeenCalled();
  });

  it("GenreModules forwards spine clicks to onTopicSelect", () => {
    const onTopicSelect = vi.fn();
    const items = [
      mkItem(1, "Doc A", 99),
      mkItem(2, "Doc B", 99),
      mkItem(3, "Sci C", 878),
    ];
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules modules={["topic"]} items={items} onTopicSelect={onTopicSelect} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    screen.getByRole("button", { name: "Documentary" }).click();
    expect(onTopicSelect).toHaveBeenCalledWith(99);
  });
});
