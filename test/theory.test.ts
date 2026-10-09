/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

/**
 * 乐理一致性回归：工尺字 ↔ 音名 ↔ 频率 全表核对。
 * 锁定正线 1=C 与 D 宫羽调两套工尺表、三首曲目与乐器音位的理论正确性，
 * 任何对乐谱、调式、音高换算的改动若破坏传统乐理，都会在此失败。
 */
import { describe, it, expect } from 'vitest';
import { REPERTOIRES, INSTRUMENTS } from '../src/data/musicData';
import {
  getGongcheFromFrequency,
  GONGCHE_FREQUENCIES_C,
  GONGCHE_FREQUENCIES_D,
  type GongcheMode,
} from '../src/utils/pitchDetector';
import { pitchToFreq } from '../src/utils/audioSynth';

// 十二平均律参考表（A4 = 440Hz）
const EXPECTED: Record<string, number> = {
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  'C#4': 277.18,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  'F#4': 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  'C#5': 554.37,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  'F#5': 739.99,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
};

describe('pitchToFreq 十二平均律换算', () => {
  Object.entries(EXPECTED).forEach(([pitch, freq]) => {
    it(`${pitch} = ${freq} Hz`, () => {
      // 数据表保留两位小数，容差 0.02Hz（远小于 1 音分）
      expect(Math.abs(pitchToFreq(pitch) - freq)).toBeLessThan(0.02);
    });
  });
});

describe('工尺音位表', () => {
  const tables = [
    { name: '正线 1=C（合=G）', rows: GONGCHE_FREQUENCIES_C },
    { name: '羽调 1=D（合=A）', rows: GONGCHE_FREQUENCIES_D },
  ];

  for (const { name, rows } of tables) {
    describe(name, () => {
      it('每个工尺字频率与其音名一致', () => {
        for (const row of rows) {
          expect(row.freq, `${row.char} → ${row.note}`).toBeCloseTo(EXPECTED[row.note], 2);
        }
      });

      it('频率随音位严格递增', () => {
        for (let i = 1; i < rows.length; i++) {
          expect(rows[i].freq, rows[i].char).toBeGreaterThan(rows[i - 1].freq);
        }
      });
    });
  }

  it('正线锚点：合=G3 上=C4 凡=F4 六=G4 乙=B4', () => {
    const map = Object.fromEntries(GONGCHE_FREQUENCIES_C.map((r) => [r.char, r.note]));
    expect(map['合']).toBe('G3');
    expect(map['上']).toBe('C4');
    expect(map['凡']).toBe('F4');
    expect(map['六']).toBe('G4');
    expect(map['乙']).toBe('B4');
  });

  it('羽调锚点：合=A3 上=D4 工=F#4 六=A4 五=B4', () => {
    const map = Object.fromEntries(GONGCHE_FREQUENCIES_D.map((r) => [r.char, r.note]));
    expect(map['合']).toBe('A3');
    expect(map['上']).toBe('D4');
    expect(map['工']).toBe('F#4');
    expect(map['六']).toBe('A4');
    expect(map['五']).toBe('B4');
  });
});

describe('三首曲目逐音工尺标注', () => {
  const KEYBOARD: Record<GongcheMode, string[]> = {
    zhengxian: [
      '合',
      '四',
      '一',
      '上',
      '尺',
      '工',
      '凡',
      '六',
      '五',
      '乙',
      '仩',
      '伬',
      '仜',
      '仮',
      '六高',
      '五高',
    ],
    yudiao: ['合', '四', '一', '上', '尺', '工', '凡', '六', '五', '乙', '仩'],
  };

  const META: Record<string, { mode: GongcheMode; instrument: string }> = {
    yudabajiao: { mode: 'zhengxian', instrument: 'yangqin' },
    bubugao: { mode: 'zhengxian', instrument: 'gaohu' },
    caiyunchuyue: { mode: 'yudiao', instrument: 'zheng' },
  };

  for (const song of REPERTOIRES) {
    it(`${song.title}（${song.id}）调式、乐器与逐音工尺`, () => {
      const meta = META[song.id];
      if (!meta) throw new Error(`未知曲目 ${song.id}`);
      expect(song.mode).toBe(meta.mode);
      expect(song.instrument).toBe(meta.instrument);

      let restCount = 0;
      for (const note of song.notes) {
        if (note.rest) {
          restCount++;
          expect(note.gongche, '休止符工尺字应为“休”').toBe('休');
          continue;
        }
        const freq = pitchToFreq(note.pitch);
        const detected = getGongcheFromFrequency(freq, song.mode);
        expect(detected, `${song.title} ${note.pitch} 应能反查工尺字`).not.toBeNull();
        expect(detected!.gongche, `${song.title} ${note.pitch}(${freq.toFixed(1)}Hz)`).toBe(
          note.gongche
        );
        expect(KEYBOARD[song.mode], `${song.title} 工尺字 ${note.gongche}`).toContain(note.gongche);
      }

      if (song.id === 'bubugao') {
        expect(restCount, '《步步高》应含 1 个休止符').toBe(1);
      } else {
        expect(restCount, `${song.title} 不应含休止符`).toBe(0);
      }
    });
  }
});

