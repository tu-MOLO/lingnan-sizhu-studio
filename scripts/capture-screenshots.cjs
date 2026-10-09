/**
 * 文档截图自动化脚本（Electron / Chromium）。
 *
 * 用法：
 *   1. 先执行 `npm run build` 生成 dist/
 *   2. 执行 `npx electron scripts/capture-screenshots.cjs`
 *
 * 脚本以 1360x900 桌面视口加载 dist/index.html，激活音频引擎后
 * 依次切换四个模块并截图，输出到 docs/images/。
 */
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'images');
const INDEX = path.join(__dirname, '..', 'dist', 'index.html');

const SHOTS = [
  { file: '01-workshop.png', tab: '乐器仿真探究' },
  { file: '02-detector.png', tab: '音韵识别器' },
  { file: '03-challenge.png', tab: '曲谱视唱互动' },
  { file: '04-theory.png', tab: '岭南乐理科普' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickButtonContaining = (text) => `(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    b.textContent.includes(${JSON.stringify(text)}));
  if (btn) { btn.click(); return true; }
  return false;
})()`;

app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(permission === 'media');
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    show: true,
    backgroundColor: '#F5F2ED',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  await win.loadFile(INDEX);
  await sleep(1600);

  // 激活音频引擎，关闭首屏横幅
  await win.webContents.executeJavaScript(clickButtonContaining('激活音频引擎'));
  await sleep(900);

  for (const shot of SHOTS) {
    const ok = await win.webContents.executeJavaScript(clickButtonContaining(shot.tab));
    if (!ok) console.warn(`未找到标签按钮：${shot.tab}`);
    await sleep(1100); // 等待切换动画与内容渲染
    const image = await win.webContents.capturePage();
    const target = path.join(OUT_DIR, shot.file);
    fs.writeFileSync(target, image.toPNG());
    console.log('saved', shot.file, image.getSize());
  }

  app.quit();
});
