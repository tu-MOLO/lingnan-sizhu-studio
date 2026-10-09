/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { REPERTOIRES } from '../data/musicData';
import { Repertoire, SongNote } from '../types';
import { autoCorrelate, getGongcheFromFrequency } from '../utils/pitchDetector';
import { playGaohu, playYangqin, playZheng } from '../utils/audioSynth';
import { Play, Square, RotateCcw, Award, Sparkles, Volume2, Mic, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { InstrumentId } from '../types';

// 十二平均律频率表（A4=440），覆盖三首曲目全部音域
const NOTE_FREQUENCIES: { [key: string]: number } = {
  'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00,
  'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25,
  'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00,
  'B5': 987.77, 'C6': 1046.50
};

const INSTRUMENT_NAMES: Record<InstrumentId, string> = {
  gaohu: '高胡',
  yangqin: '扬琴',
  zheng: '潮州筝'
};

export default function GameChallenge() {
  const [selectedSong, setSelectedSong] = useState<Repertoire>(
    REPERTOIRES.find(r => r.id === 'yudabajiao') || REPERTOIRES[0]
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const [score, setScore] = useState<number>(0);
  const [totalHits, setTotalHits] = useState<number>(0);

  // Use either internal synthesizer or mic pitch for game scoring!
  const [useMicInput, setUseMicInput] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Track notes scored to prevent duplicate scores inside one note's time duration
  const [hasScoredCurrentNote, setHasScoredCurrentNote] = useState<boolean>(false);

  // Auto-scroll logic to automatically scroll to the active note
  useEffect(() => {
    if (currentNoteIndex >= 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeChild = container.children[currentNoteIndex] as HTMLElement;
      if (activeChild) {
        const containerWidth = container.clientWidth;
        const childOffset = activeChild.offsetLeft;
        const childWidth = activeChild.clientWidth;
        container.scrollTo({
          left: childOffset - (containerWidth / 2) + (childWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [currentNoteIndex]);

  useEffect(() => {
    return () => {
      stopSong();
      stopMic();
    };
  }, []);

  const startMic = async () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
    } catch (err) {
      console.error('Mic access error for game:', err);
      setUseMicInput(false);
    }
  };

  const stopMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  const handleMicToggle = (checked: boolean) => {
    setUseMicInput(checked);
    if (checked) {
      startMic();
    } else {
      stopMic();
    }
  };

  // 按曲目配器分派合成器；高胡实际发音比简谱（人声谱）高纯八度
  const playNoteOnInstrument = (baseFreq: number, beatDuration: number) => {
    switch (selectedSong.instrument) {
      case 'gaohu':
        playGaohu(baseFreq * 2, beatDuration * 0.8, true);
        break;
      case 'yangqin':
        playYangqin(baseFreq, beatDuration * 1.1);
        break;
      case 'zheng':
        playZheng(baseFreq, beatDuration * 1.6);
        break;
    }
  };

  const startSong = () => {
    if (isPlaying) {
      stopSong();
      return;
    }

    setIsPlaying(true);
    setCurrentNoteIndex(0);
    setScore(0);
    setTotalHits(0);
    setHasScoredCurrentNote(false);

    let currentIndex = 0;
    const notes = selectedSong.notes;
    const tempoDurationBase = (60 / selectedSong.tempo) * 1000; // Base beat speed in ms

    const runGameTick = () => {
      if (currentIndex >= notes.length) {
        stopSong();
        return;
      }

      const activeNote = notes[currentIndex];
      setCurrentNoteIndex(currentIndex);
      setHasScoredCurrentNote(false);

      // 1. Play the note synthesizer automatically so the user hears the correct reference pitch!
      // 休止符只占时值，不发声
      if (!activeNote.rest) {
        const baseFreq = NOTE_FREQUENCIES[activeNote.pitch] || 293.66;
        playNoteOnInstrument(baseFreq, activeNote.duration);
      }

      currentIndex++;
      const nextNoteDuration = activeNote.duration * tempoDurationBase;

      // Schedule the next note dynamically based on current note duration!
      intervalIdRef.current = setTimeout(runGameTick, nextNoteDuration);
    };

    runGameTick();
  };

  const stopSong = () => {
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
    setDetectedPitch(null);
    if (intervalIdRef.current) {
      clearTimeout(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // Run scoring inside matching intervals
  useEffect(() => {
    if (!isPlaying || currentNoteIndex < 0 || hasScoredCurrentNote) return;

    const targetNote = selectedSong.notes[currentNoteIndex];
    if (!targetNote || targetNote.rest) return;

    if (useMicInput && analyserRef.current && bufferRef.current && audioCtxRef.current) {
      // Analyze current mic pitch
      const checkMicInterval = setInterval(() => {
        if (!analyserRef.current || !bufferRef.current || !audioCtxRef.current) return;
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const freq = autoCorrelate(bufferRef.current, audioCtxRef.current.sampleRate);

        if (freq > 0) {
          const match = getGongcheFromFrequency(freq, selectedSong.mode);
          if (match && match.clarity > 0.4) {
            setDetectedPitch(match.gongche);
            
            // Check if matches the desired target note character
            if (match.gongche === targetNote.gongche) {
              setScore(prev => prev + 10);
              setTotalHits(prev => prev + 1);
              setHasScoredCurrentNote(true);
              clearInterval(checkMicInterval);
            }
          }
        }
      }, 80);

      return () => clearInterval(checkMicInterval);
    }
  }, [isPlaying, currentNoteIndex, useMicInput, hasScoredCurrentNote, selectedSong]);

  // Handle manual click playing score (making the app 100% playable offline, even without mic!)
  const triggerManualPlayMatch = (noteGongche: string) => {
    if (!isPlaying || currentNoteIndex < 0 || hasScoredCurrentNote) return;
    
    const targetNote = selectedSong.notes[currentNoteIndex];
    if (targetNote && targetNote.gongche === noteGongche) {
      setScore(prev => prev + 10);
      setTotalHits(prev => prev + 1);
      setHasScoredCurrentNote(true);

      // Play matching synth confirmation
      const baseFreq = NOTE_FREQUENCIES[targetNote.pitch] || 293.66;

      // Play extra high percussion sparkle
      playYangqin(baseFreq * 2, 0.4);
    }
  };

  // 准确率分母不含休止符
  const scoredNoteCount = selectedSong.notes.filter(n => !n.rest).length;
  const accuracyRate = scoredNoteCount > 0
    ? Math.round((totalHits / scoredNoteCount) * 100)
    : 0;

  // 屏幕工尺键盘按曲目调式生成
  const keyboardKeys = selectedSong.mode === 'yudiao'
    ? ['合', '四', '一', '上', '尺', '工', '凡', '六', '五', '乙', '仩']
    : ['合', '四', '一', '上', '尺', '工', '凡', '六', '五', '乙', '仩', '伬', '仜', '仮', '六高', '五高'];

  return (
    <div id="game-challenge" className="bg-cultural-panel rounded-xl border border-cultural-border p-5 shadow-xs space-y-6">
      {/* Game Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-cultural-border/40 pb-4 gap-4">
        <div>
          <h3 className="text-xl font-serif font-black text-cultural-dark flex items-center space-x-2">
            <span>《乐律挑战》交互式曲谱跟弹与视唱</span>
          </h3>
          <p className="text-xs text-cultural-text/80 mt-1 max-w-xl">
            选择经典岭南曲谱。点击【开始合奏】后，主乐器将自动示范。你可以唱歌、吹笛（通过麦克风），或者在屏幕底部的「工尺谱键盘」上<strong className="text-cultural-accent font-black">快速点击相同的音符</strong>进行合奏，挑战完美的广东民乐大合奏！
          </p>
        </div>

        {/* Selected Song Control */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-cultural-text font-bold">切换曲谱:</span>
          <select
            value={selectedSong.id}
            onChange={(e) => {
              const song = REPERTOIRES.find(r => r.id === e.target.value);
              if (song) {
                stopSong();
                setSelectedSong(song);
              }
            }}
            disabled={isPlaying}
            className="text-xs px-3 py-1.5 bg-cultural-bg border border-cultural-border rounded font-serif font-bold text-cultural-dark focus:outline-none cursor-pointer"
          >
            {REPERTOIRES.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Repertoire details */}
      <div className="p-4 bg-cultural-accent/5 rounded-xl border border-cultural-border/70 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 space-y-1">
          <span className="text-[10px] bg-cultural-accent text-white px-2 py-0.5 rounded-sm font-bold font-serif border border-cultural-border/20">曲目赏析</span>
          <h4 className="text-sm font-serif font-black text-cultural-dark">{selectedSong.title}</h4>
          <p className="text-xs text-cultural-text leading-relaxed">{selectedSong.description}</p>
        </div>
        <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-cultural-border/50 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
          <div className="text-xs text-cultural-text/90 font-sans">
            <div className="font-bold text-cultural-dark font-serif">演奏要领:</div>
            <p className="italic mt-1 text-[11px] font-serif pr-2 leading-relaxed">{selectedSong.lyricContext}</p>
          </div>
          <div className="text-[10px] text-cultural-accent font-serif mt-2 font-black space-y-0.5">
            <div>主奏乐器：{INSTRUMENT_NAMES[selectedSong.instrument]}</div>
            <div>调式：{selectedSong.mode === 'zhengxian' ? '正线（1=C · 合尺定弦 sol-re）' : '五声羽调（1=D · D宫B羽）'}</div>
            {selectedSong.instrument === 'gaohu' && (
              <div className="text-cultural-text/70 font-sans font-medium">注：高胡实际发音比谱面高纯八度，跟唱按谱面中音即可。</div>
            )}
          </div>
        </div>
      </div>

      {/* Traditional Stave Scroll Area (Scroll of Bamboo Strips 竹简乐谱) */}
      <div className="relative bg-cultural-bg border-2 border-cultural-border rounded-xl p-6 overflow-hidden shadow-inner">
        {/* Background bamboos simulation */}
        <div className="absolute inset-0 flex justify-around pointer-events-none opacity-20">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-4 h-full border-r border-cultural-accent/40 bg-cultural-accent/5" />
          ))}
        </div>

        {/* Score scroll controller */}
        <div className="relative z-10 flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            {/* Play Button */}
            {isPlaying ? (
              <button
                onClick={stopSong}
                className="w-12 h-12 rounded-full bg-cultural-dark hover:bg-cultural-dark/90 text-white flex items-center justify-center cursor-pointer shadow border-2 border-cultural-border transition-all"
              >
                <Square className="w-5 h-5 fill-white" />
              </button>
            ) : (
              <button
                onClick={startSong}
                className="w-12 h-12 rounded-full bg-cultural-accent hover:bg-cultural-accent/95 text-white flex items-center justify-center cursor-pointer shadow border-2 border-cultural-border/20 transition-all"
              >
                <Play className="w-5 h-5 fill-white translate-x-0.5" />
              </button>
            )}

            <div>
              <span className="text-xs font-serif font-black text-cultural-dark">
                {isPlaying ? '合奏演奏中' : '乐曲蓄势待发'}
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                {/* Micro Input Checkbox */}
                <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-cultural-text font-bold select-none">
                  <input
                    type="checkbox"
                    checked={useMicInput}
                    onChange={(e) => handleMicToggle(e.target.checked)}
                    className="rounded border-cultural-border text-cultural-accent focus:ring-cultural-accent w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>开启AI麦克风视唱</span>
                </label>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-[10px] text-cultural-text/60 font-mono font-bold">得分 / SCORE</div>
              <div className="text-xl font-serif font-black text-cultural-accent">{score}</div>
            </div>

            <div className="text-right border-l border-cultural-border pl-4">
              <div className="text-[10px] text-cultural-text/60 font-mono font-bold">命中 / ACCURACY</div>
              <div className="text-xl font-serif font-black text-cultural-accent">{accuracyRate}%</div>
            </div>
          </div>
        </div>

        {/* Scrollable grid representing Notes with Manual/Auto Scrolling capabilities */}
        <div className="relative group/scroll mt-6">
          {/* Left Arrow Button */}
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
              }
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-cultural-panel border border-cultural-border shadow-md flex items-center justify-center text-cultural-accent transition-all z-20 cursor-pointer hover:scale-110 active:scale-95"
            title="向左滚动"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrollable container with ref */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto py-6 px-10 space-x-5 no-scrollbar scroll-smooth bg-white/70 backdrop-blur-xs rounded-lg border border-cultural-border/60 relative"
          >
            {selectedSong.notes.map((note, index) => {
              const isActive = index === currentNoteIndex;
              return (
                <div
                  key={index}
                  className={`flex-shrink-0 flex flex-col items-center justify-between w-14 h-28 rounded-xl border relative transition-all ${
                    note.rest
                      ? 'bg-cultural-bg/40 border-dashed border-cultural-border/40'
                      : isActive
                        ? 'bg-cultural-accent/15 border-2 border-cultural-accent scale-105 shadow-md'
                        : 'bg-cultural-panel border-cultural-border/50'
                  }`}
                >
                  {/* Gongche large character */}
                  <span className={`text-xl font-serif font-black mt-2 ${note.rest ? 'text-cultural-text/40' : isActive ? 'text-cultural-dark' : 'text-cultural-text/85'}`}>
                    {note.gongche}
                  </span>

                  {/* Score indicator glow if scored */}
                  {isActive && hasScoredCurrentNote && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      className="absolute inset-0 bg-cultural-accent/10 rounded-xl border border-cultural-accent flex items-center justify-center pointer-events-none"
                    >
                      <CheckCircle className="w-5 h-5 text-cultural-accent" />
                    </motion.div>
                  )}

                  {/* Music pitch & Duration label */}
                  <div className="mb-2 text-center">
                    <span className="text-[10px] font-mono text-cultural-text/60 font-bold block">{note.rest ? '0 休止' : note.pitch}</span>
                    <span className="text-[8px] text-cultural-accent font-bold block font-sans bg-cultural-bg px-1 rounded inline-block mt-0.5">
                      {note.duration} 拍
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
              }
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-cultural-panel border border-cultural-border shadow-md flex items-center justify-center text-cultural-accent transition-all z-20 cursor-pointer hover:scale-110 active:scale-95"
            title="向右滚动"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Manual Touchscreen Playing keys for accessibility (even without mic!) */}
      <div className="bg-cultural-bg/40 p-4 rounded-xl border border-cultural-border/85">
        <h4 className="text-xs font-serif font-bold text-cultural-dark mb-3 tracking-wide">
          演奏互动琴键：直接演奏出高能和声 (Gongche Keys)
        </h4>
        <div id="gongche-keyboard-grid" className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {keyboardKeys.map((char) => {
            // Find note in target piece that matches this Gongche notation
            const currentTarget = selectedSong.notes[currentNoteIndex];
            const isAwaited = currentTarget && currentTarget.gongche === char;

            return (
              <motion.button
                key={char}
                whileTap={{ scale: 0.94 }}
                onClick={() => triggerManualPlayMatch(char)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isAwaited
                    ? 'bg-cultural-accent border-cultural-accent text-white font-bold animate-pulse shadow-md'
                    : 'bg-white hover:bg-cultural-panel text-cultural-text border-cultural-border/60'
                }`}
              >
                <div className="font-serif text-lg font-black">{char}</div>
                <div className="text-[9px] font-mono text-cultural-text/50 mt-1">按键合奏</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
