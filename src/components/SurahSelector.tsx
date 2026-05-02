import { useState } from "react";
import { SURAHS } from "../api/surahs";
import { usePlaybackStore } from "../store/playbackStore";

export function SurahSelector() {
  const { selectedSurah, setSelectedSurah } = usePlaybackStore();
  const [search, setSearch] = useState("");

  const filtered = SURAHS.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nameEnglish.toLowerCase().includes(q) ||
      s.nameArabic.includes(q) ||
      String(s.number).includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
        Surah
      </label>
      <input
        type="text"
        placeholder="Search surah..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-stone-50"
      />
      <select
        value={selectedSurah.number}
        onChange={(e) => {
          const surah = SURAHS.find((s) => s.number === Number(e.target.value));
          if (surah) setSelectedSurah(surah);
        }}
        className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        size={6}
      >
        {filtered.map((s) => (
          <option key={s.number} value={s.number}>
            {s.number}. {s.nameEnglish} · {s.nameArabic} ({s.ayahCount})
          </option>
        ))}
      </select>
      <p className="text-xs text-stone-400">
        {selectedSurah.nameEnglish} — {selectedSurah.englishMeaning} — {selectedSurah.ayahCount} ayahs
      </p>
    </div>
  );
}
