/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { autoCorrelate, getGongcheFromFrequency, type GongcheMode } from '../utils/pitchDetector';
import { DetectedNote } from '../types';
import { Mic, MicOff, Circle, Activity, AlertCircle } from 'lucide-react';

export default function PitchDetectorConsole() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<DetectedNote | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  // Spark / Contour plot of pitch history to draw beautiful calligraphy line
  const [pitchHistory, setPitchHistory] = useState<number[]>([]);

  // 识谱调式：正线 1=C（合=G）/ 羽调 1=D（合=A，潮州筝、《彩云追月》）
  const [mode, setMode] = useState<GongcheMode>('zhengxian');
  const modeRef = useRef<GongcheMode>('zhengxian');
  modeRef.current = mode;

  const startListening = async () => {
    try {
      setErrorMsg(null);
      // Initialize audio context lazily
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        setErrorMsg('您的浏览器不支持 Web Audio API，无法启用声音识别。');
        return;
      }

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

      setIsListening(true);
      setPitchHistory([]);
    } catch (err) {
      console.error('Microphone error:', err);
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg('您拒绝了麦克风访问权限。请在浏览器中开启麦克风权限以使用音韵识别功能。');
      } else {
        setErrorMsg('无法访问麦克风。请检查输入设备是否连接正常。');
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setCurrentNote(null);
    setPitchHistory([]);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    bufferRef.current = null;
  };

  // 分析循环：监听期间以 requestAnimationFrame 采样，按当前所选调式换算工尺字
  useEffect(() => {
    if (!isListening) return;
    let raf = 0;
    const tick = () => {
      if (analyserRef.current && bufferRef.current && audioCtxRef.current) {
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const freq = autoCorrelate(bufferRef.current, audioCtxRef.current.sampleRate);
        if (freq > 0) {
          const match = getGongcheFromFrequency(freq, modeRef.current);
          if (match && match.clarity > 0.4) {
            setCurrentNote(match);
            setPitchHistory((prev) => {
              const next = [...prev, freq];
              // Limit history count to fit the canvas width
              if (next.length > 80) next.shift();
              return next;
            });
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioCtxRef.current?.close().catch(() => {
        /* already closed */
      });
    };
  }, []);

  return (
    <div
      id="pitch-detector-console"
      className="bg-cultural-panel rounded-xl border border-cultural-border p-5 shadow-xs space-y-6"
    >
      {/* Alert Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-cultural-border/40 pb-4 gap-4">
        <div>
          <h3 className="text-xl font-serif font-black text-cultural-dark flex items-center space-x-2">
            <span>声临其境：AI 岭南音韵识别仪</span>
          </h3>
          <p className="text-xs text-cultural-text/80 mt-1 max-w-xl font-sans font-medium">
            基于自相关周期（Autocorrelation）算法，无需连接云端服务。对着麦克风歌唱、吹奏竹笛，或者弹奏高胡，系统将会自动解析出基频，并实时换算成古老的「工尺谱」！
          </p>
        </div>

        {/* Listen Button */}
        <div>
          {isListening ? (
            <button
              onClick={stopListening}
              className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow-xs"
            >
              <MicOff className="w-4 h-4 animate-pulse" />
              <span>停止声乐捕捉</span>
            </button>
          ) : (
            <button
              onClick={startListening}
              className="px-5 py-2.5 rounded-full bg-cultural-accent hover:bg-cultural-accent/90 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow-xs"
            >
              <Mic className="w-4 h-4" />
              <span>开启声乐捕捉</span>
            </button>
          )}
        </div>
      </div>

      {/* 识谱调式选择 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-serif font-bold text-cultural-text/70">识谱调式</span>
        <div
          role="group"
          aria-label="识谱调式"
          className="inline-flex rounded-lg border border-cultural-border overflow-hidden"
        >
          {(
            [
              { id: 'zhengxian', label: '正线 1=C' },
              { id: 'yudiao', label: '羽调 1=D' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`px-3.5 py-1.5 text-xs font-serif font-bold transition-colors cursor-pointer ${
                mode === m.id
                  ? 'bg-cultural-accent text-white'
                  : 'bg-cultural-panel text-cultural-text hover:bg-cultural-bg'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-cultural-text/55 font-sans">
          {mode === 'zhengxian'
            ? '广东音乐正线，高胡合尺定弦 sol-re（合=G）'
            : 'D 宫羽调，潮州筝定弦 /《彩云追月》（合=A）'}
        </span>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-800 text-xs p-4 rounded-xl border border-red-200 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
          <span className="leading-relaxed font-sans">{errorMsg}</span>
        </div>
      )}

      {/* Main visualization grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left pane: Circular compass-style tuning meter */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-cultural-bg/40 rounded-xl border border-cultural-border/80 p-6 min-h-[300px]">
          <h4 className="text-xs font-serif font-black text-cultural-dark mb-4 uppercase tracking-wider">
            「乐律偏振仪」
          </h4>

          <div className="relative w-48 h-48 rounded-full border-4 border-cultural-border/40 flex items-center justify-center bg-white shadow-inner">
            {/* Center ink circle */}
            <div className="absolute inset-4 rounded-full border border-cultural-bg flex flex-col items-center justify-center bg-cultural-panel">
              {currentNote ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 rounded-full bg-cultural-accent text-white font-serif font-black text-2xl flex items-center justify-center border-2 border-cultural-border shadow-xs mb-1 mx-auto"
                  >
                    {currentNote.gongche}
                  </motion.div>
                  <p className="text-[10px] font-mono font-bold text-cultural-text leading-none mt-1">
                    {currentNote.pitch} ({currentNote.frequency} Hz)
                  </p>
                </div>
              ) : (
                <div className="text-center px-4">
                  <span className="text-cultural-border font-serif text-sm">静候粤曲...</span>
                </div>
              )}
            </div>

            {/* Rotating Needle indicating cents deviation */}
            {currentNote && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ rotate: currentNote.deviation }} // 1 cent = 1 deg for simplistic visual
                transition={{ type: 'spring', stiffness: 80, damping: 10 }}
              >
                {/* Pointer pointer */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-red-600 rounded-full" />
              </motion.div>
            )}

            {/* Cents scale annotations */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cultural-text/60 font-bold">
              0
            </span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cultural-accent/80 font-bold">
              +50
            </span>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cultural-accent/60 font-bold">
              -50
            </span>
          </div>

          <div className="mt-4 text-center">
            {currentNote ? (
              <div className="space-y-1">
                <span
                  className={`text-xs font-serif font-bold px-2.5 py-1 rounded-sm border ${
                    Math.abs(currentNote.deviation) < 15
                      ? 'bg-cultural-accent/10 text-cultural-dark border-cultural-border'
                      : 'bg-cultural-bg text-cultural-accent border-cultural-border/40'
                  }`}
                >
                  {Math.abs(currentNote.deviation) < 15
                    ? '律准 (Perfect)'
                    : `偏差约 ${currentNote.deviation} 音分`}
                </span>
                <p className="text-[11px] text-cultural-text/80 pt-1.5 leading-none mt-1 font-sans font-medium">
                  音调清晰度 (Confidence): ({(currentNote.clarity * 100).toFixed(0)}%)
                </p>
              </div>
            ) : (
              <p className="text-xs text-cultural-text/70 italic font-medium font-sans">
                {isListening
                  ? '请吹口哨、哼唱或使用扬琴试音器'
                  : '开启麦克风后对着电脑哼一首《彩云追月》'}
              </p>
            )}
          </div>
        </div>

        {/* Right pane: Ink Line scroll plotting notes contour */}
        <div className="md:col-span-7 flex flex-col bg-cultural-dark rounded-xl p-5 text-white justify-between min-h-[300px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-serif font-black text-amber-300 tracking-wider flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>「水墨琴声·律动轨迹」</span>
            </h4>
            <span className="text-[10px] font-mono text-stone-400">音高实时波形</span>
          </div>

          {/* Svg Plotter area */}
          <div className="flex-1 w-full h-44 bg-neutral-950 rounded-lg relative overflow-hidden my-4 border border-white/5">
            {pitchHistory.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 500 200">
                {/* Horizontal scale grids */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="#ffffff11" strokeDasharray="3,3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#ffffff15" strokeDasharray="3,3" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#ffffff11" strokeDasharray="3,3" />

                {/* Draw ink brush stroke */}
                <path
                  d={`M ${pitchHistory
                    .map((val, idx) => {
                      // Map freq bounding from 150 Hz to 900 Hz roughly to viewBox 180 to 20
                      const y = 180 - ((val - 150) / 750) * 160;
                      const x = (idx / (pitchHistory.length - 1)) * 500;
                      return `${x} ${Math.max(10, Math.min(190, y))}`;
                    })
                    .join(' L ')}`}
                  fill="none"
                  stroke="url(#inkGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* SVG Gradient definitions */}
                <defs>
                  <linearGradient id="inkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
                    <stop offset="60%" stopColor="#5a5a40" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#8c8c60" stopOpacity="1" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500 text-xs font-sans">
                {isListening ? (
                  <div className="text-center space-y-1">
                    <Circle className="w-5 h-5 animate-ping text-cultural-accent mx-auto" />
                    <p className="mt-1">等待乐声输入...</p>
                  </div>
                ) : (
                  <p>未处于监听状态</p>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-stone-300 leading-relaxed bg-black/30 p-2.5 rounded border border-white/5 font-sans space-y-2">
            <div>
              <span className="text-amber-300 font-bold font-serif mr-1">文化小知识：</span>
              工尺谱中的<strong className="text-white">“合”</strong>通常对应西方大调的{' '}
              <strong className="text-amber-200">So (Sol)</strong>， 而{' '}
              <strong className="text-white">“上”</strong> 对应{' '}
              <strong className="text-amber-200">Do</strong>。 岭南音乐常使用的
              <strong className="text-amber-200 font-serif">“乙凡调”</strong>
              会在弹唱“乙”与“凡”两个音时加以左手按揉，创造出独特的微半音差，声音具有极强的情感张力！
            </div>
            <div className="pt-2 border-t border-white/10 text-stone-400 text-[10px]">
              <span className="text-amber-400 font-bold">🎙️ 拾音仿真与识别率声明：</span>
              本音高检测仪基于纯前端自相关物理解析（Autocorrelation）实时抓取频率，不使用第三方网联API。由于室内回声、麦克风性能、硬件过滤机制各异，计算结果属于高灵敏度数学模拟换算，
              <strong>无法100%媲美</strong>
              专业乐器调音设备；特别是当演唱中带有岭南特色的按揉滑音时，探测折线偶有波动均属声学物理仿真的正常波动范围。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