describe('乐器音位表', () => {
  for (const inst of INSTRUMENTS) {
    it(`${inst.name}：音名 ↔ 频率 ↔ 工尺字一致`, () => {
      const mode: GongcheMode = inst.id === 'zheng' ? 'yudiao' : 'zhengxian';
      for (const note of inst.notes) {
        expect(
          Math.abs(note.frequency - pitchToFreq(note.pitch)),
          `${inst.name} ${note.pitch}`
        ).toBeLessThan(0.02);
        const detected = getGongcheFromFrequency(note.frequency, mode);
        expect(detected!.gongche, `${inst.name} 音位 ${note.name}`).toBe(note.name);
      }
    });
  }
});

describe('乐器音域与定弦序列', () => {
  const gaohu = INSTRUMENTS.find((i) => i.id === 'gaohu')!;
  const zheng = INSTRUMENTS.find((i) => i.id === 'zheng')!;
  const yangqin = INSTRUMENTS.find((i) => i.id === 'yangqin')!;

  it('高胡乐器表音域限定在 G4–G5', () => {
    const first = gaohu.notes[0].frequency;
    const last = gaohu.notes[gaohu.notes.length - 1].frequency;
    expect(first).toBeGreaterThanOrEqual(391.9);
    expect(last).toBeLessThanOrEqual(784.1);
  });

  it('《步步高》高胡声部移高八度后仍落在 G4–G6 音域', () => {
    const song = REPERTOIRES.find((r) => r.id === 'bubugao')!;
    for (const note of song.notes) {
      if (note.rest) continue;
      const sounding = pitchToFreq(note.pitch) * 2; // 高胡实际发音高纯八度
      expect(sounding, note.pitch).toBeGreaterThanOrEqual(392);
      expect(sounding, note.pitch).toBeLessThanOrEqual(1568.5);
    }
  });

  it('潮州筝为 D 调五声序列 A3 → B4', () => {
    expect(zheng.notes[0].pitch).toBe('A3');
    expect(zheng.notes[zheng.notes.length - 1].pitch).toBe('B4');
    expect(zheng.notes.map((n) => n.pitch).join(',')).toBe('A3,B3,C#4,D4,E4,F#4,A4,B4');
  });

  it('扬琴为 C 调序列 G3 → G4', () => {
    expect(yangqin.notes.map((n) => n.pitch).join(',')).toBe('G3,A3,B3,C4,D4,E4,F4,G4');
  });
});

describe('代表曲目旋律骨干', () => {
  it('《彩云追月》首句为 1=D 的 5·6 1 2 3 5 | 6', () => {
    const song = REPERTOIRES.find((r) => r.id === 'caiyunchuyue')!;
    expect(
      song.notes
        .slice(0, 7)
        .map((n) => n.pitch)
        .join(',')
    ).toBe('A3,B3,D4,E4,F#4,A4,B4');
  });

  it('《雨打芭蕉》开头骨干 3 2 1 2 5 …', () => {
    const song = REPERTOIRES.find((r) => r.id === 'yudabajiao')!;
    expect(song.notes[0].pitch).toBe('E4');
    expect(song.notes[2].pitch).toBe('C4');
  });
});
