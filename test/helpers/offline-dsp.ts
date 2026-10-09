/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

/**
 * 离线 DSP 工具：高胡弓弦合成链路的数学复刻 + 信号分析。
 *
 * 浏览器端高胡基于 Web Audio 节点（PeriodicWave 谐波谱 + 带通弓噪 + 琴筒
 * 共振峰 peaking 组），无法在 Node 中直接渲染。这里用与 audioSynth.ts 节点图
 * 等价的差分方程离线复刻，使 CI 能锁定谐波配比、连弓滑音时序、共振峰位置与
 * 起收弓包络等关键设计参数。波导类乐器（扬琴、潮州筝）本就是纯函数，测试
 * 直接调用引擎本体，无需复刻。
 */

export const SR = 44100;

// ---------------------------------------------------------------------------
// 信号分析
// ---------------------------------------------------------------------------

export function isFiniteSamples(x: Float32Array): boolean {
  for (let i = 0; i < x.length; i++) {
    if (!Number.isFinite(x[i])) return false;
  }
  return true;
}

export function peakOf(x: Float32Array, from = 0, to = x.length): number {
  let p = 0;
  for (let i = from; i < to; i++) {
    const a = Math.abs(x[i]);
    if (a > p) p = a;
  }
  return p;
}

export function rms(x: Float32Array, from: number, to: number): number {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

function corr(y: Float32Array, lag: number): number {
  let s = 0;
  for (let i = 0; i + lag < y.length; i++) s += y[i] * y[i + lag];
  return s / (y.length - lag);
}

/** 自相关基频检测（含抛物线插值），与 pitchDetector 的思路一致 */
export function detectPitch(x: Float32Array, sampleRate = SR, minF = 120, maxF = 1400): number {
  if (rms(x, 0, x.length) < 1e-4) return -1;
  let mean = 0;
  for (const v of x) mean += v;
  mean /= x.length;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] - mean;

  const minLag = Math.floor(sampleRate / maxF);
  const maxLag = Math.floor(sampleRate / minF);
  let bestLag = minLag;
  let bestVal = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const s = corr(y, lag);
    if (s > bestVal) {
      bestVal = s;
      bestLag = lag;
    }
  }
  const s0 = corr(y, bestLag - 1);
  const s1 = corr(y, bestLag);
  const s2 = corr(y, bestLag + 1);
  const shift = (s0 - s2) / (2 * (s0 - 2 * s1 + s2) || 1e-9);
  return sampleRate / (bestLag + (Number.isFinite(shift) ? shift : 0));
}

export function slice(x: Float32Array, t0: number, t1: number): Float32Array {
  return x.slice(Math.floor(t0 * SR), Math.floor(t1 * SR));
}

// ---------------------------------------------------------------------------
// RBJ Biquad：离线复刻浏览器 BiquadFilter 链
// ---------------------------------------------------------------------------

export class Biquad {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  x1 = 0;
  x2 = 0;
  y1 = 0;
  y2 = 0;

  set(type: 'peaking' | 'bandpass' | 'lowpass' | 'highpass', f: number, q: number, dbGain = 0) {
    const w0 = (2 * Math.PI * f) / SR;
    const cosw = Math.cos(w0);
    const sinw = Math.sin(w0);
    const alpha = sinw / (2 * q);
    let a0 = 1;
    switch (type) {
      case 'peaking': {
        const A = Math.pow(10, dbGain / 40);
        this.b0 = 1 + alpha * A;
        this.b1 = -2 * cosw;
        this.b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        this.a1 = -2 * cosw;
        this.a2 = 1 - alpha / A;
        break;
      }
      case 'bandpass':
        this.b0 = alpha;
        this.b1 = 0;
        this.b2 = -alpha;
        a0 = 1 + alpha;
        this.a1 = -2 * cosw;
        this.a2 = 1 - alpha;
        break;
      case 'lowpass':
        this.b0 = (1 - cosw) / 2;
        this.b1 = 1 - cosw;
        this.b2 = (1 - cosw) / 2;
        a0 = 1 + alpha;
        this.a1 = -2 * cosw;
        this.a2 = 1 - alpha;
        break;
      case 'highpass':
        this.b0 = (1 + cosw) / 2;
        this.b1 = -(1 + cosw);
        this.b2 = (1 + cosw) / 2;
        a0 = 1 + alpha;
        this.a1 = -2 * cosw;
        this.a2 = 1 - alpha;
        break;
    }
    this.b0 /= a0;
    this.b1 /= a0;
    this.b2 /= a0;
    this.a1 /= a0;
    this.a2 /= a0;
  }

