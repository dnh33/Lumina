/**
 * useSpeechSynthesis — text-to-speech via the Web Speech API.
 *
 * Controls playback of Lumina's responses: speak, pause, resume, stop.
 * Honors `prefers-reduced-motion` by auto-disabling on reduced-motion
 * user preference.
 *
 * Browser support: Chrome 33+, Safari 7+, Firefox 49+, Mobile Safari 7+.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechSynthesisAPI {
  speaking: boolean;
  supported: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useSpeechSynthesis(): SpeechSynthesisAPI {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const reduced = useReducedMotionCheck();
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
    };
  }, []);

  const updateSpeaking = useCallback(() => {
    setSpeaking(supported && !reduced && window.speechSynthesis.speaking);
  }, [supported, reduced]);

  const speak = useCallback((text: string) => {
    if (!supported || reduced) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9; // Lumina's voice: composed, measured
    utter.pitch = 1.0;
    utter.volume = 0.8;

    utter.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };
    utter.onerror = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utter;
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  }, [supported, reduced]);

  const pause = useCallback(() => {
    if (supported && !reduced) window.speechSynthesis.pause();
  }, [supported, reduced]);

  const resume = useCallback(() => {
    if (supported && !reduced) window.speechSynthesis.resume();
  }, [supported, reduced]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      utteranceRef.current = null;
    }
  }, [supported]);

  return { speaking, supported, speak, pause, resume, stop };
}

/**
 * Checks the user's reduced-motion preference.
 * Voice output respects accessibility settings.
 */
function useReducedMotionCheck(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
