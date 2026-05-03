import { usePlaybackStore } from "../store/playbackStore";

const REPEAT_OPTIONS = [1, 2, 3, 5, 10];
const PAUSE_OPTIONS = [
  { label: "0s", value: 0 },
  { label: "1s", value: 1000 },
  { label: "2s", value: 2000 },
  { label: "3s", value: 3000 },
  { label: "5s", value: 5000 },
];

export function MemorizationControls() {
  const {
    repeatEachAyah,
    pauseBetweenAyahsMs,
    showArabic,
    showTranslation,
    playBismillah,
    setRepeatEachAyah,
    setPauseBetweenAyahs,
    toggleShowArabic,
    toggleShowTranslation,
    togglePlayBismillah,
  } = usePlaybackStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Repeat per ayah */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Repeat each ayah
        </label>
        <div className="flex gap-1 flex-wrap">
          {REPEAT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setRepeatEachAyah(n)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                repeatEachAyah === n
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {n}×
            </button>
          ))}
        </div>
      </div>

      {/* Pause between ayahs */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Pause between ayahs
        </label>
        <div className="flex gap-1 flex-wrap">
          {PAUSE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPauseBetweenAyahs(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pauseBetweenAyahsMs === opt.value
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bismillah toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-500 flex-1">Bismillah at start</span>
        <button
          onClick={togglePlayBismillah}
          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
            playBismillah
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          }`}
        >
          {playBismillah ? "On" : "Off"}
        </button>
      </div>

      {/* Text toggles */}
      <div className="flex gap-3">
        <button
          onClick={toggleShowArabic}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            showArabic
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          }`}
        >
          Arabic text
        </button>
        <button
          onClick={toggleShowTranslation}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            showTranslation
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          }`}
        >
          Translation
        </button>
      </div>
    </div>
  );
}
