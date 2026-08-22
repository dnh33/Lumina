import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

// Mock Web Speech API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();

class SpeechSynthesisUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: ((e: Event) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

global.SpeechSynthesisUtterance = SpeechSynthesisUtterance as any;

Object.defineProperty(window, "speechSynthesis", {
  value: {
    speak: mockSpeak,
    cancel: mockCancel,
    pause: mockPause,
    resume: mockResume,
    speaking: false,
  },
  writable: true,
  configurable: true,
});

describe("useSpeechSynthesis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSpeak.mockClear();
  });

  it("speaks text via speechSynthesis when supported", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.supported).toBe(true);

    result.current.speak("This is the one. Here's why.");
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utter = mockSpeak.mock.calls[0][0];
    expect(utter.text).toBe("This is the one. Here's why.");
    expect(utter.rate).toBe(0.9);
    expect(utter.volume).toBe(0.8);
  });

  it("cancels current speech before starting new", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    result.current.speak("First");
    result.current.speak("Second");
    // Each speak() calls cancel() first — 2 calls for 2 speaks
    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(mockSpeak).toHaveBeenCalledTimes(2);
  });

  it("stops speech on stop()", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    result.current.speak("Test");
    const cancelsAfterSpeak = mockCancel.mock.calls.length;
    result.current.stop();
    expect(mockCancel.mock.calls.length).toBe(cancelsAfterSpeak + 1);
  });

  it("pauses and resumes", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    result.current.speak("Test");
    result.current.pause();
    expect(mockPause).toHaveBeenCalledTimes(1);
    result.current.resume();
    expect(mockResume).toHaveBeenCalledTimes(1);
  });
});
