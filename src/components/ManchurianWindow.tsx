/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import React from 'react';

export default function ManchurianWindow() {
  return (
    <div
      id="manchurian-window-container"
      className="relative w-full h-24 overflow-hidden rounded-xl border border-cultural-border bg-cultural-panel flex items-center justify-between px-4 sm:px-6 shadow-xs"
    >
      {/* Decorative Traditional Cantonese Manchuria Window Backdrops */}
      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-15">
        <svg className="h-full w-28 text-cultural-accent" viewBox="0 0 100 100" fill="currentColor">
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            rx="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M 10 50 L 90 50 M 50 10 L 50 90 M 10 10 L 90 90 M 90 10 L 10 90 M 30 30 L 70 30 L 70 70 L 30 70 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <svg
          className="h-full w-28 text-cultural-accent/60"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            rx="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M 10 50 L 90 50 M 50 10 L 50 90 M 10 10 L 90 90 M 90 10 L 10 90 M 30 30 L 70 30 L 70 70 L 30 70 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <svg
          className="h-full w-28 text-cultural-accent/40"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            rx="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M 10 50 L 90 50 M 50 10 L 50 90 M 10 10 L 90 90 M 90 10 L 10 90 M 30 30 L 70 30 L 70 70 L 30 70 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Grid structure symbolizing wood carving */}
      <div className="relative z-10 flex items-center space-x-4">
        {/* Visual Badge */}
        <div className="w-12 h-12 rounded-lg bg-cultural-accent flex items-center justify-center text-cultural-bg text-2xl font-serif font-semibold border-2 border-cultural-border shadow-sm">
          粤
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-black text-cultural-dark tracking-wide">
            岭南丝竹 · 弦歌回响
          </h2>
          <p className="text-xs font-sans text-cultural-text/80 mt-0.5 font-medium tracking-wide">
            工尺谱交互与岭南丝竹物理建模系统{' '}
            <span className="text-cultural-accent font-light italic ml-1">
              / Gongche Studio · Lingnan Sizhu
            </span>
          </p>
        </div>
      </div>

      {/* Decorative Stamp Tag */}
      <div className="hidden md:flex flex-col items-end relative z-10 font-serif border-r border-cultural-accent/30 pr-3">
        <span className="text-[10px] text-cultural-accent font-bold bg-cultural-bg px-1.5 py-0.5 rounded border border-cultural-border tracking-widest leading-none">
          岭南丝竹
        </span>
        <span className="text-xs text-cultural-text mt-1 text-right font-medium">
          工尺谱 × 物理建模
        </span>
      </div>
    </div>
  );
}

// Full background panel inspired by stained-glass Manchuria Windows (满洲窗)
export function ManchurianGlassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="manchurian-glass-frame"
      className="relative p-6 rounded-2xl border-4 border-cultural-accent bg-white overflow-x-hidden shadow-sm"
    >
      {/* Wooden corner ornaments */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cultural-accent pointer-events-none rounded-tl-sm"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cultural-accent pointer-events-none rounded-tr-sm"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cultural-accent pointer-events-none rounded-bl-sm"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cultural-accent pointer-events-none rounded-br-sm"></div>

      {/* Stained Glass Corner Highlights */}
      <div className="absolute top-2 left-2 w-4 h-4 bg-cultural-accent/10 border border-cultural-accent/20 rounded-sm pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-4 h-4 bg-cultural-accent/5 border border-cultural-accent/10 rounded-sm pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 bg-cultural-accent/5 border border-cultural-accent/10 rounded-sm pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 bg-cultural-accent/10 border border-cultural-accent/20 rounded-sm pointer-events-none"></div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
