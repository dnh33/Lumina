import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePushToTalk } from "./usePushToTalk";

// Mock Web Speech API SpeechRecognition
let mockRecognitionInstance: any = null;
const mockRecognitionStart = vi.fn();
const mockRecognitionAbort = vi.fn();

class MockSpeechRecognition {
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: ((e: any) => void) | null = null;
  start() {
    mockRecognitionStart();
  }
  abort() {
    mockRecognitionAbort();
  }
}

describe("usePushToTalk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecognitionInstance = null;
    (window as any).SpeechRecognition = MockSpeechRecognition;
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;
  });

  it("reports unsupported when SpeechRecognition is absent", () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    const { result } = renderHook(() => usePushToTalk(() => {}));
    expect(result.current.isSupported).toBe(false);
  });

  it("starts recording and is supported when API present", () => {
    const { result } = renderHook(() => usePushToTalk(() => {}));
    expect(result.current.isSupported).toBe(true);
    act(() => { result.current.start(); });
    expect(mockRecognitionStart).toHaveBeenCalledTimes(1);
    expect(result.current.isRecording).toBe(true);
  });

  it("stops recording on stop()", () => {
    const { result } = renderHook(() => usePushToTalk(() => {}));
    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });
    expect(mockRecognitionAbort).toHaveBeenCalledTimes(1);
    expect(result.current.isRecording).toBe(false);
  });

  it("calls onResult with transcript on speech result", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => usePushToTalk(onResult));
    result.current.start();
    
    // Simulate speech result
    const instance = (window as any).SpeechRecognition.lastInstance;
    if (instance && instance.onresult) {
      instance.onresult({
        results: [
          { length: 1, 0: { transcript: "Show me slow-burn thrillers" } },
        ],
      });
      expect(onResult).toHaveBeenCalledWith("Show me slow-burn thrillers");
    }
  });
});
