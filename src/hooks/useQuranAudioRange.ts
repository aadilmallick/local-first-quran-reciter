import { useCallback, useEffect, useRef, useState } from "react";
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
  // Track what we last fetched so we don't re-fetch on ayah range changes
  const lastFetchKey = useRef<string>("");
  const fetchCount = useRef(0);

  const fetchAyahs = useCallback(async () => {
    const key = `${surahNumber}:${reciterId}`;
    if (lastFetchKey.current === key) return;
    lastFetchKey.current = key;

    const fetchId = ++fetchCount.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await quranClient.getAyahAudioForSurah({ surahNumber, reciterId });
      // Ignore stale responses if a newer fetch was triggered
      if (fetchId !== fetchCount.current) return;
      setAllAyahs(data);
    } catch (err) {
      if (fetchId !== fetchCount.current) return;
      setError(err instanceof Error ? err.message : "Failed to load audio");
    } finally {
      if (fetchId === fetchCount.current) {
        setIsLoading(false);
      }
    }
  }, [surahNumber, reciterId]);

  const refetch = useCallback(() => {
    lastFetchKey.current = "";
    fetchAyahs();
  }, [fetchAyahs]);

  useEffect(() => {
    fetchAyahs();
  }, [fetchAyahs]);

  // Filter the full surah down to the requested range
  const ayahs = allAyahs.filter(
    (a) => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah
  );

  return { ayahs, isLoading, error, refetch };
}
