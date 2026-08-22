/**
 * usePushToTalk — speech-to-text via the Web Speech API.
 *
 * Long-press a button to start recording, release to send the transcript
 * to a callback (typically set by useChat to inject into the chat input).
 *
 * Browser support: Chrome 25+, Firefox 49+, Safari 7+, Mobile Safari 16+.
 * Safari requires `webkitSpeechRecognition`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechCallback = (text: string) => void;

interface PushToTalkAPI {
  isRecording: boolean;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

// Type augmentation for vendor-prefixed API
// Minimal type declarations for Web Speech API (not in TS DOM lib by default)
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition {
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  start(): void;
  abort(): void;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [Symbol.iterator](): IterableIterator<SpeechRecognitionAlternative>;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
// Accessed via (window as any) to avoid TS DOM lib conflicts
type SpeechRecognitionCtor = new () => SpeechRecognition;

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * usePushToTalk — returns recording state + start/stop handlers.
 *
 * @param onResult Called with transcribed text when speech completes or
 *                 returns interim results (continuous mode).
 */
export function usePushToTalk(onResult: SpeechCallback): PushToTalkAPI {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSafariRef = useRef(isSafari());

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* already stopped */
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const w = typeof window !== "undefined"
    ? (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
    : null;
  const isSupported = !!w
    && (typeof w.SpeechRecognition !== "undefined"
        || typeof w.webkitSpeechRecognition !== "undefined");

  const start = useCallback(() => {
    if (!isSupported || isRecording) return;

    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition!;
    const recognition: SpeechRecognition = new SR();

    recognition.onresult = (e) => {
      const results = Array.from(e.results);
      const transcript = results
        .flatMap((r) => Array.from(r))
        .filter((r) => r.transcript)
        .map((r) => r.transcript)
        .join("");
      if (transcript) onResult(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [isSupported, isRecording, onResult]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return { isRecording, start, stop, isSupported };
}
