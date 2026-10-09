# 参与贡献 / Contributing

感谢你对「岭南丝竹 · Gongche Studio」的兴趣！这是一个用纯 Web Audio 物理建模复原岭南
丝竹乐器、并让工尺谱“可听、可玩、可识唱”的开源项目。欢迎提交 Issue、修复 Bug、补充
曲目与乐理内容、改进声学模型。

## 开发环境

- Node.js **20 及以上**、npm 10+
- 克隆后安装依赖：

```bash
npm ci
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（默认端口 3000） |
| `npm run build` | 类型检查并构建生产产物到 `dist/` |
| `npm run preview` | 本地预览构建产物 |
| `npm test` | 运行 Vitest 单元测试（乐理 + 声学） |
| `npm run typecheck` | 仅运行 TypeScript 类型检查 |
| `npm run lint` | 运行 ESLint |
| `npm run format` | 用 Prettier 格式化全仓代码 |

提交前请确保以下命令全部通过：

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

## 目录速览

```
src/
  utils/audioSynth.ts    # 物理建模音频引擎（波导 / 弓弦 / 卷积混响）
  utils/pitchDetector.ts # 自相关测音高与工尺谱换算
  data/musicData.ts      # 曲目、乐器与工尺谱数据
  components/            # 四大交互模块的 React 组件
test/                    # Vitest 乐理与声学断言
docs/                    # 架构说明与截图
```

声学链路与参数详见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 贡献流程

1. Fork 仓库并从 `main` 切出描述性分支，如 `feat/zheng-glissando`、`fix/gaohu-vibrato`。
2. 提交信息建议遵循[约定式提交](https://www.conventionalcommits.org/zh-hans/)：
   `feat:` / `fix:` / `docs:` / `test:` / `refactor:` / `chore:`。
3. 保持代码风格与仓库一致（Prettier 已配置，提交前跑 `npm run format`）。
4. 推送分支并发起 Pull Request，按 PR 模板填写说明。

## 特别约定（本项目的“硬约束”）

- **改动音频 DSP（`audioSynth.ts`）或乐理 / 曲目数据（`musicData.ts`、`pitchDetector.ts`）时，
  必须同步新增或修改 `test/` 下的断言**，并在 PR 中说明声学 / 乐理依据（可附文献或听感对比）。
  纯主观“更好听”而无可复现验证的参数调整通常不会被合并。
- 工尺谱相关内容须区分**正线 1=C** 与**五声羽调 1=D** 两套调表，不要混用；二四谱、乙反调
  等专业表述请核对权威来源后再写。
- 项目保持**零采样、零外部音频资源、纯前端离线运行**，请勿引入音频文件 CDN、在线 API 或
  需要后端的能力。
- 界面文案使用简体中文，术语保持“高胡 / 扬琴 / 潮州筝 / 工尺谱”等规范称谓。

## 行为准则

参与本项目即表示你同意遵守 [行为准则](CODE_OF_CONDUCT.md)。请在所有交流中保持友善与尊重。
