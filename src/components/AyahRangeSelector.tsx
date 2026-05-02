import { usePlaybackStore } from "../store/playbackStore";
import { formatRangeLabel } from "../utils/quran";

export function AyahRangeSelector() {
  const { selectedSurah, startAyah, endAyah, setAyahRange } = usePlaybackStore();
  const max = selectedSurah.ayahCount;

  const handleStart = (value: number) => {
    const s = Math.max(1, Math.min(value, max));
    setAyahRange(s, Math.max(s, endAyah));
  };

  const handleEnd = (value: number) => {
    const e = Math.max(1, Math.min(value, max));
    setAyahRange(Math.min(startAyah, e), e);
  };

  const rangeLabel = formatRangeLabel(selectedSurah, startAyah, endAyah);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
        Ayah Range
      </label>
      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1 gap-1">
          <span className="text-xs text-stone-500">From</span>
          <input
            type="number"
            min={1}
            max={max}
            value={startAyah}
            onChange={(e) => handleStart(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
        </div>
        <span className="mt-5 text-stone-400">—</span>
        <div className="flex flex-col flex-1 gap-1">
          <span className="text-xs text-stone-500">To</span>
          <input
            type="number"
            min={startAyah}
            max={max}
            value={endAyah}
            onChange={(e) => handleEnd(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
        </div>
      </div>
      <p className="text-xs text-emerald-700 font-medium">
        Looping: {rangeLabel}
      </p>
    </div>
  );
}
