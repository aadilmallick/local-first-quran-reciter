import { useRef, useEffect } from "react";
import type { AyahAudio } from "../types/quran";
import { usePlaybackStore } from "../store/playbackStore";

interface Props {
  ayahs: AyahAudio[];
  isLoading: boolean;
  error: string | null;
}

export function QuranTextDisplay({ ayahs, isLoading, error }: Props) {
  const { currentAyahIndex, showArabic, showTranslation } = usePlaybackStore();
  const activeRef = useRef<HTMLDivElement | null>(null);

  // Scroll the highlighted ayah into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentAyahIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-400 text-sm">
        Loading ayahs…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
        <strong>Could not load audio:</strong> {error}
      </div>
    );
  }

  if (ayahs.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400 text-sm">
        Select a surah and ayah range to begin.
      </div>
    );
  }

  if (!showArabic && !showTranslation) {
    return (
      <div className="text-center py-8 text-stone-400 text-sm">
        Arabic text and translation are hidden.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ayahs.map((ayah, i) => {
        const isActive = i === currentAyahIndex;
        return (
          <div
            key={ayah.verseKey}
            ref={isActive ? activeRef : null}
            className={`rounded-xl p-4 border transition-all ${
              isActive
                ? "bg-emerald-50 border-emerald-300 shadow-sm"
                : "bg-white border-stone-100 hover:border-stone-200"
            }`}
          >
            {/* Verse number badge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {ayah.verseKey}
              </span>
            </div>

            {/* Arabic text */}
            {showArabic && (
              <p
                dir="rtl"
                className={`text-2xl leading-loose font-serif text-right mb-3 ${
                  isActive ? "text-emerald-900" : "text-stone-800"
                }`}
              >
                {ayah.textArabic ?? (
                  <span className="text-stone-300 text-base">Arabic text unavailable</span>
                )}
              </p>
            )}

            {/* Translation */}
            {showTranslation && (
              <p className="text-sm text-stone-600 leading-relaxed">
                {ayah.translation ?? (
                  <span className="text-stone-300 italic">Translation unavailable</span>
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
