import { useSyncExternalStore } from "react";
import { safeMedia, type Item } from "./schema";
import { getVolume, subscribeVolume } from "./volume";

export type PlayerState = {
  item: Item | null;
  queue: Item[];
  playing: boolean;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  pos: number;
  dur: number;
  muted: boolean;
};

const audio = typeof Audio !== "undefined" ? new Audio() : null;
let state: PlayerState = {
  item: null,
  queue: [],
  playing: false,
  pos: 0,
  dur: 0,
  muted: false,
  shuffle: false,
  repeat: "off",
};
const listeners = new Set<() => void>();
const set = (patch: Partial<PlayerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
let pendingStart = 0;
let lastSaved = -1;


const posKey = (id: string) => "fp-pos-" + id;

function savePos(reset = false) {
  if (!audio || !state.item) return;
  try {
    localStorage.setItem(
      posKey(state.item.id),
      String(reset ? 0 : audio.currentTime),
    );
  } catch {
    // 儲存失敗時忽略錯誤
  }
}

function readPos(id: string) {
  try {
    const v = Number(localStorage.getItem(posKey(id)));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}


export function coverUrl(raw = "") {
  if (raw.startsWith("data:image/")) return raw;
  if (/^\/[\w./-]+\.(png|jpe?g|webp)$/i.test(raw))
    return new URL(import.meta.env.BASE_URL + raw.slice(1), location.href).href;
  return "";
}

const session =
  typeof navigator !== "undefined" && "mediaSession" in navigator
    ? navigator.mediaSession
    : null;

function syncSession() {
  if (!session) return;
  const item = state.item;
  if (!item) {
    session.metadata = null;
    session.playbackState = "none";
    return;
  }
  const cover = coverUrl(item.avatar);
  session.metadata = new MediaMetadata({
    title: item.title,
    artist: item.sender,
    album: item.meta?.album ?? "",
    artwork: cover ? [{ src: cover }] : [],
  });
}

export function playTrack(item: Item, queue: Item[] = [item]) {
  if (!audio) return;
  const src = safeMedia(item.media);
  if (!src) return;
  const list = queue.filter((q) => q.kind === "audio" && safeMedia(q.media));
  if (state.item?.id === item.id) {
    set({ queue: list });
    if (audio.paused) void audio.play().catch(() => {});
    return;
  }
  savePos();
  pendingStart = readPos(item.id);
  lastSaved = -1;
  audio.src = src;
  set({ item, queue: list, pos: 0, dur: 0 });
  syncSession();
  void audio.play().catch(() => {});
}

export function chooseTrack(
  p: { onRead: (id: string) => void; onItem: (i: Item) => void },
  item: Item,
  queue: Item[],
) {
  if (item.kind === "audio" && safeMedia(item.media)) {
    p.onRead(item.id);
    playTrack(item, queue);
  } else p.onItem(item);
}

export function playerToggle() {
  if (!audio || !state.item) return;
  if (audio.paused) void audio.play().catch(() => {});
  else audio.pause();
}
export function playerSeek(t: number) {
  if (!audio || !state.item) return;
  audio.currentTime = t;
  set({ pos: t });
}
export function playerMute() {
  if (audio) audio.muted = !audio.muted;
}
function step(d: number) {
  const { queue, item } = state;
  if (!item || !audio) return;
  if (d === -1 && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (queue.length < 2) return;
  const i = queue.findIndex((q) => q.id === item.id);
  let n = (i + d + queue.length) % queue.length;
  if (state.shuffle && d === 1) {
    do {
      n = Math.floor(Math.random() * queue.length);
    } while (n === i);
  }
  playTrack(queue[n], queue);
}
export const playerNext = () => step(1);
export const playerPrev = () => step(-1);
export const playerShuffle = () => set({ shuffle: !state.shuffle });
export const playerRepeat = () =>
  set({
    repeat:
      state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
  });
export const fmtTime = (t: number) =>
  Number.isFinite(t) && t > 0
    ? Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0")
    : "0:00";
export function stopPlayer() {
  if (!audio) return;
  savePos();
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  set({ item: null, queue: [], playing: false, pos: 0, dur: 0 });
  syncSession();
}

export function usePlayer() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => state,
  );
}

if (audio) {
  const applyVolume = () => {
    audio.volume = getVolume();
  };
  applyVolume();
  subscribeVolume(applyVolume);
  audio.addEventListener("loadedmetadata", () => {
    set({ dur: audio.duration });
    if (pendingStart > 0 && pendingStart < audio.duration - 1)
      audio.currentTime = pendingStart;
    pendingStart = 0;
  });
  audio.addEventListener("durationchange", () => set({ dur: audio.duration }));
  audio.addEventListener("timeupdate", () => {
    set({ pos: audio.currentTime });
    if (Math.abs(audio.currentTime - lastSaved) >= 5) {
      lastSaved = audio.currentTime;
      savePos();
    }
  });
  audio.addEventListener("play", () => {
    set({ playing: true });
    if (session) session.playbackState = "playing";
  });
  audio.addEventListener("pause", () => {
    set({ playing: false });
    if (session && state.item) session.playbackState = "paused";
    savePos();
  });
  audio.addEventListener("ended", () => {
    savePos(true);
    if (state.repeat === "one") {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
      return;
    }
    set({ playing: false });
    const { queue, item } = state;
    const last = item
      ? queue.findIndex((q) => q.id === item.id) === queue.length - 1
      : true;
    if (queue.length > 1 && (state.shuffle || state.repeat === "all" || !last))
      playerNext();
  });
  audio.addEventListener("volumechange", () => set({ muted: audio.muted }));
}

if (session) {
  session.setActionHandler("play", () => playerToggle());
  session.setActionHandler("pause", () => playerToggle());
  session.setActionHandler("previoustrack", () => playerPrev());
  session.setActionHandler("nexttrack", () => playerNext());
  session.setActionHandler("seekto", (d) => {
    if (d.seekTime != null) playerSeek(d.seekTime);
  });
}