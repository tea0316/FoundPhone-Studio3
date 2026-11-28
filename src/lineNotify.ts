import { useSyncExternalStore } from "react";

export type LineNotice = {
  id: string;
  thread: string;
  text: string;
  at: number;
};

let notices: LineNotice[] = [];
let banner: LineNotice | null = null;
let pending = "";
let seq = 0;
// 對象頭像：聊天室名稱 → 圖片路徑
let avatars: Record<string, string> = {};
export function setLineAvatars(map: Record<string, string>) {
  avatars = map;
  emit();
}
export const getLineAvatar = (thread: string) => avatars[thread] ?? "";
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
};

// 新訊息來了（人不在那個聊天室時才呼叫）
export function notifyIncoming(thread: string, text: string) {
  const n: LineNotice = {
    id: `n-${Date.now()}-${seq++}`,
    thread,
    text,
    at: Date.now(),
  };
  notices = [...notices, n];
  banner = n;
  emit();
}

// 進聊天室後，清掉這個聊天室的通知
export function clearNotices(thread: string) {
  if (!notices.some((n) => n.thread === thread)) return;
  notices = notices.filter((n) => n.thread !== thread);
  if (banner?.thread === thread) banner = null;
  emit();
}

export function dismissNotice(id: string) {
  notices = notices.filter((n) => n.id !== id);
  if (banner?.id === id) banner = null;
  emit();
}

export function dismissBanner() {
  if (!banner) return;
  banner = null;
  emit();
}

// 要求 LINE 打開某個聊天室
export function requestOpen(thread: string) {
  pending = thread;
  emit();
}

export function clearPending() {
  if (!pending) return;
  pending = "";
  emit();
}

export const useLineNotices = () => useSyncExternalStore(subscribe, () => notices);
export const useLineBanner = () => useSyncExternalStore(subscribe, () => banner);
export const usePendingThread = () => useSyncExternalStore(subscribe, () => pending);