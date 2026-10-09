/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import { playYangqin, playZheng } from '../utils/audioSynth';
import { BookOpen, Sparkles, Sliders, Volume2, HelpCircle } from 'lucide-react';

export default function MusicTheoryAtlas() {
  const [microShift, setMicroShift] = useState<number>(50); // 乙反调典型偏移幅度（音分）：乙约低 50、凡约高 50
  const [activeExplainId, setActiveExplainId] = useState<string>('gongche');

  // Trigger standard, tempered note or microtonally shifted Cantonese note!
  // direction：乙（si）偏低传 -1，凡（fa）偏高传 +1；滑块只决定偏移幅度
  const playComparison = (
    baseFreq: number,
    type: 'western' | 'cantonese',
    direction: -1 | 1 = -1
  ) => {
    const finalFreq =
      type === 'cantonese'
        ? baseFreq * Math.pow(2, (direction * Math.abs(microShift)) / 1200)
        : baseFreq;

    // Use Yangqin for bright clear comparison
    playYangqin(finalFreq, 1.5);
  };

  return (
    <div id="music-theory-atlas" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Selector sidebar of music concepts */}
      <div className="lg:col-span-4 bg-cultural-panel rounded-xl p-4 border border-cultural-border">
        <h3 className="text-sm font-serif font-black text-cultural-accent mb-3 tracking-wider uppercase">
          岭南古音理乐识
        </h3>
        <div className="space-y-2">
          {[
            {
              id: 'gongche',
              title: '工尺谱体系 (Gongche Notation)',
              subtitle: '中国千年乐律视唱代码',
            },
            {
              id: 'yifandiao',
              title: '乙反调之美 (The Yi-Fan Mode)',
              subtitle: '华丽哀怨的极富粤风偏音',
            },
            {
              id: 'ersipu',
              title: '潮州二四谱 (Chaozhou Er-Si Notation)',
              subtitle: '以“二三四五六七八”念唱古乐',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={activeExplainId === item.id}
              onClick={() => setActiveExplainId(item.id)}
              className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                activeExplainId === item.id
                  ? 'bg-cultural-accent/15 border-cultural-accent text-cultural-dark'
                  : 'bg-white hover:bg-cultural-bg border-cultural-border text-cultural-text'
              }`}
            >
              <h4 className="font-serif font-black text-sm">{item.title}</h4>
              <p className="text-[10px] text-cultural-text/80 mt-1">{item.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Showcase container */}
      <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-cultural-border shadow-xs flex flex-col justify-between">
        {activeExplainId === 'gongche' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-cultural-border/40 pb-3">
              <BookOpen className="w-5 h-5 text-cultural-accent" />
              <h3 className="text-lg font-serif font-black text-cultural-dark">
                工尺谱体系 (Gongche Notation)
              </h3>
            </div>
            <p className="text-xs text-cultural-text leading-relaxed">
              工尺（gōng
              chě）谱是中国古老的传统记谱法，因以“工、尺”等汉字记写音高而得名。其雏形可追溯至唐代的燕乐半字谱，经宋代俗字谱发展，至明清定型并广泛通行，是近代戏曲、民乐中最通用的谱式之一。至今在粤剧、潮乐与广东音乐社群中，老艺人们依然用它来记谱唱曲。
            </p>
            <p className="text-xs text-cultural-text leading-relaxed">
              广东音乐<strong className="text-cultural-accent">正线</strong>以 1=C
              记谱（高胡“合尺”定弦 sol-re，即 G-D）。低音组为<strong>合、四、一</strong>（sol la
              si），中音组为<strong>上、尺、工、凡、六、五、乙</strong>（do re mi fa sol la
              si），高八度则在字旁加“亻”作<strong>仩、伬、仜、仮</strong>等。下表为正线 1=C
              的音位对照：
            </p>

            {/* Frequencies Match Grid */}
            <div className="bg-cultural-panel p-4 rounded-xl border border-cultural-border/60">
              <h4 className="text-xs font-serif font-black text-cultural-dark mb-3 uppercase tracking-wider">
                传统工尺字与现代音调对照（正线 1=C）
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { char: '合', pitch: 'G3', solfege: 'Sol 低', freq: 196.0 },
                  { char: '四', pitch: 'A3', solfege: 'La 低', freq: 220.0 },
                  { char: '一', pitch: 'B3', solfege: 'Si 低', freq: 246.94 },
                  { char: '上', pitch: 'C4', solfege: 'Do', freq: 261.63 },
                  { char: '尺', pitch: 'D4', solfege: 'Re', freq: 293.66 },
                  { char: '工', pitch: 'E4', solfege: 'Mi', freq: 329.63 },
                  { char: '凡', pitch: 'F4', solfege: 'Fa', freq: 349.23 },
                  { char: '六', pitch: 'G4', solfege: 'Sol', freq: 392.0 },
                  { char: '五', pitch: 'A4', solfege: 'La', freq: 440.0 },
                  { char: '乙', pitch: 'B4', solfege: 'Si', freq: 493.88 },
                ].map((item) => (
                  <button
                    key={item.char}
                    type="button"
                    onClick={() => playYangqin(item.freq, 1.2)}
                    aria-label={`试听工尺音 ${item.char}，音名 ${item.pitch}，唱名 ${item.solfege}`}
                    className="w-full p-3 bg-white rounded-lg border border-cultural-border/50 hover:border-cultural-accent hover:shadow-xs text-center cursor-pointer transition-all group"
                  >
                    <span className="w-8 h-8 rounded-full bg-cultural-accent text-white font-serif font-black flex items-center justify-center text-sm mx-auto mb-1 group-hover:bg-cultural-accent/90">
                      {item.char}
                    </span>
                    <span className="text-[10px] font-mono text-cultural-text font-bold block">
                      {item.pitch}
                    </span>
                    <span className="text-[9px] font-sans text-cultural-text/60 block">
                      {item.solfege}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeExplainId === 'yifandiao' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-cultural-border/40 pb-3">
              <Sliders className="w-5 h-5 text-cultural-accent" />
              <h3 className="text-lg font-serif font-black text-cultural-dark">
                “乙反调” 与微调偏音学说
              </h3>
            </div>

            <p className="text-xs text-cultural-text leading-relaxed">
              广东音乐主要有<strong className="text-cultural-accent">正线</strong>（1=C）、
              <strong className="text-cultural-accent">反线</strong>（1=G）与
              <strong className="text-cultural-accent">乙反线</strong>
              （又称乙凡线，1=F）三种调线。乙反线擅表悲凄怨慕之情，又称“苦喉”：旋律以
              <strong>乙（si）</strong>、<strong>凡（fa）</strong>两个偏音为骨干——正线 1=C 时乙为
              B、凡为 F，演奏中乐师以胡琴滑指、筝弦按揉，将
              <strong className="text-cultural-accent">“乙”略微降低</strong>（约低 30–70 音分，近
              ♭7）、<strong className="text-cultural-accent">“凡”略微升高</strong>（近
              #4），由此形成幽咽低回、极具粤韵的色彩。代表曲目有《昭君怨》《双声恨》等。
            </p>

            {/* Interactive Comparator block */}
            <div className="bg-cultural-panel p-4 rounded-xl border border-cultural-border/60 space-y-4">
              <div>
                <h4 className="text-xs font-serif font-black text-cultural-dark flex items-center space-x-2">
                  <span>听觉实验：乙、凡二音的微调对比</span>
                </h4>
                <p className="text-[11px] text-cultural-text/70 mt-0.5">
                  拖拽滑块设定偏移幅度（约 30–70
                  音分最典型）：“乙”固定向低偏移、“凡”固定向高偏移，再分别点击平均律与乙反微调按钮对比！
                </p>
              </div>

              {/* Slider panel */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-serif font-bold text-cultural-text">
                  <span>无偏移 (0 音分)</span>
                  <span className="text-cultural-accent">
                    当前偏移幅度: {microShift} 音分 (Cents)
                  </span>
                  <span>最大偏移 (100 音分)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={microShift}
                  onChange={(e) => setMicroShift(parseInt(e.target.value, 10))}
                  aria-label="乙凡偏音微调偏移幅度"
                  aria-valuetext={`${microShift} 音分`}
                  className="w-full h-2 bg-cultural-border rounded-lg appearance-none cursor-pointer accent-cultural-accent"
                />
              </div>

              {/* 乙（si = B4）对比 */}
              <div className="text-[11px] font-serif font-bold text-cultural-dark">
                “乙”音（si，正线为 B4）——乙反中偏低
              </div>
              <div className="grid grid-cols-2 gap-4 pagination">
                <button
                  onClick={() => playComparison(493.88, 'western')}
                  className="p-4 bg-white hover:bg-cultural-panel text-cultural-text rounded-xl border border-cultural-border/70 flex flex-col items-center shadow-xs transition-all cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-cultural-text/50 mb-1" />
                  <span className="text-xs font-bold text-cultural-text font-sans">
                    平均律 · 乙
                  </span>
                  <span className="text-[10px] text-cultural-text/60 mt-1 font-mono">
                    标准 493.88 Hz
                  </span>
                </button>

                <button
                  onClick={() => playComparison(493.88, 'cantonese', -1)}
                  className="p-4 bg-cultural-accent hover:bg-cultural-accent/95 text-white rounded-xl border border-cultural-border flex flex-col items-center shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-200 mb-1 animate-pulse" />
                  <span className="text-xs font-bold text-white font-sans">乙反 · 乙（偏低）</span>
                  <span className="text-[10px] text-amber-200 font-mono mt-1 font-bold">
                    {(493.88 * Math.pow(2, -Math.abs(microShift) / 1200)).toFixed(2)} Hz
                  </span>
                </button>
              </div>

              {/* 凡（fa = F4）对比 */}
              <div className="text-[11px] font-serif font-bold text-cultural-dark pt-1">
                “凡”音（fa，正线为 F4）——乙反中偏高
              </div>
              <div className="grid grid-cols-2 gap-4 pagination">
                <button
                  onClick={() => playComparison(349.23, 'western')}
                  className="p-4 bg-white hover:bg-cultural-panel text-cultural-text rounded-xl border border-cultural-border/70 flex flex-col items-center shadow-xs transition-all cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-cultural-text/50 mb-1" />
                  <span className="text-xs font-bold text-cultural-text font-sans">
                    平均律 · 凡
                  </span>
                  <span className="text-[10px] text-cultural-text/60 mt-1 font-mono">
                    标准 349.23 Hz
                  </span>
                </button>

                <button
                  onClick={() => playComparison(349.23, 'cantonese', 1)}
                  className="p-4 bg-cultural-accent hover:bg-cultural-accent/95 text-white rounded-xl border border-cultural-border flex flex-col items-center shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-200 mb-1 animate-pulse" />
                  <span className="text-xs font-bold text-white font-sans">乙反 · 凡（偏高）</span>
                  <span className="text-[10px] text-amber-200 font-mono mt-1 font-bold">
                    {(349.23 * Math.pow(2, Math.abs(microShift) / 1200)).toFixed(2)} Hz
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeExplainId === 'ersipu' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-cultural-border/40 pb-3">
              <HelpCircle className="w-5 h-5 text-cultural-accent" />
              <h3 className="text-lg font-serif font-black text-cultural-dark">
                潮州二四谱 (Chaozhou Er-Si Notation)
              </h3>
            </div>

            <p className="text-xs text-cultural-text leading-relaxed">
              <strong className="text-cultural-accent">二四谱</strong>
              是流行于粤东潮汕平原、以潮州弦诗乐与筝为载体的古老谱式。它以“二、三、四、五、六、七、八”七个数字记音，依次对应唱名{' '}
              <strong>sol、la、do、re、mi、高 sol、高 la</strong>（即简谱 5 6 1 2 3 5
              6）；通常以“四”为 do 定调，如 D 调时四=D。同一谱式经左手按弦变化又分
              <strong>轻六</strong>（轻三六，5 6 1 2 3，轻快明朗）、<strong>重六</strong>（重三六，5
              ♭7 1 2 4，庄重深沉）与<strong>活五</strong>（活三五，“五”=re
              音游移颤按、悲怨凄切）等调。
            </p>

            <div className="p-4 bg-cultural-panel border border-cultural-border/60 rounded-xl">
              <h4 className="text-xs font-serif font-bold text-cultural-dark mb-2">
                二四谱念唱韵律对照表（D 调，四=D）
              </h4>
              <p className="text-xs text-cultural-text/90 leading-relaxed mb-4">
                点击数字音位可听潮州筝音准；末尾可试听“活五”调中“五”（re）音按颤游移的效果。
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {[
                  { name: '二 · sol', freq: 220.0, char: '二' },
                  { name: '三 · la', freq: 246.94, char: '三' },
                  { name: '四 · do', freq: 293.66, char: '四' },
                  { name: '五 · re', freq: 329.63, char: '五' },
                  { name: '六 · mi', freq: 369.99, char: '六' },
                  { name: '七 · 高sol', freq: 440.0, char: '七' },
                  { name: '八 · 高la', freq: 493.88, char: '八' },
                ].map((opt) => (
                  <button
                    key={opt.char}
                    onClick={() => playZheng(opt.freq, 2.0)}
                    className="p-3 bg-white hover:bg-cultural-panel text-cultural-text border border-cultural-border rounded-xl transition-all font-serif font-bold hover:border-cultural-accent text-center cursor-pointer"
                  >
                    <div className="text-lg text-cultural-dark font-black select-none">
                      {opt.char}
                    </div>
                    <div className="text-[9px] text-cultural-text/60 font-sans font-medium mt-1">
                      {opt.name}
                    </div>
                    <div className="text-[9px] text-cultural-text/40 font-mono">
                      {opt.freq.toFixed(2)} Hz
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => playZheng(329.63, 2.6, 1.3)}
                className="mt-4 w-full p-3 bg-cultural-accent hover:bg-cultural-accent/95 text-white rounded-xl border border-cultural-border flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span className="text-xs font-bold font-sans">
                  活五调试听：“五”（re=E4）重按颤滑、音高游移
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tip & Tuning Disclaimer Footer */}
        <div className="mt-6 border-t border-cultural-border/40 pt-4 space-y-2.5">
          <div className="text-[11px] text-cultural-text/75 leading-relaxed flex items-center space-x-1.5 font-sans font-medium">
            <Sparkles className="w-4 h-4 text-cultural-accent flex-shrink-0" />
            <span>
              本面板通过动态的声音比较与科学计算，揭示了中国传统民乐声响美学的严谨物理结构与无限人声艺术张力。
            </span>
          </div>
          <div className="bg-amber-50/40 p-3 border border-amber-200/50 rounded-xl text-[10px] text-cultural-text/90 leading-relaxed font-sans">
            <span className="text-amber-800 font-bold">📢 律制与频率模拟声明：</span>
            本系统中的“西方十二平均律”与“岭南微调色律（乙反调、潮州二四谱）”声频对比是基于科学数学分音算法计算。虽然乐理推导与古籍记载一致，但由于用户的客观扬声器、声卡条件不同，所得音响并不能
            100% 取代现场实体弦索、木制琴腔的复杂天然共振波谱，特此说明。
          </div>
        </div>
      </div>
    </div>
  );
}
