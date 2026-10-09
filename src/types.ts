/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

export type InstrumentId = 'gaohu' | 'yangqin' | 'zheng';

export interface Instrument {
  id: InstrumentId;
  name: string;
  enName: string;
  description: string;
  history: string;
  character: string;
  icon: string;
  notes: {
    name: string;      // Gongche character, e.g. "合", "四"
    pitch: string;     // Western notation, e.g. "G3", "A3"
    frequency: number; // Hz
    description?: string;
  }[];
}

export interface SongNote {
  pitch: string;     // Western, e.g. "C4"
  gongche: string;   // Gongche notation, e.g. "上"；休止符记为 "休"
  duration: number;  // Beat length, e.g., 1 for quarter note, 0.5 for eighth note, 2 for half note
  beated?: boolean;  // Whether it has a standard board (板/眼) clap
  rest?: boolean;    // 休止符：只占时值，不发声、不计分
}

export interface Repertoire {
  id: string;
  title: string;
  description: string;
  lyricContext?: string; // Musical context/mood description
  notes: SongNote[];
  tempo: number; // BPM
  // 正线（1=C，合尺定弦）；D 宫五声羽调（1=D，彩云追月）
  mode: 'zhengxian' | 'yudiao';
  // 该曲目在游戏中的主奏乐器
  instrument: InstrumentId;
}

export interface DetectedNote {
  pitch: string;
  gongche: string;
  frequency: number;
  clarity: number; // 0 to 1 confidence
  deviation: number; // Cents deviation
}
