import { useCallback, useState } from "react";
import { SURAHS } from "../api/surahs";
import type { SavedLoop, Surah } from "../types/quran";
import { savedLoopsStorage } from "../utils/storage";
import { usePlaybackStore } from "../store/playbackStore";
import { RECITERS } from "../api/reciters";
import { clampAyahRange } from "../utils/quran";

function readLoops(): SavedLoop[] {
  try {
    return savedLoopsStorage.get("quran_memorizer_saved_loops") ?? [];
  } catch {
    return [];
  }
}

function writeLoops(loops: SavedLoop[]): void {
  try {
    savedLoopsStorage.set("quran_memorizer_saved_loops", loops);
  } catch {
    // localStorage unavailable
  }
}

export function useSavedLoops() {
  const [loops, setLoops] = useState<SavedLoop[]>(readLoops);

  const store = usePlaybackStore();

  const saveLoop = useCallback(
    (name: string) => {
      const {
        selectedSurah,
        selectedReciter,
        startAyah,
        endAyah,
        repeatEachAyah,
        pauseBetweenAyahsMs,
        playbackRate,
      } = store;
      const now = new Date().toISOString();
      const newLoop: SavedLoop = {
        id: crypto.randomUUID(),
        name,
        surahNumber: selectedSurah.number,
        surahNameEnglish: selectedSurah.nameEnglish,
        startAyah,
        endAyah,
        reciterId: selectedReciter.id,
        reciterName: selectedReciter.name,
        repeatEachAyah,
        pauseBetweenAyahsMs,
        playbackRate,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...loops, newLoop];
      writeLoops(updated);
      setLoops(updated);
    },
    [loops, store],
  );

  const updateLoop = useCallback(
    (id: string, name: string) => {
      const {
        selectedSurah,
        selectedReciter,
        startAyah,
        endAyah,
        repeatEachAyah,
        pauseBetweenAyahsMs,
        playbackRate,
      } = store;
      const updated = loops.map((l) =>
        l.id === id
          ? {
            ...l,
            name,
            surahNumber: selectedSurah.number,
            surahNameEnglish: selectedSurah.nameEnglish,
            startAyah,
            endAyah,
            reciterId: selectedReciter.id,
            reciterName: selectedReciter.name,
            repeatEachAyah,
            pauseBetweenAyahsMs,
            playbackRate,
            updatedAt: new Date().toISOString(),
          }
          : l
      );
      writeLoops(updated);
      setLoops(updated);
    },
    [loops, store],
  );

  const deleteLoop = useCallback(
    (id: string) => {
      const updated = loops.filter((l) => l.id !== id);
      writeLoops(updated);
      setLoops(updated);
    },
    [loops],
  );

  const loadLoop = useCallback(
    (loop: SavedLoop) => {
      const surah: Surah | undefined = SURAHS.find((s) =>
        s.number === loop.surahNumber
      );
      const reciter = RECITERS.find((r) => r.id === loop.reciterId);
      if (!surah || !reciter) return;

      const clamped = clampAyahRange(surah, loop.startAyah, loop.endAyah);
      console.log("playing saved loop", loop, clamped);
      store.setSelectedSurah(surah);
      // Small timeout so setSelectedSurah's range reset doesn't overwrite
      setTimeout(() => {
        store.setAyahRange(clamped.start, clamped.end);
        store.setSelectedReciter(reciter);
        store.setRepeatEachAyah(loop.repeatEachAyah);
        store.setPauseBetweenAyahs(loop.pauseBetweenAyahsMs);
        store.setPlaybackRate(loop.playbackRate);
      }, 0);
    },
    [store],
  );

  return { loops, saveLoop, updateLoop, deleteLoop, loadLoop };
}
