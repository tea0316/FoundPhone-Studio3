import { useSyncExternalStore } from "react";

// 劇情鎖定的鍵盤文字。null 代表沒有鎖定，鍵盤自己決定。
let text: string | null = null;
const listeners = new Set<() => void>();

export const setKeyboardText = (t: string | null) => {
  text = t;
  listeners.forEach((l) => l());
};

export const useKeyboardText = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => text,
  );