import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { quranClient } from "../api/quranClient";
import type { AyahAudio } from "../types/quran";

interface UseQuranAudioRangeParams {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  reciterId: string;
}

interface UseQuranAudioRangeResult {
  ayahs: AyahAudio[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useQuranAudioRange({
  surahNumber,
  startAyah,
  endAyah,
  reciterId,
}: UseQuranAudioRangeParams): UseQuranAudioRangeResult {
  const [allAyahs, setAllAyahs] = useState<AyahAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string>("");
  const fetchCount = useRef(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const key = `${surahNumber}:${reciterId}`;
    if (lastFetchKey.current === key) return;
    lastFetchKey.current = key;
    const fetchId = ++fetchCount.current;

    // All setState calls happen inside the async IIFE (after the first await),
    // so they are never synchronous in the effect body.
    (async () => {
      await Promise.resolve();
      if (fetchId !== fetchCount.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await quranClient.getAyahAudioForSurah({ surahNumber, reciterId });
        if (fetchId !== fetchCount.current) return;
        setAllAyahs(data);
      } catch (err) {
        if (fetchId !== fetchCount.current) return;
        setError(err instanceof Error ? err.message : "Failed to load audio");
      } finally {
        if (fetchId === fetchCount.current) setIsLoading(false);
      }
    })();
  }, [surahNumber, reciterId, refetchTrigger]);

  const refetch = useCallback(() => {
    lastFetchKey.current = "";
    setRefetchTrigger((t) => t + 1);
  }, []);

  const ayahs = useMemo(
    () => allAyahs.filter((a) => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah),
    [allAyahs, startAyah, endAyah]
  );

  return { ayahs, isLoading, error, refetch };
}
