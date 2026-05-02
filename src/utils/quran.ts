import type { Surah } from "../types/quran";

export function formatVerseKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

export function formatRangeLabel(
  surah: Surah,
  startAyah: number,
  endAyah: number
): string {
  return `${surah.nameEnglish} ${startAyah}–${endAyah}`;
}

export function clampAyahRange(
  surah: Surah,
  start: number,
  end: number
): { start: number; end: number } {
  const clampedStart = Math.max(1, Math.min(start, surah.ayahCount));
  const clampedEnd = Math.max(clampedStart, Math.min(end, surah.ayahCount));
  return { start: clampedStart, end: clampedEnd };
}

export function defaultRangeForSurah(surah: Surah): {
  start: number;
  end: number;
} {
  return { start: 1, end: Math.min(5, surah.ayahCount) };
}
