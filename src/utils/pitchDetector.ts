/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import { DetectedNote } from '../types';

// 工尺谱音位表（十二平均律，A4=440）
// 正线 1=C（合尺定弦 sol-re）：低音组 合四一，中音组 上尺工凡六五乙，高音组加“亻”旁
export const GONGCHE_FREQUENCIES_C = [
  { char: '合', note: 'G3', freq: 196.00 },   // 低 sol
  { char: '四', note: 'A3', freq: 220.00 },   // 低 la
  { char: '一', note: 'B3', freq: 246.94 },   // 低 si
  { char: '上', note: 'C4', freq: 261.63 },   // do
  { char: '尺', note: 'D4', freq: 293.66 },   // re
  { char: '工', note: 'E4', freq: 329.63 },   // mi
  { char: '凡', note: 'F4', freq: 349.23 },   // fa
  { char: '六', note: 'G4', freq: 392.00 },   // sol
  { char: '五', note: 'A4', freq: 440.00 },   // la
  { char: '乙', note: 'B4', freq: 493.88 },   // si
  { char: '仩', note: 'C5', freq: 523.25 },   // 高 do
  { char: '伬', note: 'D5', freq: 587.33 },   // 高 re
  { char: '仜', note: 'E5', freq: 659.25 },   // 高 mi
  { char: '仮', note: 'F5', freq: 698.46 },   // 高 fa
  { char: '六高', note: 'G5', freq: 783.99 }, // 高 sol
  { char: '五高', note: 'A5', freq: 880.00 }  // 高 la
];

// D 调 1=D（《彩云追月》D 宫五声羽调、潮州筝 D 调定弦）
export const GONGCHE_FREQUENCIES_D = [
  { char: '合', note: 'A3', freq: 220.00 },   // 低 sol
  { char: '四', note: 'B3', freq: 246.94 },   // 低 la
  { char: '一', note: 'C#4', freq: 277.18 },  // 低 si
  { char: '上', note: 'D4', freq: 293.66 },   // do
  { char: '尺', note: 'E4', freq: 329.63 },   // re
  { char: '工', note: 'F#4', freq: 369.99 },  // mi
  { char: '凡', note: 'G4', freq: 392.00 },   // fa
  { char: '六', note: 'A4', freq: 440.00 },   // sol
  { char: '五', note: 'B4', freq: 493.88 },   // la
  { char: '乙', note: 'C#5', freq: 554.37 },  // si
  { char: '仩', note: 'D5', freq: 587.33 },   // 高 do
  { char: '伬', note: 'E5', freq: 659.25 },   // 高 re
  { char: '仜', note: 'F#5', freq: 739.99 },  // 高 mi
  { char: '仮', note: 'G5', freq: 783.99 },   // 高 fa
  { char: '六高', note: 'A5', freq: 880.00 }, // 高 sol
  { char: '五高', note: 'B5', freq: 987.77 }  // 高 la
];

export type GongcheMode = 'zhengxian' | 'yudiao';

export function getGongcheTable(mode: GongcheMode = 'zhengxian') {
  return mode === 'yudiao' ? GONGCHE_FREQUENCIES_D : GONGCHE_FREQUENCIES_C;
}

// Autocorrelation algorithm for pitch detection
// Returns fundamental frequency in Hz or -1 if no pitch is detected
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  // Perform simple signal preprocessing: find root-mean-square (RMS) of the signal
  let sumOfSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumOfSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumOfSquares / buffer.length);

  // If the signal is too quiet, do not attempt pitch detection
  if (rms < 0.008) {
    return -1;
  }

  // Trim the signal first (clipping quiet headers or tail end)
  let r1 = 0;
  let r2 = buffer.length - 1;
  const thres = 0.2;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
    } else {
      break;
    }
  }
  for (let i = buffer.length - 1; i > buffer.length / 2; i--) {
    if (Math.abs(buffer[i]) < thres) {
      r2 = i;
    } else {
      break;
    }
  }

  const signal = buffer.subarray(r1, r2);
  if (signal.length < 64) {
    return -1; // Not enough signal
  }

  // Calculate autocorrelation values
  const c = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    for (let j = 0; j < signal.length - i; j++) {
      c[i] = c[i] + signal[j] * signal[j + i];
    }
  }

  // Find the first zero-crossing
  let d = 0;
  while (d < c.length && c[d] > 0) {
    d++;
  }

  // Find the peak after the zero-crossing within human voice and typical instrument bounds (70Hz - 1000Hz)
  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < c.length; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }

  const T0 = maxPos;

  // Validate the peak
  if (T0 > 0 && maxVal > 0.02) {
    // Parabolic interpolation for fine tuning of the peak position
    let x1 = c[T0 - 1] || 0;
    let x2 = c[T0];
    let x3 = c[T0 + 1] || 0;

    const denominator = (x1 - 2 * x2 + x3);
    let offset = 0;
    if (Math.abs(denominator) > 0.0001) {
      offset = (x1 - x3) / (2 * denominator);
    }

    const refinedPeriod = T0 + offset;
    const pitchFreq = sampleRate / refinedPeriod;

    // Reject unrealistic pitch values for human/plucked bounds in this module
    if (pitchFreq > 65 && pitchFreq < 1200) {
      return pitchFreq;
    }
  }

  return -1;
}

// Convert absolute frequency to its nearest traditional Lingnan note details
export function getGongcheFromFrequency(frequency: number, mode: GongcheMode = 'zhengxian'): DetectedNote | null {
  if (frequency <= 0) return null;

  const table = getGongcheTable(mode);

  // Find the closest frequency matches
  let closestIdx = 0;
  let minDist = Number.MAX_VALUE;

  for (let i = 0; i < table.length; i++) {
    const dist = Math.abs(frequency - table[i].freq);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  const match = table[closestIdx];

  // Calculate cents deviation: 1200 * log2(f / f_target)
  const deviation = Math.round(1200 * Math.log2(frequency / match.freq));

  // Estimate a mock clarity/confidence based on signal parameters (normally supplied higher)
  const clarity = Math.max(0.2, 1 - Math.min(0.8, Math.abs(deviation) / 100));

  return {
    pitch: match.note,
    gongche: match.char,
    frequency: Math.round(frequency * 10) / 10,
    clarity,
    deviation
  };
}
