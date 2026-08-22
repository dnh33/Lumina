import { describe, expect, it, afterEach, vi, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { CompanionState } from "../../hooks/useCompanionState";
import type { StreamState, TurnPhase } from "./useChat";
import type { ComponentProps } from "react";

const { mockUseChat } = vi.hoisted(() => ({
  mockUseChat: vi.fn(),
}));

vi.mock("./useChat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./useChat")>();
  return {
    ...actual,
    useChat: mockUseChat,
  };
});

vi.mock("../../lib/api", () => ({
  api: {
    health: vi.fn(async () => ({ aiConfigured: true })),
    createConversation: vi.fn(),
  },
}));

import { ChatThread } from "./ChatThread";
import { api } from "../../lib/api";

afterEach(() => {
  cleanup();
});

function companionFor(phase: TurnPhase): CompanionState {
  if (phase === "tooling") return "tooling";
  if (phase === "writing") return "writing";
  return "thinking";
}

function makeStream(overrides: Partial<StreamState> = {}): StreamState {
  return {
    userText: "what should I watch?",
    assistantText: "",
    phase: "thinking",
    steps: [],
    receipts: [],
    contextNote: null,
    stopping: false,
    ...overrides,
  };
}

function seedChat(opts: {
  phase: TurnPhase;
  streamedText?: string;
  assistantText?: string;
}) {
  const stream = makeStream({
    phase: opts.phase,
    assistantText: opts.assistantText ?? "",
  });
  mockUseChat.mockReturnValue({
    messages: [],
    messagesLoading: false,
    messagesError: null,
    refetchMessages: vi.fn(),
    stream,
    streamedText: opts.streamedText ?? "",
    toolNodes: [],
    stopped: false,
    companionState: companionFor(opts.phase),
    error: null,
    failedText: null,
    send: vi.fn(),
    stop: vi.fn(),
    isStreaming: true,
  });
}

function seedChatState(overrides: {
  error?: string | null;
  failedText?: string | null;
  stream?: StreamState | null;
  streamedText?: string;
  isStreaming?: boolean;
  send?: ReturnType<typeof vi.fn>;
  companionState?: CompanionState;
} = {}) {
  mockUseChat.mockReturnValue({
    messages: [],
    messagesLoading: false,
    messagesError: null,
    refetchMessages: vi.fn(),
    stream: overrides.stream === undefined ? null : overrides.stream,
    streamedText: overrides.streamedText ?? "",
    toolNodes: [],
    stopped: false,
    companionState: overrides.companionState ?? "idle",
    error: overrides.error ?? null,
    failedText: overrides.failedText ?? null,
    send: overrides.send ?? vi.fn(),
    stop: vi.fn(),
    isStreaming: overrides.isStreaming ?? false,
  });
}

function renderThread(props: Partial<ComponentProps<typeof ChatThread>> = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  qc.setQueryData(["health"], { aiConfigured: true });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ChatThread
          conversationId={null}
          onConversationChange={() => {}}
          {...props}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ChatThread — phase-driven skeleton", () => {
  beforeEach(() => {
    mockUseChat.mockReset();
    vi.mocked(api.createConversation).mockReset();
    vi.mocked(api.createConversation).mockResolvedValue({ id: 42 });
  });

  it("shows waveform skeleton and thinking label when streaming with no content", () => {
    seedChat({ phase: "thinking" });
    renderThread();

    expect(screen.getByTestId("waveform-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Lumina is thinking…")).toBeInTheDocument();
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
  });

  it("hides skeleton and phase label once writing content arrives", () => {
    seedChat({
      phase: "writing",
      streamedText: "Try Counterpart — slow-burn, dense, yours.",
      assistantText: "Try Counterpart — slow-burn, dense, yours.",
    });
    renderThread();

    expect(screen.queryByTestId("waveform-skeleton")).not.toBeInTheDocument();
    expect(
      screen.getByText("Try Counterpart — slow-burn, dense, yours."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Lumina is thinking…")).not.toBeInTheDocument();
    expect(screen.queryByText("Composing…")).not.toBeInTheDocument();
    expect(screen.queryByText("Lumina is waking…")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Reaching into your library…"),
    ).not.toBeInTheDocument();
  });

  it("shows tooling label and five waveform bars when tooling with no content", () => {
    seedChat({ phase: "tooling" });
    const { container } = renderThread();

    expect(screen.getByText("Reaching into your library…")).toBeInTheDocument();
    expect(screen.getByTestId("waveform-skeleton")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-part='waveform-bar']")).toHaveLength(
      5,
    );
  });

  it("shows waking label and skeleton when starting with no content", () => {
    seedChat({ phase: "starting" });
    renderThread();

    expect(screen.getByText("Lumina is waking…")).toBeInTheDocument();
    expect(screen.getByTestId("waveform-skeleton")).toBeInTheDocument();
  });
});

