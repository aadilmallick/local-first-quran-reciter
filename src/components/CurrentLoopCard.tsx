import { Bookmark } from "lucide-react";
import { useState } from "react";
import { usePlaybackStore } from "../store/playbackStore";
import { formatRangeLabel } from "../utils/quran";

interface Props {
  onSave: (name: string) => void;
}

export function CurrentLoopCard({ onSave }: Props) {
  const { selectedSurah, selectedReciter, startAyah, endAyah } = usePlaybackStore();
  const [saving, setSaving] = useState(false);
  const [loopName, setLoopName] = useState("");

  const defaultName = formatRangeLabel(selectedSurah, startAyah, endAyah);

  const handleSave = () => {
    const name = loopName.trim() || defaultName;
    onSave(name);
    setLoopName("");
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-stone-800 text-base">
            {selectedSurah.nameEnglish}
            <span className="ml-2 text-stone-400 text-sm font-normal">{selectedSurah.nameArabic}</span>
          </h3>
          <p className="text-sm text-emerald-700 font-medium">
            {defaultName}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">{selectedReciter.name}</p>
        </div>
        <button
          onClick={() => setSaving(!saving)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium transition-colors"
        >
          <Bookmark size={15} />
          Save
        </button>
      </div>

      {saving && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder={defaultName}
            value={loopName}
            onChange={(e) => setLoopName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => { setSaving(false); setLoopName(""); }}
            className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-500 text-sm hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
