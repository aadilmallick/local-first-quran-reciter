import { usePlaybackStore } from "./store/playbackStore";
import { useQuranAudioRange } from "./hooks/useQuranAudioRange";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useSavedLoops } from "./hooks/useSavedLoops";
import { AppLayout } from "./components/AppLayout";
import { SurahSelector } from "./components/SurahSelector";
import { AyahRangeSelector } from "./components/AyahRangeSelector";
import { ReciterSelector } from "./components/ReciterSelector";
import { AudioControls } from "./components/AudioControls";
import { MemorizationControls } from "./components/MemorizationControls";
import { QuranTextDisplay } from "./components/QuranTextDisplay";
import { CurrentLoopCard } from "./components/CurrentLoopCard";
import { SavedLoopsPanel } from "./components/SavedLoopsPanel";

export default function App() {
  const { selectedSurah, selectedReciter, startAyah, endAyah } = usePlaybackStore();

  const { ayahs, isLoading, error, refetch } = useQuranAudioRange({
    surahNumber: selectedSurah.number,
    startAyah,
    endAyah,
    reciterId: selectedReciter.id,
  });

  const player = useAudioPlayer(ayahs);
  const { loops, saveLoop, deleteLoop, loadLoop } = useSavedLoops();

  return (
    <AppLayout
      selectionPanel={
        <>
          <SurahSelector />
          <AyahRangeSelector />
          <ReciterSelector />
          {error && (
            <button
              onClick={refetch}
              className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors"
            >
              Retry loading audio
            </button>
          )}
        </>
      }
      controlsPanel={
        <>
          <CurrentLoopCard onSave={saveLoop} />
          <hr className="border-stone-100" />
          <AudioControls player={player} totalAyahs={ayahs.length} />
          <hr className="border-stone-100" />
          <MemorizationControls />
        </>
      }
      loopsPanel={
        <SavedLoopsPanel loops={loops} onLoad={loadLoop} onDelete={deleteLoop} />
      }
      textDisplay={
        <QuranTextDisplay ayahs={ayahs} isLoading={isLoading} error={error} />
      }
    />
  );
}