const INTERRUPTED_COPY =
  "Lumina stopped mid-response. What's above is saved — nothing lost.";
const NO_DATA_LOST = "The response above is yours. Retry sends the same request.";
const GENERIC_ERROR_COPY = "Something went wrong on our end. Try again?";
const PARTIAL_ASSISTANT = "Try Counterpart — then pause before the reveal.";

describe("ChatThread — error recovery contract", () => {
  beforeEach(() => {
    mockUseChat.mockReset();
    vi.mocked(api.createConversation).mockReset();
    vi.mocked(api.createConversation).mockResolvedValue({ id: 42 });
  });

  it("preserves partial stream, interrupted copy, retry actions, and error avatar", () => {
    seedChatState({
      error: "stream died",
      failedText: "what should I watch?",
      isStreaming: false,
      companionState: "writing",
      streamedText: PARTIAL_ASSISTANT,
      stream: makeStream({
        phase: "writing",
        assistantText: PARTIAL_ASSISTANT,
      }),
    });
    renderThread();

    expect(screen.getByText(INTERRUPTED_COPY)).toBeInTheDocument();
    expect(screen.getByText(NO_DATA_LOST)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start fresh" }),
    ).toBeInTheDocument();
    expect(screen.getByText(PARTIAL_ASSISTANT)).toBeInTheDocument();
    expect(document.querySelector('[data-state="error"]')).toBeTruthy();
  });

  it("shows generic error copy when assistantText is empty and omits the safety line", () => {
    seedChatState({
      error: "stream died",
      failedText: "what should I watch?",
      isStreaming: false,
      stream: makeStream({ phase: "thinking", assistantText: "" }),
    });
    renderThread();

    expect(screen.getByText(GENERIC_ERROR_COPY)).toBeInTheDocument();
    expect(screen.queryByText(NO_DATA_LOST)).not.toBeInTheDocument();
    expect(screen.queryByText(INTERRUPTED_COPY)).not.toBeInTheDocument();
  });

  it("Retry click calls send with failedText", () => {
    const send = vi.fn();
    seedChatState({
      error: "stream died",
      failedText: "retry this exact prompt",
      isStreaming: false,
      send,
      stream: makeStream({ assistantText: PARTIAL_ASSISTANT, phase: "writing" }),
    });
    renderThread();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(send).toHaveBeenCalledWith("retry this exact prompt");
  });

  it("Start fresh click calls api.createConversation", () => {
    seedChatState({
      error: "stream died",
      failedText: "what should I watch?",
      isStreaming: false,
      stream: makeStream({ assistantText: PARTIAL_ASSISTANT, phase: "writing" }),
    });
    renderThread();

    fireEvent.click(screen.getByRole("button", { name: "Start fresh" }));
    expect(api.createConversation).toHaveBeenCalled();
  });
});

const POSTER_URLS = [
  "https://img.test/poster-a.jpg",
  "https://img.test/poster-b.jpg",
  "https://img.test/poster-c.jpg",
];

describe("ChatThread — welcome value-proof", () => {
  beforeEach(() => {
    mockUseChat.mockReset();
    vi.mocked(api.createConversation).mockReset();
    vi.mocked(api.createConversation).mockResolvedValue({ id: 42 });
    seedChatState();
  });

  it("renders SparkAvatar with data-state idle", () => {
    renderThread();
    expect(document.querySelector('[data-state="idle"]')).toBeTruthy();
  });

  it("shows the dormant slow-burn line when dormant is set", () => {
    renderThread({ dormant: true });
    expect(
      screen.getByText("I kept your slow-burn list warm."),
    ).toBeInTheDocument();
  });

  it("omits the dormant line when dormant is unset", () => {
    renderThread();
    expect(
      screen.queryByText("I kept your slow-burn list warm."),
    ).not.toBeInTheDocument();
  });

  it("renders a poster strip for welcomePosters", () => {
    renderThread({ welcomePosters: POSTER_URLS });
    const strip = screen.getByTestId("welcome-posters");
    const imgs = strip.querySelectorAll("img");
    expect(imgs).toHaveLength(3);
    expect([...imgs].map((img) => img.getAttribute("src"))).toEqual(POSTER_URLS);
  });

  it("does not render welcome-posters when the prop is omitted", () => {
    renderThread();
    expect(screen.queryByTestId("welcome-posters")).not.toBeInTheDocument();
  });
});
