import { decodeG726 } from '../audio/g726.js';

// Cutscene movies: MV_xx.avi (XviD 176x88, 15 fps) + MV_xx.a24 (G.726 24 kbps soundtrack) from the player's assets.pkg.
// Browsers can't decode XviD, so the video is converted in the browser with ffmpeg.wasm (loaded once from jsDelivr) and cached.
const FFMPEG = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/';
const CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/';

let ffmpegPromise = null;
function loadFFmpeg(onStatus) {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    const blobURL = async (url, type) => URL.createObjectURL(new Blob([await (await fetch(url)).arrayBuffer()], { type }));
    onStatus('Loading movie player…');
    if (!window.FFmpegWASM) {
      await new Promise((ok, err) => {
        const s = document.createElement('script');
        s.src = FFMPEG + 'ffmpeg.js'; s.onload = ok; s.onerror = () => err(new Error('ffmpeg.js failed to load'));
        document.head.append(s);
      });
    }
    const ff = new window.FFmpegWASM.FFmpeg();
    await ff.load({
      classWorkerURL: await blobURL(FFMPEG + '814.ffmpeg.js', 'text/javascript'),
      coreURL: await blobURL(CORE + 'ffmpeg-core.js', 'text/javascript'),
      wasmURL: await blobURL(CORE + 'ffmpeg-core.wasm', 'application/wasm'),
    });
    return ff;
  })().catch(e => { ffmpegPromise = null; throw e; });
  return ffmpegPromise;
}

function pcmWav(pcm, rate = 8000) {
  const n = pcm.length, v = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (p, t) => [...t].forEach((c, i) => v.setUint8(p + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, pcm[i], true);
  return new Uint8Array(v.buffer);
}

export class MoviePlayer {
  constructor(game) {
    this.game = game;
    this.cache = new Map();
    this.overlay = null;
  }
  fileName(id) {
    const base = id.toUpperCase().replace(/^MV_?/, 'MV_');
    const pkg = this.game.assets.pkg;
    const find = ext => pkg.list(ext).find(n => n.toUpperCase() === base + ext.toUpperCase());
    return { avi: find('.avi'), a24: find('.a24') };
  }
  async convert(id, onStatus) {
    if (this.cache.has(id)) return this.cache.get(id);
    const { avi, a24 } = this.fileName(id);
    if (!avi) return null;
    const ff = await loadFFmpeg(onStatus);
    onStatus('Preparing cutscene…');
    await ff.writeFile('in.avi', (await this.game.assets.bytes(avi)).slice());
    const args = ['-i', 'in.avi'];
    if (a24) { await ff.writeFile('in.wav', pcmWav(decodeG726(await this.game.assets.bytes(a24)))); args.push('-i', 'in.wav'); }
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p');
    if (a24) args.push('-c:a', 'aac');
    args.push('-y', 'out.mp4');
    await ff.exec(args);
    const url = URL.createObjectURL(new Blob([await ff.readFile('out.mp4')], { type: 'video/mp4' }));
    this.cache.set(id, url);
    return url;
  }
  // Play a movie over the game screen; resolves when it ends or the player presses a key.
  async play(id) {
    if (!id) return;
    const canvas = this.game.canvas;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#000;z-index:10;color:#9aa;font:14px system-ui';
    const label = document.createElement('div');
    label.textContent = 'Loading cutscene…';
    overlay.append(label);
    document.body.append(overlay);
    this.overlay = overlay;
    let skip;
    const skipped = new Promise(res => { skip = res; });
    const onKey = e => { e.preventDefault(); skip(); };
    const armSkip = () => { window.addEventListener('keydown', onKey); overlay.addEventListener('pointerdown', onKey); };
    try {
      const url = await Promise.race([this.convert(id, t => { label.textContent = t; }), skipped.then(() => null)]);
      if (url) {
        const video = document.createElement('video');
        video.src = url; video.autoplay = true; video.playsInline = true;
        const rect = canvas.getBoundingClientRect();
        video.style.cssText = `width:${Math.round(rect.width)}px;image-rendering:pixelated;background:#000`;
        label.textContent = 'Press any key to skip';
        overlay.prepend(video);
        armSkip();
        await Promise.race([new Promise(res => { video.onended = res; video.onerror = res; }), skipped]);
        video.pause();
      }
    } catch (e) {
      console.warn('cutscene unavailable', e);
    } finally {
      window.removeEventListener('keydown', onKey);
      overlay.remove();
      this.overlay = null;
      this.game.input.down.clear();
      this.game.input.pressed.clear();
    }
  }
}
