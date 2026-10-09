/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ManchurianWindow, { ManchurianGlassFrame } from './components/ManchurianWindow';
import InstrumentWorkshop from './components/InstrumentWorkshop';
import PitchDetectorConsole from './components/PitchDetectorConsole';
import GameChallenge from './components/GameChallenge';
import MusicTheoryAtlas from './components/MusicTheoryAtlas';
import { getAudioContext } from './utils/audioSynth';
import { Music, Mic, Award, BookOpen, VolumeX, Sparkles, HelpCircle } from 'lucide-react';

type TabId = 'workshop' | 'detector' | 'challenge' | 'theory';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('workshop');
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  // Lazy trigger AudioContext user gesture rule
  const handleStartAudio = () => {
    getAudioContext();
    setAudioStarted(true);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-cultural-bg text-cultural-text py-6 px-4 md:px-8 font-sans selection:bg-cultural-accent/25 selection:text-cultural-accent">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Decorative Manchurian Architectural Header Title */}
        <header id="app-main-header">
          <ManchurianWindow />
        </header>

        {/* Audio Engine Initializer Overlay for browser compliance */}
        {!audioStarted && (
          <div id="audio-warm-banner" className="bg-gradient-to-r from-cultural-accent to-cultural-accent/90 p-4 rounded-xl border border-cultural-border text-cultural-bg flex flex-col sm:flex-row items-center justify-between shadow-sm space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse flex-shrink-0" />
              <div>
                <h4 className="font-serif font-black text-sm text-yellow-300 tracking-wide">
                  开启粤曲音韵引擎
                </h4>
                <p className="text-[11px] text-white/90 mt-0.5 leading-relaxed font-sans">
                  本系统包含 Karplus-Strong 波导弦振与卷积混响物理建模音频引擎。请点击右侧激活音频，以便享受逼真悠扬的岭南丝竹体验。
                </p>
              </div>
            </div>
            <button
              onClick={handleStartAudio}
              className="px-5 py-2.5 rounded-lg bg-cultural-bg hover:bg-cultural-panel text-cultural-accent font-serif font-black text-xs shadow-sm border border-cultural-border cursor-pointer transition-all hover:scale-105"
            >
              激活音频引擎
            </button>
          </div>
        )}

        {/* Stained-Glass Window Content Container */}
        <ManchurianGlassFrame>
          {/* Authentic Tab-Bar Navigation */}
          <div id="app-tab-navigation" className="flex flex-wrap border-b border-cultural-border pb-3 gap-2">
            {[
              { id: 'workshop', label: '《粤鸣坊》 乐器仿真探究', icon: Music },
              { id: 'detector', label: '《琴韵处》 AI音韵识别器', icon: Mic },
              { id: 'challenge', label: '《乐律战》 曲谱视唱互动', icon: Award },
              { id: 'theory', label: '《释古法》 岭南乐理科普', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`px-4 py-2.5 rounded-lg font-serif text-sm font-bold flex items-center space-x-2 transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-cultural-accent border-cultural-accent text-white shadow-xs'
                      : 'bg-cultural-panel hover:bg-cultural-bg border-cultural-border text-cultural-text'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-cultural-accent'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Render Tab Panel with Framer Motion transitions */}
          <main className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22 }}
              >
                {activeTab === 'workshop' && <InstrumentWorkshop />}
                {activeTab === 'detector' && <PitchDetectorConsole />}
                {activeTab === 'challenge' && <GameChallenge />}
                {activeTab === 'theory' && <MusicTheoryAtlas />}
              </motion.div>
            </AnimatePresence>
          </main>
        </ManchurianGlassFrame>

        {/* Project footer */}
        <footer id="app-footer" className="text-center text-xs text-cultural-text/75 border-t border-cultural-border pt-5 mt-8 px-2 font-sans">
          <p className="font-serif font-bold text-cultural-dark">岭南丝竹 · Gongche Studio</p>
          <p className="text-[11px] text-cultural-text/60 mt-1 font-serif">
            基于 Web Audio 物理建模的岭南工尺谱交互系统 · Created by Molo · 以 MIT 协议开源
          </p>
        </footer>

      </div>
    </div>
  );
}

