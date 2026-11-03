"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Lang } from "./i18n/types";

/**
 * Reads text aloud with the phone or computer's own voices (the Web Speech
 * API), for people who find reading hard. Nothing is sent anywhere. Sinhala
 * and Tamil voices are missing on many devices, so `speak` reports whether a
 * voice for the language exists rather than reading it in the wrong one.
 */
const LANG_TAGS: Record<Lang, string> = { en: "en", si: "si", ta: "ta" };
const SPEAK_AS: Record<Lang, string> = { en: "en-GB", si: "si-LK", ta: "ta-LK" };

const support = {
  subscribe: () => () => {},
  get: () => typeof window !== "undefined" && "speechSynthesis" in window,
};

export function useSpeech(lang: Lang) {
  const supported = useSyncExternalStore(support.subscribe, support.get, () => false);
  const [speaking, setSpeaking] = useState(false);

  // Some browsers only start loading voices when first asked, so ask early;
  // by the time someone presses Listen the list is ready. Stop speaking when
  // the language changes or the page goes away.
  useEffect(() => {
    if (!supported) return;
    // Held here so the clean-up stops the same engine that was started
    const synth = window.speechSynthesis;
    synth.getVoices();
    return () => synth.cancel();
  }, [supported, lang]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  /** Returns false when the device has no voice for this language */
  const speak = useCallback(
    (text: string): boolean => {
      if (!supported) return false;
      const synth = window.speechSynthesis;
      const voice = synth
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith(LANG_TAGS[lang]));
      // English always has a fallback voice; Sinhala and Tamil need a real one
      if (!voice && lang !== "en") return false;

      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang ?? SPEAK_AS[lang];
      if (voice) utterance.voice = voice;
      // A little slower than normal, for clarity
      utterance.rate = 0.9;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(utterance);
      return true;
    },
    [supported, lang]
  );

  return { supported, speaking, speak, stop };
}
