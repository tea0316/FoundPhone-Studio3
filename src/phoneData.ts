import { useSyncExternalStore } from "react";
import type { Item } from "./schema";

let items: Item[] = [];
const subs = new Set<() => void>();

// 手機最外層把電話 App 的資料貼上去
export const setPhoneItems = (next: Item[]) => {
  if (next === items) return;
  items = next;
  subs.forEach((f) => f());
};

// 通訊錄讀取
export const usePhoneItems = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    () => items,
  );