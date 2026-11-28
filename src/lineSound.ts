const base = import.meta.env.BASE_URL;

// 音效檔（放在 public/sounds/ 底下）。留空字串 "" 就改用內建的合成音
const NOTIFY_FILE = `${base}line.mp3`; 
const SEND_FILE = `${base}line-send.mp3`; // 傳送訊息

let ctx: AudioContext | null = null;
let nextFree = 0; // 下一個合成音最早可以開始的時間（排隊用）

function getCtx() {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

// 瀏覽器規定：使用者第一次點擊／按鍵之後，才允許播放聲音
if (typeof window !== "undefined") {
  const unlock = () => {
    void getCtx().resume();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function tone(
  c: AudioContext,
  freq: number,
  at: number,
  dur: number,
  vol: number,
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function playFile(url: string, volume = 0.8) {
  const a = new Audio(url);
  a.volume = volume;
  void a.play().catch(() => {});
}

export function playLineSound(kind: "notify" | "chat" | "send") {
  if (kind === "notify" && NOTIFY_FILE) return playFile(NOTIFY_FILE);
  if (kind === "send" && SEND_FILE) return playFile(SEND_FILE);
  try {
    const c = getCtx();
    if (c.state !== "running") {
      void c.resume();
      return;
    }
    // 每則訊息各排一個位置，上一個播完才輪到下一個
    const t = Math.max(c.currentTime + 0.01, nextFree);
    if (kind === "notify") {
      tone(c, 1175, t, 0.16, 0.25);
      tone(c, 1568, t + 0.12, 0.26, 0.25);
      nextFree = t + 0.42;
    } else if (kind === "send") {
      tone(c, 660, t, 0.1, 0.18);
      nextFree = t + 0.15;
    } else {
      tone(c, 880, t, 0.12, 0.15);
      nextFree = t + 0.2;
    }
  } catch {
    /* 播不出來就算了 */
  }
}