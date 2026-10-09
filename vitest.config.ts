import { defineConfig } from 'vitest/config';

// 独立于 vite.config.ts：测试运行在 Node 环境，不加载 Electron / React 构建插件。
// 音频引擎的波导弦振为纯函数，可直接在 Node 离线渲染断言；高胡弓弦链路的
// 数学复刻见 test/helpers/offline-dsp.ts。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
