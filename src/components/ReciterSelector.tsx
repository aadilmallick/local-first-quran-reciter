import { RECITERS } from "../api/reciters";
import { usePlaybackStore } from "../store/playbackStore";

export function ReciterSelector() {
  const { selectedReciter, setSelectedReciter } = usePlaybackStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
        Reciter
      </label>
      <select
        value={selectedReciter.id}
        onChange={(e) => {
          const reciter = RECITERS.find((r) => r.id === e.target.value);
          if (reciter) setSelectedReciter(reciter);
        }}
        className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
      >
        {RECITERS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}{r.style ? ` · ${r.style}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
