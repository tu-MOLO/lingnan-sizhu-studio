/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 *
 * 岭南丝竹 · 物理建模音频引擎 (Physical Modeling Synthesis Engine)
 *
 * - 扬琴 / 潮州筝：Karplus-Strong 数字波导（Digital Waveguide）弦振动模型。
 *   用"延迟线 + 环路低通"直接求解弦的波动方程，离线渲染为 AudioBuffer 并按音高缓存；
 *   内置同度多弦微失谐、琴竹/指甲击拨瞬态、钢丝张力沉降、左手按滑与延迟吟弦，
 *   所有表情均在采样级别烘焙，远比振荡器堆叠接近真实弹拨弦鸣。
 * - 高胡：自定义谐波谱（PeriodicWave）弓弦声源 + 循环弓毛摩擦噪声（粉噪经带通），
 *   穿过竹筒/蟒皮多固定共振峰滤波器组；保留换把连弓滑音（portamento）与延迟吟音。
 * - 主输出总线：程序化生成的厅堂脉冲响应做卷积混响（ConvolverNode），干湿混合后
 *   经动态压缩器防削波。
 *
 * 全部声音均由算法实时/离线生成，不依赖任何外部音频文件，Electron 离线打包可用。
 */

// ============================================================================
// AudioContext 与主输出总线（卷积混响 + 压缩）
// ============================================================================

let globalAudioCtx: AudioContext | null = null;
let masterInput: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx) {
    // Standard initialization, compatible with most modern browsers
    const AudioCtxCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxCtor) {
      throw new Error('当前浏览器不支持 Web Audio API。');
    }
    globalAudioCtx = new AudioCtxCtor();
    buildMasterBus(globalAudioCtx);
  }
  // Try to resume if suspended (due to browser autoplay policies)
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

function buildMasterBus(ctx: AudioContext): void {
  const input = ctx.createGain();
  input.gain.value = 0.95;

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;

  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.2; // 室内乐厅堂感，湿声不宜过重

  const convolver = ctx.createConvolver();
  convolver.buffer = createHallImpulse(ctx);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -15;
  compressor.knee.value = 14;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.25;

  input.connect(dryGain);
  dryGain.connect(compressor);
  input.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(compressor);
  compressor.connect(ctx.destination);

  masterInput = input;
}

function getMasterBus(ctx: AudioContext): AudioNode {
  if (!masterInput) buildMasterBus(ctx);
  return masterInput as GainNode;
}

/**
 * 程序化生成小型音乐厅脉冲响应（早期反射 + 指数衰减噪声尾），
 * 左右声道使用不同反射时刻以形成空间宽度。
 */
function createHallImpulse(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * 2.8);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  const reflectionsL = [0.013, 0.027, 0.041, 0.059, 0.081];
  const reflectionsR = [0.017, 0.031, 0.046, 0.064, 0.086];

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    const reflections = channel === 0 ? reflectionsL : reflectionsR;

    reflections.forEach((time, i) => {
      const idx = Math.floor(time * sampleRate);
      if (idx < length) data[idx] += 0.85 * Math.pow(0.7, i);
    });

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      if (t > 0.018) {
        data[i] += (Math.random() * 2 - 1) * Math.exp(-(t - 0.018) / 0.8) * 0.8;
      }
    }

    // 末端淡出，避免截断噪声
    const fade = Math.floor(sampleRate * 0.2);
    for (let i = length - fade; i < length; i++) {
      data[i] *= (length - i) / fade;
    }
  }
  return impulse;
}

/** 可循环的粉噪缓冲（用于高胡弓毛摩擦声），全局只生成一次。 */
let pinkNoiseBuffer: AudioBuffer | null = null;
function getLoopPinkNoise(ctx: AudioContext): AudioBuffer {
  if (pinkNoiseBuffer) return pinkNoiseBuffer;
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Paul Kellet 粉噪近似滤波器
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.25;
  }
  pinkNoiseBuffer = buffer;
  return buffer;
}

