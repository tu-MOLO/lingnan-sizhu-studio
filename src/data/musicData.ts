/**
 * Copyright (c) 2026 Molo
 * SPDX-License-Identifier: MIT
 */

import { Repertoire, Instrument } from '../types';

export const REPERTOIRES: Repertoire[] = [
  {
    id: 'yudabajiao',
    title: '《雨打芭蕉》',
    description:
      '早期广东音乐代表作之一。其描写初夏时节，淅淅沥沥的急雨敲击芭蕉叶声音，极为灵动。乐曲中时而疏落时而密集的音符交织，完美映射了岭南雅致多雨的院落意境、闲适儒雅的文人情怀。',
    lyricContext: '细腻闲适：节奏舒缓、短促。音阶多跳跃，如雨滴敲击斑驳芭蕉叶片，脆响回荡庭院。',
    tempo: 75,
    mode: 'zhengxian',
    instrument: 'yangqin',
    notes: [
      // 3 . 2
      { pitch: 'E4', gongche: '工', duration: 1.5 },
      { pitch: 'D4', gongche: '尺', duration: 0.5 },
      // 1 2 5 3 2 3 5
      { pitch: 'C4', gongche: '上', duration: 0.5 },
      { pitch: 'D4', gongche: '尺', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'D4', gongche: '尺', duration: 0.25 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      // 2 3 5 6 1. 5
      { pitch: 'D4', gongche: '尺', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      { pitch: 'A4', gongche: '五', duration: 0.5 },
      { pitch: 'C5', gongche: '仩', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      // 3 5 3 5 3 2
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'D4', gongche: '尺', duration: 0.25 },
      // 1 . 3 2 2 3
      { pitch: 'C4', gongche: '上', duration: 1.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'D4', gongche: '尺', duration: 0.5 },
      { pitch: 'D4', gongche: '尺', duration: 0.25 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
    ],
  },
  {
    id: 'bubugao',
    title: '《步步高》',
    description:
      '广东音乐名家吕文成创作的经典作品。旋律清新明快，节奏富有弹性，表现了奋发向上、步步高升的欢快情绪，是广府音乐软弓组合（高胡、扬琴、秦琴“三件头”）的巅峰代表作品。',
    lyricContext:
      '明朗欢快：琴弓如飞，乐音如流泉般拾级而上。演奏时注意每一个顿音与切分音的跳跃感。',
    tempo: 100,
    mode: 'zhengxian',
    instrument: 'gaohu',
    notes: [
      // (1 3 5 3 | 1 3 5 3)
      { pitch: 'C4', gongche: '上', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'C4', gongche: '上', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      // 3 3 5
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      { pitch: 'G4', gongche: '六', duration: 1.0 },
      // 5 3 2 3 1 2（高八度：六高 仜 伬 仜 仩 伬）
      { pitch: 'G5', gongche: '六高', duration: 0.25 },
      { pitch: 'E5', gongche: '仜', duration: 0.25 },
      { pitch: 'D5', gongche: '伬', duration: 0.25 },
      { pitch: 'E5', gongche: '仜', duration: 0.25 },
      { pitch: 'C5', gongche: '仩', duration: 0.25 },
      { pitch: 'D5', gongche: '伬', duration: 0.25 },
      // 6 1 5 5（低音 la=四，do=上，sol=六）
      { pitch: 'A3', gongche: '四', duration: 0.5 },
      { pitch: 'C4', gongche: '上', duration: 0.5 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      // 0 3 5 2 3（首音 0 为休止符）
      { pitch: 'C4', gongche: '休', duration: 0.25, rest: true },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'D4', gongche: '尺', duration: 0.5 },
      { pitch: 'E4', gongche: '工', duration: 0.5 },
      // 5 3 5 1. 3.
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      { pitch: 'E4', gongche: '工', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'C5', gongche: '仩', duration: 0.5 },
      { pitch: 'E5', gongche: '仜', duration: 0.5 },
      // 5 4 5 3
      { pitch: 'G4', gongche: '六', duration: 0.5 },
      { pitch: 'F4', gongche: '凡', duration: 0.25 },
      { pitch: 'G4', gongche: '六', duration: 0.25 },
      { pitch: 'E4', gongche: '工', duration: 1.0 },
    ],
  },
  {
    id: 'caiyunchuyue',
    title: '《彩云追月》',
    description:
      '任光 1935 年创作于上海的民族管弦乐曲（与聂耳同为百代唱片国乐队时期作品，1960 年彭修文重新配器）。乐曲以五声音阶写成，通行记谱作 1=D，旋律以“6”（B）为主音，属 D 宫系统的五声羽调式；其探戈式节奏与五声性旋律深具广东音乐风韵，描绘彩云追月、交相辉映的幽雅画面。',
    lyricContext:
      '婉转深切：旋律平稳而空灵，极富诗情画意，使用重音与长音来衬托明月与晚云的交替追逐。',
    tempo: 72,
    mode: 'yudiao',
    instrument: 'zheng',
    notes: [
      // 5. 6 1 2 3 5（D 调：5=合 6=四 1=上 2=尺 3=工 5=六）
      { pitch: 'A3', gongche: '合', duration: 1.5 },
      { pitch: 'B3', gongche: '四', duration: 0.5 },
      { pitch: 'D4', gongche: '上', duration: 0.5 },
      { pitch: 'E4', gongche: '尺', duration: 0.5 },
      { pitch: 'F#4', gongche: '工', duration: 0.5 },
      { pitch: 'A4', gongche: '六', duration: 0.5 },
      // 6 - - -
      { pitch: 'B4', gongche: '五', duration: 4.0 },
      // 6 1. 6 5 3 5
      { pitch: 'B4', gongche: '五', duration: 0.5 },
      { pitch: 'D5', gongche: '仩', duration: 0.5 },
      { pitch: 'B4', gongche: '五', duration: 0.5 },
      { pitch: 'A4', gongche: '六', duration: 0.5 },
      { pitch: 'F#4', gongche: '工', duration: 1.0 },
      { pitch: 'A4', gongche: '六', duration: 1.0 },
      // 6 1. 6 5 3 5 (repeat bar 4)
      { pitch: 'B4', gongche: '五', duration: 0.5 },
      { pitch: 'D5', gongche: '仩', duration: 0.5 },
      { pitch: 'B4', gongche: '五', duration: 0.5 },
      { pitch: 'A4', gongche: '六', duration: 0.5 },
      { pitch: 'F#4', gongche: '工', duration: 1.0 },
      { pitch: 'A4', gongche: '六', duration: 1.0 },
      // 6 1. 6 5 3 5 6  3 - - -
      { pitch: 'B4', gongche: '五', duration: 0.5 },
      { pitch: 'D5', gongche: '仩', duration: 0.5 },
      { pitch: 'B4', gongche: '五', duration: 0.5 },
      { pitch: 'A4', gongche: '六', duration: 0.5 },
      { pitch: 'F#4', gongche: '工', duration: 0.5 },
      { pitch: 'A4', gongche: '六', duration: 0.5 },
      { pitch: 'B4', gongche: '五', duration: 1.0 },
      { pitch: 'F#4', gongche: '工', duration: 4.0 },
    ],
  },
];

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'gaohu',
    name: '高胡',
    enName: 'Gaohu',
    description:
      '高音二胡的简称，又称粤胡、南胡。其形制与二胡相似，但琴筒更细小。二十世纪二十年代，吕文成在二胡基础上创制高胡：改用钢丝弦、将琴筒夹于两腿之间以抑制沙音，并把定弦提高纯四度，定为 g1-d2（G4-D5，即正线“合尺”sol-re 定弦），音色清澈、嘹亮而高亢。',
    history:
      '由吕文成于二十世纪二十年代在二胡基础上改良创制，是广东音乐软弓组合的“头架”主奏乐器。琴筒为圆形竹筒，蒙蟒皮，两腿夹持；通过左手滑指与按弦，奏出“绰、注、回滑”等丰富的滑音与揉弦韵味。',
    character: '高亢明亮、华丽流畅，既善于演奏动感欢快的“正线”曲调，也能表现委婉哀怨的“乙反”情绪。',
    icon: '🎻',
    notes: [
      // 正线 1=C，内弦 G4（六/合=sol）、外弦 D5（伬/尺=re）
      { name: '六', pitch: 'G4', frequency: 392.0, description: '内弦空弦（合=sol）' },
      { name: '五', pitch: 'A4', frequency: 440.0, description: '一指按弦（la）' },
      { name: '乙', pitch: 'B4', frequency: 493.88, description: '二指按弦（si）' },
      { name: '仩', pitch: 'C5', frequency: 523.25, description: '高 do，内弦高把位' },
      { name: '伬', pitch: 'D5', frequency: 587.33, description: '外弦空弦（尺=re）' },
      { name: '仜', pitch: 'E5', frequency: 659.25, description: '外弦一指（高 mi）' },
      { name: '仮', pitch: 'F5', frequency: 698.46, description: '外弦二指（高 fa）' },
      { name: '六高', pitch: 'G5', frequency: 783.99, description: '高 sol，明亮华丽' },
    ],
  },
  {
    id: 'yangqin',
    name: '扬琴',
    enName: 'Yangqin',
    description:
      '中国传统的击弦乐器，其音色清脆、亮丽，表现力极其丰富。在广东音乐中，扬琴与高胡、秦琴合称为软弓“三件头”，是奠定岭南民乐清朗水乡色彩的基石之一。',
    history:
      '明朝后期通过海上丝绸之路从西亚传入广东，并在岭南民乐社群中迅速汉化，形成了独具一格的“粤派”扬琴。粤派扬琴演奏风格以清脆、流利、常用“衬音”、“坐音”和“密双打”著称。',
    character: '颗粒感强、行云流水、音区宽广。犹如珠落玉盘、泉水叮咚，给人一种珠圆玉润的润泽美感。',
    icon: '🎹',
    notes: [
      // 正线 1=C：合四一上尺工凡六
      { name: '合', pitch: 'G3', frequency: 196.0, description: '低音 sol，浑厚底座' },
      { name: '四', pitch: 'A3', frequency: 220.0, description: '低音 la，古朴踏实' },
      { name: '一', pitch: 'B3', frequency: 246.94, description: '低音 si，温润过渡' },
      { name: '上', pitch: 'C4', frequency: 261.63, description: '中音 do，调式主音' },
      { name: '尺', pitch: 'D4', frequency: 293.66, description: 're，明澈空灵' },
      { name: '工', pitch: 'E4', frequency: 329.63, description: 'mi，阳光温暖' },
      { name: '凡', pitch: 'F4', frequency: 349.23, description: 'fa，清微淡远' },
      { name: '六', pitch: 'G4', frequency: 392.0, description: '中音 sol，金石之音' },
    ],
  },
  {
    id: 'zheng',
    name: '潮州筝',
    enName: 'Chaozhou Zheng',
    description:
      '又称“二四谱古筝”，是岭南三大地方音乐中“潮州音乐”的重要流派。以“轻六”“重六”“活五”等独特调式，配合左手极其丰富的按滑吟颤，表达潮汕人深沉细腻的大地情怀。',
    history:
      '源于中原，历经唐宋流传至粤东潮汕平原，独立演变至今。潮筝至今保留着极其古老的“二四谱”视唱系统，不称“哆来咪”，而以“二、三、四、五、六、七、八”对应 sol、la、do、re、mi、高 sol、高 la 等音位。其“活五调”以 re 音游移颤按著称，被认为是中国最令人动容的悲怆乐调之一。',
    character: '古朴优雅、深沉悠远、左手重吟按弦，极富南国传统园林的书卷儒雅之气。',
    icon: '🎋',
    notes: [
      // D 调（四=D=do）：合四一上尺工六五
      { name: '合', pitch: 'A3', frequency: 220.0, description: '低音 sol，空谷禅鸣' },
      { name: '四', pitch: 'B3', frequency: 246.94, description: '低音 la，悠扬苍劲' },
      { name: '一', pitch: 'C#4', frequency: 277.18, description: '低音 si，竹影婆娑' },
      { name: '上', pitch: 'D4', frequency: 293.66, description: '中音 do，素手初抚' },
      { name: '尺', pitch: 'E4', frequency: 329.63, description: 're，飞瀑漱石' },
      { name: '工', pitch: 'F#4', frequency: 369.99, description: 'mi，晚风拂面' },
      { name: '六', pitch: 'A4', frequency: 440.0, description: '中音 sol，弦间皓月' },
      { name: '五', pitch: 'B4', frequency: 493.88, description: '中音 la，羽衣飞升' },
    ],
  },
];
