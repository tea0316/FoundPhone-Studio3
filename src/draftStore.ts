import { useSyncExternalStore } from "react";

let text = "";
let locked = false;
let ready = false; // 劇本：台詞打完了，等玩家按傳送

const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
};

export const getDraft = () => text;

export function setDraft(v: string) {
  text = v;
  emit();
}

export const useDraft = () => useSyncExternalStore(subscribe, () => text);

// 劇本播放時鎖住鍵盤
export const isLocked = () => locked;
export function setLocked(v: boolean) {
  locked = v;
  emit();
}

// 劇本台詞打完 → 傳送鈕變綠
export function setSendReady(v: boolean) {
  if (ready === v) return;
  ready = v;
  emit();
}

// 傳送鈕要不要亮綠色：劇本中看「台詞打完沒」，自由打字看「有沒有字」
export const useCanSend = () =>
  useSyncExternalStore(subscribe, () => (locked ? ready : text.trim() !== ""));

// 傳送：回傳 false 代表「這次不能送」，草稿會保留
type Sender = (text: string) => boolean | void;
let sender: Sender | null = null;

export function registerSender(fn: Sender) {
  sender = fn;
  return () => {
    if (sender === fn) sender = null;
  };
}

export function sendDraft() {
  const t = text.trim();
  if (!t) return;
  if (sender?.(t) === false) return;
  setDraft("");
}

// 點輸入列
let tap: (() => void) | null = null;

export function registerTap(fn: () => void) {
  tap = fn;
  return () => {
    if (tap === fn) tap = null;
  };
}

export const composerTap = () => tap?.();