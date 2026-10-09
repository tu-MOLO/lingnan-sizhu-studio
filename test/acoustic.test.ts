/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

/**
 * 声学回归：
 * - 扬琴 / 潮州筝直接调用引擎的 Karplus-Strong 波导纯函数，校验有限值、
 *   峰值电平、自然衰减、基频准确度与潮州筝活五按滑；
 * - 高胡浏览器端基于 Web Audio 节点，使用 test/helpers/offline-dsp.ts 的
 *   等价离线复刻，校验基频、连弓滑音连续性与电平。
 */
import { describe, it, expect } from 'vitest';
import {
  renderPluckedString,
  yangqinRenderOptions,
  zhengRenderOptions,
} from '../src/utils/audioSynth';
import {
  SR,
  isFiniteSamples,
  peakOf,
  rms,
  detectPitch,
  slice,
  renderGaohuPhrase,
} from './helpers/offline-dsp';

describe('Karplus-Strong 波导弦振（引擎纯函数）', () => {
  const yq440 = renderPluckedString(SR, 440, yangqinRenderOptions(440));
  const yq196 = renderPluckedString(SR, 196, yangqinRenderOptions(196));
  const yq1760 = renderPluckedString(SR, 1760, yangqinRenderOptions(1760));
  const zh294 = renderPluckedString(SR, 293.66, zhengRenderOptions(293.66, 0));
  const zh294Bend = renderPluckedString(SR, 293.66, zhengRenderOptions(293.66, 1.5));

  const buffers: [string, Float32Array][] = [
    ['扬琴 A4', yq440],
    ['扬琴 G3', yq196],
    ['扬琴 A6（奖励高音）', yq1760],
    ['潮州筝 D4', zh294],
    ['潮州筝 D4 活五', zh294Bend],
  ];

  for (const [name, buf] of buffers) {
    it(`${name}：无 NaN/Infinity`, () => {
      expect(isFiniteSamples(buf)).toBe(true);
    });

    it(`${name}：峰值电平在合理范围`, () => {
      const pk = peakOf(buf);
      expect(pk).toBeGreaterThan(0.5);
      expect(pk).toBeLessThanOrEqual(1);
    });
  }

  it('扬琴余音自然衰减（尾/头 RMS 比 < 2%）', () => {
    const tail = rms(yq440, yq440.length - SR * 0.4, yq440.length);
    const head = rms(yq440, Math.floor(0.02 * SR), Math.floor(0.22 * SR));
    expect(tail / head).toBeLessThan(0.02);
  });

  it('潮州筝余音自然衰减（尾/头 RMS 比 < 2%）', () => {
    const tail = rms(zh294, zh294.length - SR * 0.4, zh294.length);
    const head = rms(zh294, Math.floor(0.02 * SR), Math.floor(0.22 * SR));
    expect(tail / head).toBeLessThan(0.02);
  });

  it('扬琴 A4 基频 ≈ 440Hz（误差 < 2.5%）', () => {
    const p = detectPitch(slice(yq440, 0.15, 0.45));
    expect(Math.abs(p - 440) / 440).toBeLessThan(0.025);
  });

  it('扬琴 G3 基频 ≈ 196Hz（误差 < 2.5%）', () => {
    const p = detectPitch(slice(yq196, 0.15, 0.5));
    expect(Math.abs(p - 196) / 196).toBeLessThan(0.025);
  });

  it('潮州筝 D4 基频 ≈ 293.66Hz（含吟弦，误差 < 2.5%）', () => {
    const p = detectPitch(slice(zh294, 0.55, 1.0));
    expect(Math.abs(p - 293.66) / 293.66).toBeLessThan(0.025);
  });

  it('潮州筝活五按滑后基频上移约 1.5 半音（误差 < 3.5%）', () => {
    const target = 293.66 * Math.pow(2, 1.5 / 12);
    const p = detectPitch(slice(zh294Bend, 0.7, 1.2));
    expect(Math.abs(p - target) / target).toBeLessThan(0.035);
  });
});

describe('高胡弓弦链路（离线数学复刻）', () => {
  it('单音 C5 基频准确、电平正常且不削顶', () => {
    const buf = renderGaohuPhrase([{ f: 523.25, start: 0 }], 0.6, 0.5);
    expect(isFiniteSamples(buf)).toBe(true);
    const pk = peakOf(buf);
    expect(pk).toBeGreaterThan(0.02);
    expect(pk).toBeLessThanOrEqual(1);
    const p = detectPitch(slice(buf, 0.2, 0.45));
    expect(Math.abs(p - 523.25) / 523.25).toBeLessThan(0.03);
  });

  it('高把位 G5 基频仍准确', () => {
    const buf = renderGaohuPhrase([{ f: 783.99, start: 0 }], 0.6, 0.5);
    const p = detectPitch(slice(buf, 0.2, 0.45));
    expect(Math.abs(p - 783.99) / 783.99).toBeLessThan(0.03);
  });

  it('连弓 C5→E5 为连续滑音：起音、过渡、落音逐段正确', () => {
    const buf = renderGaohuPhrase(
      [
        { f: 523.25, start: 0 },
        { f: 659.25, start: 0.3 },
      ],
      0.3,
      0.4
    );
    expect(isFiniteSamples(buf)).toBe(true);
    const pFirst = detectPitch(slice(buf, 0.12, 0.27));
    const pMid = detectPitch(slice(buf, 0.305, 0.37));
    const pNext = detectPitch(slice(buf, 0.42, 0.57));
    expect(Math.abs(pFirst - 523.25) / 523.25).toBeLessThan(0.03);
    // 过渡窗音高必须夹在两音之间，证明是滑音而非硬跳变
    expect(pMid).toBeGreaterThan(545);
    expect(pMid).toBeLessThan(645);
    expect(Math.abs(pNext - 659.25) / 659.25).toBeLessThan(0.03);
  });
});
