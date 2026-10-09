/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INSTRUMENTS } from '../data/musicData';
import { Instrument, InstrumentId } from '../types';
import { playGaohu, playYangqin, playZheng } from '../utils/audioSynth';
import { Music, History, Heart, Volume2 } from 'lucide-react';

export default function InstrumentWorkshop() {
  const [selectedId, setSelectedId] = useState<InstrumentId>('gaohu');
  const [lastPlayedNote, setLastPlayedNote] = useState<{ name: string; pitch: string } | null>(null);
  const [leftHandBend, setLeftHandBend] = useState<number>(0); // Bending state for 古筝 (semitones: -1, 1, 2)

  const activeInstrument = INSTRUMENTS.find(i => i.id === selectedId) || INSTRUMENTS[0];

  const handlePlayNote = (noteName: string, frequency: number, index: number) => {
    setLastPlayedNote({ name: noteName, pitch: activeInstrument.notes[index].pitch });
    
    if (selectedId === 'gaohu') {
      // Simulate continuous glide if requested
      playGaohu(frequency, 0.9, true);
    } else if (selectedId === 'yangqin') {
      playYangqin(frequency, 1.4);
    } else {
      // 古筝 Chaozhou Zheng supporting左手按滑 bending semitones
      playZheng(frequency, 2.2, leftHandBend);
    }
  };

  return (
    <div id="instrument-workshop-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Instrument Chooser */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div className="bg-cultural-panel rounded-xl p-4 border border-cultural-border">
          <h3 className="text-sm font-serif font-bold text-cultural-accent mb-3 tracking-wider uppercase">
            岭南三小件乐器坊
          </h3>
          <div className="space-y-3">
            {INSTRUMENTS.map((inst) => {
              const isActive = inst.id === selectedId;
              return (
                <button
                  key={inst.id}
                  onClick={() => {
                    setSelectedId(inst.id);
                    setLastPlayedNote(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-cultural-accent/10 border-cultural-accent text-cultural-dark shadow-xs'
                      : 'bg-white hover:bg-cultural-bg border-cultural-border/60 text-cultural-text'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{inst.icon}</span>
                    <div>
                      <h4 className="font-serif font-black tracking-wide text-base text-cultural-dark">{inst.name}</h4>
                      <p className="text-xs text-cultural-text/60 font-medium">{inst.enName}</p>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="w-2 h-2 rounded-full bg-cultural-accent"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Technical/History Cards */}
        <div className="bg-cultural-accent/5 rounded-xl p-5 border border-cultural-border/80 space-y-4 flex-1">
          <div className="flex items-start space-x-3">
            <History className="w-5 h-5 text-cultural-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-serif font-bold text-cultural-dark text-sm">源流与历史</h4>
              <p className="text-xs text-cultural-text/90 mt-1 leading-relaxed">{activeInstrument.history}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 pt-3 border-t border-cultural-border/65">
            <Heart className="w-5 h-5 text-cultural-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-serif font-bold text-cultural-dark text-sm">音色与演奏风格</h4>
              <p className="text-xs text-cultural-text/90 mt-1 leading-relaxed">{activeInstrument.character}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage: Play Simulator */}
      <div className="lg:col-span-8 flex flex-col space-y-4 bg-cultural-panel rounded-xl p-5 border border-cultural-border min-h-[480px] shadow-sm justify-between">
        {/* Header detail */}
        <div className="flex flex-col border-b border-cultural-border/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-serif font-black text-cultural-dark flex items-center space-x-2">
                <span>{activeInstrument.name} 仿真演奏琴房</span>
                <span className="text-[10px] font-sans text-cultural-accent font-semibold px-2.5 py-0.5 bg-cultural-accent/10 rounded-full">
                  物理建模合成
                </span>
              </h3>
              <p className="text-xs text-cultural-text/80 mt-1">{activeInstrument.description}</p>
            </div>

            {/* Last Played Callout */}
            <AnimatePresence mode="wait">
              {lastPlayedNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  className="flex items-center space-x-2 bg-cultural-bg px-3 py-1.5 rounded-lg border border-cultural-border self-start sm:self-center mt-3 sm:mt-0"
                >
                  <div className="w-6 h-6 rounded-full bg-cultural-accent text-white flex items-center justify-center font-serif text-sm font-semibold shadow-inner">
                    {lastPlayedNote.name}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-cultural-accent font-mono font-bold leading-none">五线谱</div>
                    <div className="text-xs text-cultural-dark font-bold leading-tight font-mono">{lastPlayedNote.pitch}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ancient Charm Engine HUD */}
          <div className="bg-cultural-bg/50 p-3 rounded-lg border border-cultural-border/50 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-serif font-black text-cultural-dark">岭南古乐“古韵”声学物理模拟引擎</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">物理声学已启用</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <div className="bg-white p-2 rounded border border-cultural-border/30 text-center shadow-xs">
                <div className="text-[10px] text-cultural-text/65 font-serif font-bold">波导弦振模型</div>
                <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">† Karplus-Strong 求解</div>
              </div>
              <div className="bg-white p-2 rounded border border-cultural-border/30 text-center shadow-xs">
                <div className="text-[10px] text-cultural-text/65 font-serif font-bold">同度多弦微失谐</div>
                <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">† 双弦 ±4 音分干涉</div>
              </div>
              <div className="bg-white p-2 rounded border border-cultural-border/30 text-center shadow-xs">
                <div className="text-[10px] text-cultural-text/65 font-serif font-bold">卷积厅堂混响</div>
                <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">† 2.8s 厅堂脉冲响应</div>
              </div>
              <div className="bg-white p-2 rounded border border-cultural-border/30 text-center shadow-xs">
                <div className="text-[10px] text-cultural-text/65 font-serif font-bold">琴体共振峰滤波组</div>
                <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">† 780Hz 竹筒/蟒皮</div>
              </div>
            </div>
            <div className="text-[11px] text-cultural-text/90 mt-2 leading-relaxed font-sans border-t border-cultural-border/40 pt-2">
              <strong>当前乐器波形补偿 ({selectedId === 'gaohu' ? '高胡' : selectedId === 'yangqin' ? '扬琴' : '古筝'}):</strong>{' '}
              {selectedId === 'gaohu' && '自定义谐波谱弓弦声源叠加循环弓毛摩擦噪声，穿过 780Hz 竹筒蟒皮多共振峰滤波组；保留 0.6 半音换把滑奏、连弓无缝 portamento 与 5.6Hz 延迟吟音，音色明亮而带鼻音。'}
              {selectedId === 'yangqin' && 'Karplus-Strong 波导弦振直接求解钢丝振动，同度双弦 ±4 音分微失谐产生干涉脉振，叠加琴竹击弦噪声瞬态与高频金属泛音，余音经松音板共振峰与厅堂卷积混响自然收束。'}
              {selectedId === 'zheng' && '波导单弦在采样级复刻拨弦张力沉降、指甲擦拂瞬态与左手按滑：100ms 后平滑压至活五目标音高，150ms 缓释起 4.6Hz 深度吟猱，桐木琴箱双共鸣峰令余韵悠远。'}
            </div>
          </div>
        </div>

        {/* Visualizers / Instrument strings */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          {selectedId === 'gaohu' && (
            <div className="relative w-full max-w-sm h-[480px] sm:h-[550px] bg-white rounded-2xl border border-cultural-border flex flex-col items-center overflow-hidden shadow-xs">
              {/* Wooden shaft of Gaohu */}
              <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-cultural-dark via-cultural-accent to-cultural-dark shadow-md"></div>
              
              {/* String nodes */}
              <div className="absolute top-0 bottom-0 left-[43%] w-0.5 bg-cultural-border shadow-sm opacity-80"></div>
              <div className="absolute top-0 bottom-0 left-[57%] w-0.5 bg-cultural-border shadow-sm opacity-80"></div>
              
              {/* Sound peg (千斤) tying binding */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-14 h-4 bg-cultural-bg border border-cultural-border rounded-sm flex items-center justify-center text-[10px] font-bold text-cultural-accent">
                千斤束
              </div>

              {/* Fret/note press buttons mapping notes relative to bowing board */}
              <div className="absolute top-22 bottom-4 inset-x-8 flex flex-col justify-between z-10 py-1">
                {activeInstrument.notes.map((note, index) => {
                  const isOuterString = index % 2 === 0;
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={note.name + index}
                      onClick={() => handlePlayNote(note.name, note.frequency, index)}
                      className={`relative flex items-center justify-between p-2 rounded-xl border group transition-all text-cultural-text shadow-xs cursor-pointer flex-shrink-0 ${
                        isOuterString
                          ? 'bg-cultural-bg hover:bg-cultural-accent/15 border-cultural-border/60 ml-2 mr-8'
                          : 'bg-cultural-panel hover:bg-cultural-accent/15 border-cultural-border/60 mr-2 ml-8'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-cultural-text text-white font-serif text-xs font-bold flex items-center justify-center group-hover:bg-cultural-accent">
                          {note.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-cultural-text">{note.pitch}</span>
                      </div>
                      <Volume2 className="w-3.5 h-3.5 text-cultural-border group-hover:text-cultural-accent" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedId === 'yangqin' && (
            <div className="relative w-full max-w-xl h-[400px] sm:h-[460px] bg-white rounded-2xl border border-cultural-border p-4 overflow-hidden flex flex-col justify-between shadow-xs">
              {/* Trapezoid wood visual sides */}
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cultural-dark to-cultural-accent shadow-sm"></div>
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cultural-dark to-cultural-accent shadow-sm"></div>
              
              {/* Bridges (琴码) lines */}
              <div className="absolute top-0 bottom-0 left-[35%] w-3 bg-cultural-bg border-x border-cultural-border/80 opacity-65"></div>
              <div className="absolute top-0 bottom-0 left-[65%] w-3 bg-cultural-bg border-x border-cultural-border/80 opacity-65"></div>

              {/* Yangqin hammer strings - displayed as modular striking blocks */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full h-full p-2">
                {activeInstrument.notes.map((note, index) => {
                  return (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      key={note.name + index}
                      onClick={() => handlePlayNote(note.name, note.frequency, index)}
                      className="relative rounded-xl border border-cultural-border/60 bg-cultural-bg/40 hover:bg-cultural-accent/15 hover:border-cultural-accent p-3 flex flex-col justify-between items-center text-cultural-text group transition-all h-full cursor-pointer flex-shrink-0"
                    >
                      {/* String thin background line */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-cultural-border/20 pointer-events-none group-hover:bg-cultural-accent/35"></div>
                      
                      <span className="relative z-10 text-[10px] font-mono text-cultural-text/80 font-bold leading-none">{note.pitch}</span>
                      <span className="relative z-10 w-9 h-9 rounded-full bg-cultural-accent text-white border border-cultural-border/20 font-serif font-black flex items-center justify-center text-lg shadow-sm">
                        {note.name}
                      </span>
                      <span className="relative z-10 text-[10px] font-sans text-cultural-accent font-medium leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                        击弦
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedId === 'zheng' && (
            <div className="w-full flex flex-col space-y-4">
              {/* String Board */}
              <div className="relative w-full max-w-xl h-[420px] sm:h-[480px] bg-white rounded-2xl border border-cultural-border p-4 overflow-hidden flex flex-col justify-between shadow-xs mx-auto">
                {/* Traditional Side Wood panels */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-cultural-dark to-cultural-accent shadow-sm"></div>
                
                {/* String wires running horizontally */}
                <div className="flex-1 flex flex-col justify-between relative z-10 px-6 sm:px-10 py-2">
                  {activeInstrument.notes.map((note, index) => {
                    return (
                      <div key={note.name + index} className="relative flex items-center justify-between group flex-row min-h-[36px] flex-shrink-0">
                        {/* The string wire */}
                        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-cultural-border/80 group-hover:bg-cultural-accent group-hover:h-[2px] transition-all" />
                        
                        {/* Guzheng Bridge (码子) triangular */}
                        <div className="absolute left-[30%] -translate-y-1/2 w-4 h-4 bg-cultural-accent rotate-45 border border-cultural-dark/20 rounded-xs flex items-center justify-center shadow-xs">
                          <span className="sr-only">bridge</span>
                        </div>

                        {/* Plucked play handle */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePlayNote(note.name, note.frequency, index)}
                          className="relative z-10 w-8 h-8 rounded-full bg-cultural-bg border-2 border-cultural-accent text-cultural-dark font-serif font-black text-sm flex items-center justify-center hover:bg-cultural-accent hover:text-white cursor-pointer shadow-xs ml-auto"
                        >
                          {note.name}
                        </motion.button>

                        <span className="text-[10px] font-mono font-bold text-cultural-text/80 w-8 text-right">{note.pitch}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guzheng Left Hand Bending controller simulating Guzheng press 吟、按、颤 */}
              <div className="bg-cultural-bg p-4 rounded-xl border border-cultural-border max-w-xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h5 className="font-serif font-black text-cultural-dark text-sm flex items-center space-x-1.5">
                      <span>古筝左手特色：五音按滑系统 (吟/猱/按/滑)</span>
                    </h5>
                    <p className="text-[11px] text-cultural-text/90 mt-0.5 leading-relaxed font-sans">
                      潮州筝乐以“活五”等调式扬名：左手在琴码左侧按压琴弦，使“五”（re）等音音高向上游移、颤动滑转，创造极其缠绵深情的悲怨音韵。
                    </p>
                  </div>
                  {/* Bend adjustment */}
                  <div className="flex bg-cultural-panel p-1.5 rounded-lg border border-cultural-border flex-shrink-0 self-end sm:self-center">
                    {[
                      { label: '正常律', val: 0, desc: '轻六本音（sol la do re mi）' },
                      { label: '半至微升', val: 0.5, desc: '吟弦微颤' },
                      { label: '悲怆活五', val: 1.5, desc: '活五颤按（re 音游移）' }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setLeftHandBend(opt.val)}
                        className={`px-3 py-1.5 rounded-md text-xs transition-all font-serif font-bold cursor-pointer ${
                          leftHandBend === opt.val
                            ? 'bg-cultural-accent text-white shadow-xs'
                            : 'text-cultural-text hover:bg-cultural-bg'
                        }`}
                        title={opt.desc}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Practice Tip & Simulation Disclaimer Footer */}
        <div className="flex flex-col space-y-3">
          <div className="bg-cultural-panel p-4 border border-cultural-border/80 rounded-xl flex items-start sm:items-center justify-between text-xs text-cultural-text/80">
            <div className="flex items-start sm:items-center space-x-2">
              <span className="w-5 h-5 bg-cultural-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 sm:mt-0">
                评
              </span>
              <span className="font-sans font-medium">
                双脚踩地，高胡夹在双腿膝盖处，琴筒略偏向右侧。传统谱音键触动物理建模弦振合成，还原粤乐声律名曲。
              </span>
            </div>
          </div>

          <div className="bg-amber-50/40 p-3.5 border border-amber-200/60 rounded-xl text-[11px] text-cultural-text/90 leading-relaxed font-sans">
            <p className="font-serif font-black text-amber-800 flex items-center space-x-1 mb-1">
              <span>⚠️ 仿真声学与音色声明:</span>
            </p>
            <p>
              本琴房采用 <strong>Karplus-Strong 数字波导物理建模</strong>（扬琴、古筝）与<strong>谐波谱弓弦建模 + 卷积厅堂混响</strong>（高胡）实时生成声音，相较早期振荡器包络合成已大幅贴近真实乐器的击弦瞬态、余振衰减与琴体共鸣。但物理建模仍是对真实声学过程的算法仿真，<strong>并非真实乐器录音采样</strong>，红木琴筒、蟒皮与丝弦的个别细微质感无法完全等同现场原声。本系统旨在进行便携式调式教学与文化特征科普。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
