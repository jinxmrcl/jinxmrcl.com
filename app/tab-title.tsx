"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 140;
const DELETE_MS = 80;
const HOLD_MS = 2200;
const PAUSE_MS = 500;

export function TabTitleTypewriter({ text }: { text: string }) {
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "pausing">("typing");

  useEffect(() => {
    if (phase === "typing") {
      if (display.length < text.length) {
        const t = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), TYPE_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("holding"), HOLD_MS);
      return () => clearTimeout(t);
    }
    if (phase === "holding") {
      const t = setTimeout(() => setPhase("deleting"), 0);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay(text.slice(0, display.length - 1)), DELETE_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("pausing"), PAUSE_MS);
      return () => clearTimeout(t);
    }
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("typing"), 0);
      return () => clearTimeout(t);
    }
  }, [display, phase, text]);

  useEffect(() => {
    document.title = display.length > 0 ? display : " ";
  }, [display]);

  return null;
}
