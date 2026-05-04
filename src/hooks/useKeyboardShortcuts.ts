import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlaybackStore } from "../store/playbackStore";
import type { UseAudioPlayerResult } from "./useAudioPlayer";

export function useKeyboardShortcuts(
  player: UseAudioPlayerResult,
  totalAyahs: number,
) {
  const totalAyahsRef = useRef(totalAyahs);
  useLayoutEffect(() => {
    totalAyahsRef.current = totalAyahs;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // prevent keyboard shortcuts when focused on input, select, or textarea elements
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      // prevent keyboard shortcuts when no ayahs are loaded
      if (totalAyahsRef.current === 0) return;

      const { isPlaying } = usePlaybackStore.getState();

      // space: play/pause toggle
      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlaying) {
          player.play();
        } else {
          player.pause();
        }
      } else if (e.code === "ArrowRight") {
        // right arrow: next ayah
        e.preventDefault();
        player.nextAyah();
      } else if (e.code === "ArrowLeft") {
        // left arrow: previous ayah
        e.preventDefault();
        player.prevAyah();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [player]);
}
