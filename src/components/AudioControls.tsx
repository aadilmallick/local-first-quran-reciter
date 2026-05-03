import {
  Loader2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Square,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRef } from "react";
import { usePlaybackStore } from "../store/playbackStore";
import type { UseAudioPlayerResult } from "../hooks/useAudioPlayer";

interface Props {
  player: UseAudioPlayerResult;
  totalAyahs: number;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

export function AudioControls({ player, totalAyahs }: Props) {
  const {
    currentAyahIndex,
    isPlaying,
    isLoopingRange,
    playbackRate,
    volume,
    startAyah,
    toggleLoop,
    setPlaybackRate,
    setVolume,
  } = usePlaybackStore();

  const prevVolumeRef = useRef(volume > 0 ? volume : 1);

  const { play, pause, stop, nextAyah, prevAyah, isBuffering, currentTime, duration } = player;

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentAyahNumber = startAyah + currentAyahIndex;

  return (
    <div className="flex flex-col gap-4">
      {/* Current ayah display */}
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          Ayah{" "}
          <span className="font-semibold text-emerald-700">{currentAyahNumber}</span>
          {totalAyahs > 0 && (
            <span> of {startAyah + totalAyahs - 1}</span>
          )}
        </span>
        {isBuffering && (
          <span className="flex items-center gap-1 text-stone-400">
            <Loader2 size={14} className="animate-spin" /> Buffering...
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-200"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={(e) => { prevAyah(); e.currentTarget.blur(); }}
          disabled={totalAyahs === 0}
          className="p-2 rounded-full text-stone-500 hover:bg-stone-100 disabled:opacity-30 transition-colors"
          title="Previous ayah (←)"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={(e) => { isPlaying ? pause() : play(); e.currentTarget.blur(); }}
          disabled={totalAyahs === 0}
          className="p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-30 shadow-md transition-colors"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>

        <button
          onClick={(e) => { stop(); e.currentTarget.blur(); }}
          disabled={totalAyahs === 0}
          className="p-2 rounded-full text-stone-500 hover:bg-stone-100 disabled:opacity-30 transition-colors"
          title="Stop"
        >
          <Square size={20} />
        </button>

        <button
          onClick={(e) => { nextAyah(); e.currentTarget.blur(); }}
          disabled={totalAyahs === 0}
          className="p-2 rounded-full text-stone-500 hover:bg-stone-100 disabled:opacity-30 transition-colors"
          title="Next ayah (→)"
        >
          <SkipForward size={20} />
        </button>

        <button
          onClick={(e) => { toggleLoop(); e.currentTarget.blur(); }}
          className={`p-2 rounded-full transition-colors ${
            isLoopingRange
              ? "bg-emerald-100 text-emerald-700"
              : "text-stone-400 hover:bg-stone-100"
          }`}
          title="Toggle loop"
        >
          <Repeat size={20} />
        </button>
      </div>

      {/* Playback speed */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-500 w-12">Speed</span>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackRate(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                playbackRate === s
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (volume > 0) {
              prevVolumeRef.current = volume;
              setVolume(0);
            } else {
              setVolume(prevVolumeRef.current);
            }
          }}
          className="text-stone-500 hover:text-emerald-700 transition-colors flex-shrink-0"
          title={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? (
            <VolumeX size={18} />
          ) : volume < 0.5 ? (
            <Volume1 size={18} />
          ) : (
            <Volume2 size={18} />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (v > 0) prevVolumeRef.current = v;
            setVolume(v);
          }}
          className="w-full accent-emerald-600 h-1.5 cursor-pointer"
          title={`Volume ${Math.round(volume * 100)}%`}
        />
        <span className="text-xs text-stone-400 w-8 text-right tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
