import type { ReactNode } from "react";

interface Props {
  selectionPanel: ReactNode;
  controlsPanel: ReactNode;
  loopsPanel: ReactNode;
  textDisplay: ReactNode;
}

export function AppLayout({ selectionPanel, controlsPanel, loopsPanel, textDisplay }: Props) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-lg font-bold">
            ق
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-800 leading-none">
              Quran Loop Memorizer
            </h1>
            <p className="text-xs text-stone-400">Select · Loop · Memorize</p>
          </div>
        </div>
      </header>

      {/* Main 3-column grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-5">
          {selectionPanel}
        </div>

        {/* Center: Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-5">
          {controlsPanel}
        </div>

        {/* Right: Saved loops */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
          {loopsPanel}
        </div>

        {/* Full-width text display */}
        <div className="lg:col-span-3">
          {textDisplay}
        </div>
      </main>
    </div>
  );
}
