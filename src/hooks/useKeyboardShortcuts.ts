import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlaybackStore } from "../store/playbackStore";
import type { UseAudioPlayerResult } from "./useAudioPlayer";

export function useKeyboardShortcuts(
  player: UseAudioPlayerResult,
  totalAyahs: number
) {
  const totalAyahsRef = useRef(totalAyahs);
  useLayoutEffect(() => {
    totalAyahsRef.current = totalAyahs;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (totalAyahsRef.current === 0) return;

      const { isPlaying } = usePlaybackStore.getState();

      if (e.code === "Space") {
        e.preventDefault();
        isPlaying ? player.pause() : player.play();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        player.nextAyah();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        player.prevAyah();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [player]);
}