  process(x: number): number {
    const y =
      this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

// ---------------------------------------------------------------------------
// 高胡离线渲染：谐波谱 + 循环粉噪弓噪 + 琴筒共振峰（与 audioSynth 等价）
// ---------------------------------------------------------------------------

// 明亮钢弦谐波包络（PeriodicWave 浏览器端自动归一化）
export const GAOHU_HARM = [
  1, 0.78, 0.62, 0.5, 0.4, 0.3, 0.22, 0.15, 0.1, 0.065, 0.04, 0.025, 0.015,
];

export interface GaohuNote {
  f: number;
  start: number;
}

export function renderGaohuPhrase(notes: GaohuNote[], noteDur: number, tail: number): Float32Array {
  const total = notes.length * noteDur + tail;
  const L = Math.floor(SR * total);
  const raw = new Float32Array(L);
  let phi = 0;
  // 粉噪（Paul Kellett 滤波器）状态
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  const noiseHp = new Biquad();
  noiseHp.set('highpass', 900, 0.707);
  const noiseBp = new Biquad();

  const pitchAt = (t: number): number => {
    const idx = Math.min(notes.length - 1, Math.floor(t / noteDur));
    const target = notes[idx].f;
    const local = t - idx * noteDur;
    if (idx === 0) {
      // 起弓自下方约 0.35 半音快速到位
      const from = target * Math.pow(2, -0.35 / 12);
      if (local < 0.055) {
        return Math.exp(Math.log(from) + (Math.log(target) - Math.log(from)) * (local / 0.055));
      }
      return target;
    }
    if (local < 0.075) {
      // 连弓：75ms 对数滑音指向下一音
      const prev = notes[idx - 1].f;
      return Math.exp(Math.log(prev) + (Math.log(target) - Math.log(prev)) * (local / 0.075));
    }
    return target;
  };

  for (let n = 0; n < L; n++) {
    const t = n / SR;
    const f = pitchAt(t);
    const swell = t < 0.12 ? 0 : Math.min(1, (t - 0.12) / 0.26);
    const vib = swell * f * 0.012 * Math.sin(2 * Math.PI * 5.2 * t); // 延迟揉弦
    const fv = f + vib;
    phi += (2 * Math.PI * fv) / SR;

    let tone = 0;
    for (let k = 1; k <= GAOHU_HARM.length; k++) tone += GAOHU_HARM[k - 1] * Math.sin(k * phi);
    tone *= 0.72;

    // 循环粉噪 → 高通 → 随音高移动的带通弓噪
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    let pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.25;
    b6 = white * 0.115926;
    pink = noiseHp.process(pink);
    noiseBp.set('bandpass', fv * 2.6, 0.7);
    let bow = noiseBp.process(pink);
    const noteIdx = Math.min(notes.length - 1, Math.floor(t / noteDur));
    const local = t - noteIdx * noteDur;
    // 仅起弓第一音有明显摩擦；连弓后续音只极轻一闪
    const bowEnv =
      noteIdx === 0
        ? 0.012 + 0.038 * Math.exp(-local / 0.03)
        : 0.012 + 0.008 * Math.exp(-local / 0.02);
    bow *= bowEnv;

    raw[n] = tone + bow;
  }

  // 琴筒通道：峰值共振峰组（只增强不滤除）→ 高频空气峰 → 低频切除 → 包络
  const out = new Float32Array(L);
  const peak1 = new Biquad();
  peak1.set('peaking', 1100, 2.0, 4);
  const peak2 = new Biquad();
  peak2.set('peaking', 2300, 2.5, 3);
  const peak3 = new Biquad();
  peak3.set('peaking', 3800, 3.0, 2.2);
  const peakAir = new Biquad();
  peakAir.set('peaking', 6500, 1.0, 2);
  const hp = new Biquad();
  hp.set('highpass', 180, 0.707);
  for (let n = 0; n < L; n++) {
    const t = n / SR;
    let s = raw[n];
    s = peak1.process(s);
    s = peak2.process(s);
    s = peak3.process(s);
    s = peakAir.process(s);
    s = hp.process(s);
    let env = Math.min(1, t / 0.05);
    const lastStart = (notes.length - 1) * noteDur;
    const relStart = lastStart + noteDur + 0.15;
    if (t > relStart) env *= Math.exp(-(t - relStart) / 0.11);
    out[n] = s * env * 0.16;
  }
  return out;
}