// Map Western pitch name to absolute frequency
export function pitchToFreq(pitch: string): number {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const regex = /^([A-G]#?)(-?\d+)$/;
  const match = pitch.match(regex);
  if (!match) return 440; // Fallback

  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = notes.indexOf(noteName);

  // C4 is midi 60
  const midi = 12 * (octave + 1) + noteIndex;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ============================================================================
// Karplus-Strong 数字波导弦振渲染器（纯函数，便于离线渲染与测试）
// ============================================================================

export interface PluckedRenderOptions {
  /** 渲染总长度（秒） */
  lengthSec: number;
  /** 同度弦条数（扬琴双弦、古筝单弦） */
  courses: number;
  /** 每条弦的音高偏移（音分），模拟同度张力微失谐 */
  detuneCents: number[];
  /** 激励噪声低通系数 0..1，越大越暗（拨弦柔、击弦亮） */
  excitationDamping: number;
  /** 环路平均滤波系数 0..0.5，越大音色越暗 */
  loopDamping: number;
  /** 环路阻尼随时间的增量（高频先死的自然衰减） */
  dampingSweep: number;
  /** 振幅衰减到 0.1% 的时长基准；实际时长按 refFreq/f 缩放（低频余音更长） */
  t60: { seconds: number; refFreq: number };
  /** 击/拨弦瞬间的宽带噪声瞬态长度（毫秒）与增益 */
  strikeNoiseMs?: number;
  strikeNoiseGain?: number;
  /** 金属/指甲接触的高频正弦 ping（频率倍数、增益、衰减毫秒） */
  pingFreqMult?: number[];
  pingGain?: number;
  pingDecayMs?: number;
  /** 动态音高包络（音分），用于张力沉降、按滑、吟弦 */
  pitchCents?: (tSec: number) => number;
  /** 渲染目标峰值（0..1） */
  level: number;
  /** 随机种子，保证同参数渲染结果一致 */
  seed: number;
}

/** 确定性伪随机数发生器（mulberry32） */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Karplus-Strong 改进型弦振渲染：
 * 噪声激励注入延迟线 → 分数延迟读取（支持动态音高）→ 环路一阶低通 → 衰减写回。
 * 输出单声道 Float32 PCM。
 */
export function renderPluckedString(
  sampleRate: number,
  frequency: number,
  o: PluckedRenderOptions
): Float32Array {
  const length = Math.floor(sampleRate * o.lengthSec);
  const mix = new Float32Array(length);

  for (let course = 0; course < o.courses; course++) {
    const detune = o.detuneCents[course] ?? 0;
    const f = frequency * Math.pow(2, detune / 1200);
    const nBase = sampleRate / f;
    // 动态音高（吟弦/按滑）会让延迟长度小幅变化，留 12% 余量
    const lineSize = Math.ceil(nBase * 1.12) + 8;
    const line = new Float32Array(lineSize);

    // --- 激励：一个周期长度的滤波噪声（拨弦/击弦瞬间弦的位移形状）---
    const rng = mulberry32(o.seed + course * 7919 + Math.round(frequency));
    const fill = Math.max(4, Math.round(nBase));
    let lp = 0;
    let excitationPeak = 1e-9;
    for (let i = 0; i < fill; i++) {
      const white = rng() * 2 - 1;
      lp = o.excitationDamping * lp + (1 - o.excitationDamping) * white;
      line[i] = lp;
      const abs = Math.abs(lp);
      if (abs > excitationPeak) excitationPeak = abs;
    }
    for (let i = 0; i < fill; i++) line[i] /= excitationPeak;

    // --- 每周期衰减系数：信号每绕延迟线一圈即为一个振动周期，
    //     故衰减按周期施加；并补偿环路低通在基频处的增益损失，使 T60 精确 ---
    const t60Seconds = o.t60.seconds * (o.t60.refFreq / f);
    const omega0 = (2 * Math.PI * f) / sampleRate;
    const d0 = o.loopDamping;
    const loopGainAtFundamental = Math.sqrt(
      (1 - d0) * (1 - d0) + d0 * d0 + 2 * (1 - d0) * d0 * Math.cos(omega0)
    );
    const decayPerCycle =
      Math.pow(0.001, 1 / (f * Math.max(0.2, t60Seconds))) / loopGainAtFundamental;

    // --- 波导主循环 ---
    let write = 0;
    let prevRead = 0;
    for (let t = 0; t < length; t++) {
      const sec = t / sampleRate;
      const cents = o.pitchCents ? o.pitchCents(sec) : 0;
      const delayLength = nBase * Math.pow(2, -cents / 1200);

      // 分数延迟读指针 + 线性插值
      let read = write - delayLength;
      while (read < 0) read += lineSize;
      const r0 = read | 0;
      const frac = read - r0;
      const a = line[r0 % lineSize];
      const b = line[(r0 + 1) % lineSize];
      const x = a + (b - a) * frac;

      // 动态环路低通（时间越长越暗）
      const damping = o.loopDamping + o.dampingSweep * (1 - Math.exp(-sec / 1.1));
      const y = (1 - damping) * x + damping * prevRead;
      prevRead = x;

      const s = y * decayPerCycle;
      line[write] = s;
      mix[t] += s;
      write = (write + 1) % lineSize;
    }
  }

  // 多弦能量归一（平方根律，避免齐奏削顶）
  const courseScale = 1 / Math.sqrt(o.courses);
  for (let t = 0; t < length; t++) mix[t] *= courseScale;

  // --- 击弦/拨弦接触瞬态 ---
  const rng = mulberry32(o.seed ^ 0x55aa);
  if (o.strikeNoiseMs && o.strikeNoiseGain) {
    const n = Math.floor((sampleRate * o.strikeNoiseMs) / 1000);
    const tau = sampleRate * 0.0035;
    for (let t = 0; t < n && t < length; t++) {
      const env = Math.exp(-t / tau);
      mix[t] += (rng() * 2 - 1) * env * o.strikeNoiseGain;
    }
  }
  if (o.pingFreqMult && o.pingGain) {
    const tau = (sampleRate * (o.pingDecayMs ?? 10)) / 1000;
    const pingLen = Math.min(length, Math.floor(sampleRate * 0.06));
    for (const mult of o.pingFreqMult) {
      const omega = 2 * Math.PI * frequency * mult;
      for (let t = 0; t < pingLen; t++) {
        mix[t] += Math.sin((omega * t) / sampleRate) * Math.exp(-t / tau) * o.pingGain;
      }
    }
  }

  // 峰值归一到目标电平
  let peak = 1e-9;
  for (let t = 0; t < length; t++) {
    const abs = Math.abs(mix[t]);
    if (abs > peak) peak = abs;
  }
  const gain = o.level / peak;
  for (let t = 0; t < length; t++) mix[t] *= gain;

  return mix;
}

// ============================================================================
// 乐器预设与 AudioBuffer 缓存
// ============================================================================

const YANGQIN_LENGTH_SEC = 2.6;
const ZHENG_LENGTH_SEC = 3.8;

export function yangqinRenderOptions(_frequency: number): PluckedRenderOptions {
  return {
    lengthSec: YANGQIN_LENGTH_SEC,
    courses: 2, // 扬琴同度双弦
    detuneCents: [-4, 4],
    excitationDamping: 0.22, // 琴竹击弦：明亮宽带激励
    loopDamping: 0.415,
    dampingSweep: 0.05, // 钢丝高频迅速衰减
    t60: { seconds: 0.95, refFreq: 440 },
    strikeNoiseMs: 16,
    strikeNoiseGain: 0.35, // 革/竹琴竹敲击瞬态
    pingFreqMult: [5.6, 8.2],
    pingGain: 0.12,
    pingDecayMs: 8,
    // 击弦瞬间微小张力上冲
    pitchCents: (t) => 7 * Math.exp(-t / 0.025),
    level: 0.9,
    seed: 1234,
  };
}

export function zhengRenderOptions(
  _frequency: number,
  bendSemitones: number
): PluckedRenderOptions {
  return {
    lengthSec: ZHENG_LENGTH_SEC,
    courses: 1,
    detuneCents: [0],
    excitationDamping: 0.5, // 指甲拨弦：较柔的激励形状
    loopDamping: 0.485, // 丝弦/缠弦温润暗淡
    dampingSweep: 0.012,
    t60: { seconds: 1.6, refFreq: 440 },
    strikeNoiseMs: 10,
    strikeNoiseGain: 0.16,
    pingFreqMult: [6.5],
    pingGain: 0.07,
    pingDecayMs: 6,
    pitchCents: zhengPitchEnvelope(bendSemitones),
    level: 0.9,
    seed: 4321,
  };
}

/**
 * 潮州筝音高表情包络：
 * 1) 拨弦张力沉降（起音 +18 音分，约 90ms 回落）；
 * 2) 左手按滑：100ms 后平滑压至目标音高（活五调可达 1.5 半音）；
 * 3) 延迟吟弦：150ms 后渐入 4.6Hz 揉弦，按音越深颤幅越大。
 */
function zhengPitchEnvelope(bendSemitones: number): (t: number) => number {
  return (t: number) => {
    let cents = 18 * Math.exp(-t / 0.035);

    if (bendSemitones !== 0 && t > 0.1) {
      cents += bendSemitones * 100 * (1 - Math.exp(-(t - 0.1) / 0.13));
    }

    const swell = t < 0.15 ? 0 : Math.min(1, (t - 0.15) / 0.35);
    const vibratoDepth = 16 + Math.min(10, Math.abs(bendSemitones) * 7);
    cents += Math.sin(2 * Math.PI * 4.6 * t) * vibratoDepth * swell;

    return cents;
  };
}

const bufferCache = new Map<string, AudioBuffer>();

function monoToBuffer(ctx: AudioContext, samples: Float32Array): AudioBuffer {
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

function getYangqinBuffer(ctx: AudioContext, frequency: number): AudioBuffer {
  const key = `yangqin:${Math.round(frequency * 100)}:${ctx.sampleRate}`;
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const samples = renderPluckedString(ctx.sampleRate, frequency, yangqinRenderOptions(frequency));
  const buffer = monoToBuffer(ctx, samples);
  bufferCache.set(key, buffer);
  return buffer;
}

function getZhengBuffer(ctx: AudioContext, frequency: number, bendSemitones: number): AudioBuffer {
  const bend = Math.round(bendSemitones * 4) / 4; // 量化到 1/4 半音以提升缓存命中
  const key = `zheng:${Math.round(frequency * 100)}:${Math.round(bend * 100)}:${ctx.sampleRate}`;
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const samples = renderPluckedString(
    ctx.sampleRate,
    frequency,
    zhengRenderOptions(frequency, bend)
  );
  const buffer = monoToBuffer(ctx, samples);
  bufferCache.set(key, buffer);
  return buffer;
}

/**
 * 播放一段已渲染的弹拨弦鸣 buffer：近瞬时起音，在请求时长末端自然制音淡出，
 * buildChain 负责把输入节点接到乐器专属琴体滤波器并返回链尾节点。
 */
function playPluckedBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  duration: number,
  level: number,
  buildChain: (input: AudioNode) => AudioNode
): void {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(level, now + 0.004);

  const fade = Math.max(0.08, Math.min(0.3, duration * 0.25));
  if (duration < buffer.duration - fade - 0.05) {
    gain.gain.setValueAtTime(level, now + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + fade);
  }

  source.connect(gain);
  const chainTail = buildChain(gain);
  chainTail.connect(getMasterBus(ctx));

  source.start(now);
  source.stop(now + Math.min(buffer.duration, duration + fade + 0.1));
}

// Play Yangqin (hammered dulcimer)：波导双弦 + 琴竹瞬态 + 松音板峰
export function playYangqin(frequency: number, duration: number = 1.2): void {
  const ctx = getAudioContext();
  const buffer = getYangqinBuffer(ctx, frequency);

  playPluckedBuffer(ctx, buffer, duration, 0.5, (input) => {
    // 松木音板明亮共振峰
    const soundboard = ctx.createBiquadFilter();
    soundboard.type = 'peaking';
    soundboard.frequency.value = 1450;
    soundboard.Q.value = 1.4;
    soundboard.gain.value = 3;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 110;

    input.connect(soundboard);
    soundboard.connect(hpf);
    return hpf;
  });
}

// Play Guzheng / Chaozhou Zheng：波导单弦 + 按滑吟弦 + 深沉木箱共鸣
export function playZheng(
  frequency: number,
  duration: number = 2.0,
  pitchBendSemitones: number = 0
): void {
  const ctx = getAudioContext();
  const buffer = getZhengBuffer(ctx, frequency, pitchBendSemitones);

  playPluckedBuffer(ctx, buffer, duration, 0.55, (input) => {
    // 丝弦温润低通
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 2400;
    lpf.Q.value = 0.4;

    // 桐木琴箱主共鸣峰
    const bodyLow = ctx.createBiquadFilter();
    bodyLow.type = 'peaking';
    bodyLow.frequency.value = 430;
    bodyLow.Q.value = 1.1;
    bodyLow.gain.value = 3.5;

    // 面板中高频空灵感
    const bodyHigh = ctx.createBiquadFilter();
    bodyHigh.type = 'peaking';
    bodyHigh.frequency.value = 950;
    bodyHigh.Q.value = 2;
    bodyHigh.gain.value = 2;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 85;

    input.connect(lpf);
    lpf.connect(bodyLow);
    bodyLow.connect(bodyHigh);
    bodyHigh.connect(hpf);
    return hpf;
  });
}

// ============================================================================
// 高胡：弓弦声源（自定义谐波谱）+ 弓噪 + 琴筒共振峰，支持连弓滑音
// ============================================================================

// 高胡钢弦明亮频谱：基频与 2-6 次谐波都很强（钢弦/小琴筒/蟒皮紧，高频泛音丰富），高次缓慢衰减
const GAOHU_HARMONICS = [
  0, 1, 0.78, 0.62, 0.5, 0.4, 0.3, 0.22, 0.15, 0.1, 0.065, 0.04, 0.025, 0.015,
];
let gaohuPeriodicWave: PeriodicWave | null = null;

function getGaohuWave(ctx: AudioContext): PeriodicWave {
  if (gaohuPeriodicWave) return gaohuPeriodicWave;
  const real = new Array(GAOHU_HARMONICS.length).fill(0);
  gaohuPeriodicWave = ctx.createPeriodicWave(real, GAOHU_HARMONICS.slice());
  return gaohuPeriodicWave;
}

interface GaohuVoice {
  token: number;
  oscMain: OscillatorNode;
  noise: AudioBufferSourceNode;
  bowGain: GainNode;
  noiseBandpass: BiquadFilterNode;
  out: GainNode;
  vibeOsc: OscillatorNode;
  nodes: AudioNode[];
  releaseTimer: ReturnType<typeof setTimeout> | null;
  stopTimer: ReturnType<typeof setTimeout> | null;
}

let activeGaohu: GaohuVoice | null = null;
let gaohuTokenSeq = 0;

function makePeak(
  ctx: AudioContext,
  frequency: number,
  q: number,
  gainDb: number
): BiquadFilterNode {
  const filter = ctx.createBiquadFilter();
  filter.type = 'peaking';
  filter.frequency.value = frequency;
  filter.Q.value = q;
  filter.gain.value = gainDb;
  return filter;
}

export function playGaohu(frequency: number, duration: number = 0.8, slide: boolean = true): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // 连弓：复用正在发声的琴弓，滑到新音（粤胡无缝换把的 legato 特色）
  if (activeGaohu) {
    try {
      const voice = activeGaohu;
      // 换把滑音短而有表情：快速贴住新音，避免长时间停在音高途中造成“偏低/含糊”
      const glide = slide ? 0.075 : 0.05;
      if (voice.releaseTimer) {
        clearTimeout(voice.releaseTimer);
        voice.releaseTimer = null;
      }
      if (voice.stopTimer) {
        clearTimeout(voice.stopTimer);
        voice.stopTimer = null;
      }

      voice.oscMain.frequency.cancelScheduledValues(now);
      voice.oscMain.frequency.setValueAtTime(voice.oscMain.frequency.value, now);
      voice.oscMain.frequency.exponentialRampToValueAtTime(frequency, now + glide);

      voice.noiseBandpass.frequency.cancelScheduledValues(now);
      voice.noiseBandpass.frequency.setValueAtTime(voice.noiseBandpass.frequency.value, now);
      voice.noiseBandpass.frequency.exponentialRampToValueAtTime(frequency * 2.6, now + glide);

      // 换把瞬间弓毛摩擦极轻一闪（一弓多音，不重新起弓）
      voice.bowGain.gain.cancelScheduledValues(now);
      voice.bowGain.gain.setValueAtTime(0.025, now);
      voice.bowGain.gain.exponentialRampToValueAtTime(0.012, now + 0.08);

      // 弓压保持平稳连贯：音与音之间是一条歌唱性线条，不做音量断崖
      voice.out.gain.cancelScheduledValues(now);
      voice.out.gain.setTargetAtTime(0.16, now, 0.035);

      scheduleGaohuRelease(voice, duration + 0.15);
      return;
    } catch {
      // 节点已停止/释放则重建
      cleanupGaohu();
    }
  }

  // --- 新建一声弓 ---
  // 起弓仅带极短的绰音（轻微上滑），快速贴住准音高，保留韵味而不发“偏低”
  const startSemitones = slide ? -0.35 : -0.25;
  const startFreq = frequency * Math.pow(2, startSemitones / 12);

  const oscMain = ctx.createOscillator();
  oscMain.setPeriodicWave(getGaohuWave(ctx));
  oscMain.frequency.setValueAtTime(startFreq, now);
  oscMain.frequency.exponentialRampToValueAtTime(frequency, now + 0.055);

  const mainGain = ctx.createGain();
  mainGain.gain.value = 0.72;

  // 弓毛摩擦：循环粉噪 → 高通 → 跟踪音高的带通（只提供擦弦质感，不主导音色）
  const noise = ctx.createBufferSource();
  noise.buffer = getLoopPinkNoise(ctx);
  noise.loop = true;
  const noiseHpf = ctx.createBiquadFilter();
  noiseHpf.type = 'highpass';
  noiseHpf.frequency.value = 900;
  const noiseBandpass = ctx.createBiquadFilter();
  noiseBandpass.type = 'bandpass';
  noiseBandpass.Q.value = 0.7;
  noiseBandpass.frequency.value = frequency * 2.6;
  const bowGain = ctx.createGain();
  bowGain.gain.setValueAtTime(0.05, now); // 起弓瞬间轻摩擦
  bowGain.gain.exponentialRampToValueAtTime(0.012, now + 0.1);

  // 琴筒声学通道：高胡琴筒细小、蟒皮绷紧，共振峰整体偏高；
  // 用峰值滤波“增强”共鸣而非带通“滤掉”泛音，保留钢弦明亮的高次谐波
  const body1 = makePeak(ctx, 1100, 2.0, 4); // 琴筒/蟒皮主共鸣
  const body2 = makePeak(ctx, 2300, 2.5, 3); // 明亮中频
  const body3 = makePeak(ctx, 3800, 3.0, 2.2); // 钢弦穿透感
  const air = ctx.createBiquadFilter(); // 高频空气光泽
  air.type = 'highshelf';
  air.frequency.value = 7000;
  air.gain.value = 2.5;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 180;

  const out = ctx.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(0.16, now + 0.05); // 弓子起速，随后平稳持续（释音延后处理）
  // 不再按单音时长线性衰减：连弓旋律靠 scheduleGaohuRelease 统一收尾，保证线条连贯

  // 广东风格延迟吟音：起弓 120ms 后才开始左手揉弦，380ms 达到全幅；
  // 速度稍慢、幅度含蓄（约 ±20 音分），对称波动不造成系统性音高偏移
  const vibeOsc = ctx.createOscillator();
  vibeOsc.type = 'sine';
  vibeOsc.frequency.value = 5.2;
  const vibeGain = ctx.createGain();
  vibeGain.gain.setValueAtTime(0, now);
  vibeGain.gain.setValueAtTime(0, now + 0.12);
  vibeGain.gain.linearRampToValueAtTime(frequency * 0.012, now + 0.38);
  vibeOsc.connect(vibeGain);
  vibeGain.connect(oscMain.frequency);

  // 接线：琴弦声与弓噪并联 → 琴筒共振峰组 → 空气增益 → 低频切除
  oscMain.connect(mainGain);
  mainGain.connect(body1);
  noise.connect(noiseHpf);
  noiseHpf.connect(noiseBandpass);
  noiseBandpass.connect(bowGain);
  bowGain.connect(body1);
  body1.connect(body2);
  body2.connect(body3);
  body3.connect(air);
  air.connect(hpf);
  hpf.connect(out);
  out.connect(getMasterBus(ctx));

  const voice: GaohuVoice = {
    token: ++gaohuTokenSeq,
    oscMain,
    noise,
    bowGain,
    noiseBandpass,
    out,
    vibeOsc,
    nodes: [
      oscMain,
      mainGain,
      noise,
      noiseHpf,
      noiseBandpass,
      bowGain,
      body1,
      body2,
      body3,
      air,
      hpf,
      out,
      vibeOsc,
      vibeGain,
    ],
    releaseTimer: null,
    stopTimer: null,
  };
  activeGaohu = voice;

  vibeOsc.start(now);
  oscMain.start(now);
  noise.start(now);

  // 振荡器寿命留足释音时间；真正回收由 cleanupGaohu 完成
  const stopAt = now + duration + 1.0;
  vibeOsc.stop(stopAt);
  oscMain.stop(stopAt);
  noise.stop(stopAt);

  scheduleGaohuRelease(voice, duration + 0.15);
}

/**
 * 起一声可持续的长弓，用于“按住音位拉弦”的交互：不主动收弓，
 * 必须配对调用 stopGaohu()。持续期间对别的音再次调用会自动连弓换把滑音。
 */
export function startGaohu(frequency: number, slide: boolean = true): void {
  // 给一段足够长的弓段寿命；松手时由 stopGaohu 提前收弓并回收节点
  playGaohu(frequency, 20, slide);
}

/** 收弓：取消长弓定时，立即进入自然收弓淡出并回收节点。 */
export function stopGaohu(): void {
  const voice = activeGaohu;
  if (!voice) return;
  if (voice.releaseTimer) {
    clearTimeout(voice.releaseTimer);
    voice.releaseTimer = null;
  }
  if (voice.stopTimer) {
    clearTimeout(voice.stopTimer);
    voice.stopTimer = null;
  }
  scheduleGaohuRelease(voice, 0);
}

// 弓段保持平稳发声，直到预计没有后续音时才做自然收弓（指数淡出）再回收节点
function scheduleGaohuRelease(voice: GaohuVoice, holdSec: number): void {
  const token = voice.token;
  voice.releaseTimer = setTimeout(() => {
    if (!activeGaohu || activeGaohu.token !== token) return;
    const ctx = getAudioContext();
    const n = ctx.currentTime;
    try {
      voice.out.gain.cancelScheduledValues(n);
      voice.out.gain.setTargetAtTime(0.0001, n, 0.11); // 收弓约 0.3s 自然淡出
    } catch {
      /* 已释放 */
    }
    voice.stopTimer = setTimeout(() => {
      if (activeGaohu && activeGaohu.token === token) cleanupGaohu();
    }, 340);
  }, holdSec * 1000);
}

function cleanupGaohu(): void {
  if (!activeGaohu) return;
  const voice = activeGaohu;
  if (voice.releaseTimer) {
    clearTimeout(voice.releaseTimer);
    voice.releaseTimer = null;
  }
  if (voice.stopTimer) {
    clearTimeout(voice.stopTimer);
    voice.stopTimer = null;
  }
  const stoppable: OscillatorNode[] = [voice.oscMain, voice.vibeOsc];
  for (const node of stoppable) {
    try {
      node.stop();
    } catch {
      /* 已停止 */
    }
  }
  try {
    voice.noise.stop();
  } catch {
    /* 已停止 */
  }
  for (const node of voice.nodes) {
    try {
      node.disconnect();
    } catch {
      /* 已释放 */
    }
  }
  activeGaohu = null;
}
