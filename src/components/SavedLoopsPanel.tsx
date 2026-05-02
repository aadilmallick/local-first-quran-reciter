import { Trash2, Play } from "lucide-react";
import type { SavedLoop } from "../types/quran";
import { formatRangeLabel } from "../utils/quran";
import { SURAHS } from "../api/surahs";

interface Props {
  loops: SavedLoop[];
  onLoad: (loop: SavedLoop) => void;
  onDelete: (id: string) => void;
}

function LoopItem({
  loop,
  onLoad,
  onDelete,
}: {
  loop: SavedLoop;
  onLoad: (l: SavedLoop) => void;
  onDelete: (id: string) => void;
}) {
  const surah = SURAHS.find((s) => s.number === loop.surahNumber);
  const rangeLabel = surah
    ? formatRangeLabel(surah, loop.startAyah, loop.endAyah)
    : `${loop.surahNameEnglish} ${loop.startAyah}–${loop.endAyah}`;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100 hover:border-stone-200 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{loop.name}</p>
        <p className="text-xs text-stone-400 truncate">{rangeLabel} · {loop.reciterName}</p>
      </div>
      <button
        onClick={() => onLoad(loop)}
        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0"
        title="Load loop"
      >
        <Play size={15} />
      </button>
      <button
        onClick={() => onDelete(loop.id)}
        className="p-1.5 rounded-md text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
        title="Delete loop"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function SavedLoopsPanel({ loops, onLoad, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
        My Loops
      </h2>

      {loops.length === 0 ? (
        <div className="text-center py-8 text-stone-300 text-sm">
          No saved loops yet.
          <br />
          Configure a range and click Save.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {loops.map((loop) => (
            <LoopItem
              key={loop.id}
              loop={loop}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
