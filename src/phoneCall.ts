import { useSyncExternalStore } from "react";

export type CallInfo = {
  active: boolean;
  name: string;
  phase: "dial" | "in" | "none";
  secs: number;
};

let info: CallInfo = { active: false, name: "", phase: "dial", secs: 0 };
const subs = new Set<() => void>();

// 電話 App 把目前的通話狀態公布出來
export const setCallInfo = (next: CallInfo) => {
  info = next;
  subs.forEach((f) => f());
};

// 動態島讀取
export const useCallInfo = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    () => info,
  );

export const fmtCall = (s: number) =>
  String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");