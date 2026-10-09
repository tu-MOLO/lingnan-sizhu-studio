/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Music, Mic, Award, BookOpen, Sparkles, Waves } from 'lucide-react';

const MODULES = [
  {
    icon: Music,
    name: '粤鸣坊',
    desc: '高胡 / 扬琴 / 潮州筝三件乐器物理建模，可弹可拉、可按滑',
  },
  {
    icon: Mic,
    name: '琴韵处',
    desc: '麦克风拾音，自相关测音高，实时换算成工尺谱字',
  },
  {
    icon: Award,
    name: '乐律战',
    desc: '跟随《雨打芭蕉》《彩云追月》等名曲视唱闯关',
  },
  {
    icon: BookOpen,
    name: '释古法',
    desc: '工尺谱、二四谱与广东音乐调式的互动乐理图谱',
  },
];

interface WelcomeGuideProps {
  /** 主按钮：进入并在同一手势内激活音频引擎 */
  onEnter: () => void;
  /** 跳过：仅关闭引导，不激活音频（随后仍可点横幅激活） */
  onSkip: () => void;
}

export default function WelcomeGuide({ onEnter, onSkip }: WelcomeGuideProps) {
  const enterRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    enterRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-desc"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg bg-cultural-panel rounded-2xl border border-cultural-border shadow-2xl overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="bg-cultural-accent text-cultural-bg px-6 py-5">
          <div className="flex items-center gap-2 text-amber-300 text-[11px] font-serif font-bold tracking-widest">
            <Waves className="w-4 h-4" />
            工尺谱 × 物理建模
          </div>
          <h2 id="welcome-title" className="font-serif font-black text-2xl mt-1.5">
            岭南丝竹 · Gongche Studio
          </h2>
          <p
            id="welcome-desc"
            className="text-[12px] text-white/85 mt-1.5 leading-relaxed font-sans"
          >
            零采样、纯 Web Audio
            实时合成的岭南丝竹交互系统。先花半分钟了解四个坊，再开始你的弦歌之旅。
          </p>
        </div>

        {/* 模块导览 */}
        <div className="px-6 py-5 space-y-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.name} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-cultural-accent/10 border border-cultural-border/70 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-cultural-accent" />
                </span>
                <div>
                  <h3 className="font-serif font-black text-sm text-cultural-dark">《{m.name}》</h3>
                  <p className="text-[11.5px] text-cultural-text/80 leading-relaxed font-sans mt-0.5">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="flex items-start gap-2 bg-cultural-bg/70 border border-cultural-border/60 rounded-lg p-3 mt-1">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-cultural-text/85 leading-relaxed font-sans">
              浏览器要求音频必须由一次点击启动，点击下方按钮即同时<strong>激活音频引擎</strong>
              ；本系统全程离线运行，不录音、不上传。
            </p>
          </div>
        </div>

        {/* 操作区 */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-[11px] text-cultural-text/60 hover:text-cultural-text underline underline-offset-2 cursor-pointer order-2 sm:order-1"
          >
            先看看，稍后激活
          </button>
          <button
            ref={enterRef}
            type="button"
            onClick={onEnter}
            className="order-1 sm:order-2 px-6 py-2.5 rounded-lg bg-cultural-accent hover:bg-cultural-accent/90 text-white font-serif font-black text-sm shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
          >
            激活音频 · 进入丝竹世界
          </button>
        </div>
      </motion.div>
    </div>
  );
}
