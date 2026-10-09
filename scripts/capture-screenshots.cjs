/**
 * 文档截图自动化脚本（Electron 离屏渲染 / Offscreen）。
 *
 * 用法：
 *   1. 先执行 `npm run build` 生成 dist/
 *   2. 执行 `npx electron scripts/capture-screenshots.cjs`
 *
 * 以 1360x900 视口离屏加载 dist/index.html（不弹窗、不依赖窗口是否被遮挡，
 * 适合本地与 CI），激活音频引擎后依次切换四个模块并截图，输出到 docs/images/。
 *
 * 离屏模式通过 'paint' 事件取最新帧：先轮询确认 DOM 已切换、面板已渲染，
 * 再等待入场动画结束并 invalidate() 强制重绘一帧，避免截到过渡中的旧画面。
 */
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'images');
const INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const WELCOMED_KEY = 'gzs_welcomed_v1';
const WIDTH = 1360;
const HEIGHT = 900;

const SHOTS = [
  { id: 'workshop', file: '01-workshop.png', tab: '乐器仿真探究' },
  { id: 'detector', file: '02-detector.png', tab: '音韵识别器' },
  { id: 'challenge', file: '03-challenge.png', tab: '曲谱视唱互动' },
  { id: 'theory', file: '04-theory.png', tab: '岭南乐理科普' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickButtonContaining = (text) => `(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    b.textContent.includes(${JSON.stringify(text)}));
  if (btn) { btn.click(); return true; }
  return false;
})()`;
const buttonExists = (text) => `[...document.querySelectorAll('button')].some((b) =>
  b.textContent.includes(${JSON.stringify(text)}))`;

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
    width: WIDTH,
    height: HEIGHT,
    show: false,
    backgroundColor: '#F5F2ED',
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  win.webContents.setFrameRate(60);

  // 始终缓存最近一帧，供 grabFrame 兜底
  let latestFrame = null;
  win.webContents.on('paint', (_event, _dirty, frame) => {
    latestFrame = frame;
  });

  // 强制重绘并取下一帧，确保截到的是当前 DOM 的最新画面
  const grabFrame = () =>
    new Promise((resolve) => {
      let done = false;
      const handler = (_e, _d, frame) => {
        if (done) return;
        done = true;
        win.webContents.removeListener('paint', handler);
        resolve(frame);
      };
      win.webContents.on('paint', handler);
      win.webContents.invalidate();
      setTimeout(() => {
        if (done) return;
        done = true;
        win.webContents.removeListener('paint', handler);
        resolve(latestFrame);
      }, 800);
    });

  // 轮询等待某个 JS 判定为真，避免依赖固定延时
  const waitFor = async (expr, label, timeout = 10000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const ok = await win.webContents.executeJavaScript(expr);
      if (ok) return;
      await sleep(150);
    }
    throw new Error(`等待超时：${label}`);
  };

  await win.loadFile(INDEX);

  // 首次访问会弹出全屏欢迎引导并遮挡主界面，先标记“已看过”再重载
  await win.webContents.executeJavaScript(`localStorage.setItem('${WELCOMED_KEY}', '1'); true;`);
  await win.reload();

  // 等 React 挂载、激活横幅按钮出现，再激活音频引擎并等待横幅消失
  await waitFor(buttonExists('激活音频引擎'), '音频激活按钮出现');
  await sleep(300);
  await win.webContents.executeJavaScript(clickButtonContaining('激活音频引擎'));
  await waitFor(`!${buttonExists('激活音频引擎')}`, '音频横幅消失');
  await sleep(500);

  for (const shot of SHOTS) {
    await win.webContents.executeJavaScript(clickButtonContaining(shot.tab));
    // 等待对应 tab 真正被选中
    await waitFor(
      `document.getElementById('tab-${shot.id}')?.getAttribute('aria-selected') === 'true'`,
      `tab ${shot.id} 选中`
    );
    // 等待面板渲染出实际内容
    await waitFor(
      `(document.getElementById('app-tab-panel')?.innerText.length || 0) > 200`,
      `面板 ${shot.id} 内容`
    );
    // 等待入场动画结束，再强制重绘取最新静止帧
    await sleep(750);
    const frame = await grabFrame();

    const target = path.join(OUT_DIR, shot.file);
    fs.writeFileSync(target, frame.toPNG());
    console.log('saved', shot.file, frame.getSize());
  }

  app.quit();
});
