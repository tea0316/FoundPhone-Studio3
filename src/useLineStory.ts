import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Item } from "./schema";
import {
  getDraft,
  registerSender,
  registerTap,
  setDraft,
  setLocked,
  setSendReady,
} from "./draftStore";
import {
  DEFAULT_TIMING,
  LINE_STORIES,
  type Line,
  type LineStory,
  type Timing,
} from "./lineStory";
import { clearNotices, notifyIncoming } from "./lineNotify";
import { playLineSound } from "./lineSound";

const TYPE_MS = 40; // 每個字的打字速度
const AUTO_SEND = 15000; // 打完後幾毫秒自動送出
const gw = window as unknown as { __lineGen?: number };
gw.__lineGen = (gw.__lineGen ?? 0) + 1;
const MY_GEN = gw.__lineGen;
const alive = () => gw.__lineGen === MY_GEN;
type Snap = { live: Item[]; typing: boolean };
const EMPTY: Snap = { live: [], typing: false };

const localStamp = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
};

// 劇本進度放在這裡（模組層級）：離開聊天室、換 App 都不會消失，只有 F5 重整才重來
const engines = new Map<string, Engine>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

let booted = false;
let bootStamp: () => string = localStamp;

// 所有聊天室的「劇本訊息」合在一起（給聊天列表、桌面紅點用）
let allLive: Item[] = [];
const recomputeAll = (): void => {
  allLive = [...engines.values()].flatMap((x) => x.snap.live);
};
export const useAllLive = () => useSyncExternalStore(subscribe, () => allLive);
export const useLiveUnread = () =>
  useAllLive().filter((i) => !i.outgoing && !i.read).length;

type Engine = ReturnType<typeof createEngine>;
// 把劇本裡的一句話（文字、圖片、貼圖、語音）整理成訊息欄位
type Parsed = {
  body: string;
  kind: string;
  media: string;
  meta: Record<string, string>;
  note: string;
};
function parseLine(l: Line): Parsed {
  if (typeof l === "string")
    return { body: l, kind: "text", media: "", meta: {}, note: l };
  if (l.type === "voice")
    return {
      body: "",
      kind: "audio",
      media: l.src ?? "",
      meta: { voice: "1", seconds: String(l.seconds ?? 5) },
      note: "傳送了語音訊息",
    };
  if (l.type === "sticker")
    return {
      body: "",
      kind: "image",
      media: l.src,
      meta: { sticker: "1" },
      note: "傳送了貼圖",
    };
  return { body: "", kind: "image", media: l.src, meta: {}, note: "傳送了照片" };
}

function createEngine(
  thread: string,
  story: LineStory | undefined,
  owner: string,
) {
  const e = {
    snap: EMPTY as Snap,
    scripted: !!story,
    visible: false,
    started: false,
    owner,
    stamp: bootStamp,
  };
  let typer: number | undefined;
  let auto: number | undefined;
  let seq = 0;
  let round = 0;
  let idx = 0;
  let canReply = false;
  let pendingTap = false;

  const set = (patch: Partial<Snap>) => {
    e.snap = { ...e.snap, ...patch };
    if (patch.live) recomputeAll();
    emit();
  };
  const later = (ms: number, fn: () => void) => {
    window.setTimeout(() => {
      if (alive()) fn();
    }, ms);
  };

  const push = (
    body: string,
    outgoing: boolean,
    free = false,
    extra?: Parsed,
  ) => {
    const item = {
      id: `${free ? "free" : "story"}-${thread}-${seq++}`,
      title: thread,
      body,
      sender: outgoing ? e.owner : thread,
      avatar: "",
      kind: extra?.kind ?? "text",
      media: extra?.media ?? "",
      folder: "",
      meta: extra?.meta ?? {},
      likes: 0,
      comments: 0,
      time: e.stamp(),
      // 我送的：劇本中先未讀；對方傳的：我正在看就算已讀
      read: outgoing ? !e.scripted : e.visible,
      favorite: false,
      outgoing,
    } as unknown as Item;
    set({ live: [...e.snap.live, item] });
    if (outgoing) {
      playLineSound("send");
    } else {
      playLineSound(e.visible ? "send" : "notify");
      if (!e.visible) notifyIncoming(thread, extra?.note ?? body);
    }
  };

  // 把我送出的訊息全部標成已讀
  const markRead = () => {
    if (!e.snap.live.some((i) => i.outgoing && !i.read)) return;
    set({
      live: e.snap.live.map((i) =>
        i.outgoing && !i.read ? { ...i, read: true } : i,
      ),
    });
  };

  // 對方一則一則傳：先「輸入中…」，再出現訊息
   const receive = (
    lines: Line[],
    delay: number,
    tm: Timing,
    done: () => void,
  ) => {
    if (lines.length === 0) {
      done();
      return;
    }
    let t = delay;
    lines.forEach((line, k) => {
      later(t, () => set({ typing: true }));
      later(t + tm.typingMs, () => {
        set({ typing: false });
        const m = parseLine(line);
        push(m.body, false, false, m);
        if (k === lines.length - 1) done();
      });
      t += tm.typingMs + tm.gapMs;
    });
  };

  const armAuto = () => {
    clearTimeout(auto);
    auto = window.setTimeout(() => {
      if (alive() && e.visible && canReply && typer === undefined && getDraft())
        sendScripted();
    }, AUTO_SEND);
  };

  // 把「我的台詞」逐字打進輸入列
  const startTyping = () => {
    if (!story || !e.visible || !canReply || typer !== undefined || getDraft())
      return;
    const line = story.rounds[round]?.mine[idx];
    if (!line) return;
    const chars = Array.from(line);
    let n = 0;
    typer = window.setInterval(() => {
      if (!alive()) {
        clearInterval(typer);
        return;
      }
      setDraft(getDraft() + (chars[n++] ?? ""));
      if (n >= chars.length) {
        clearInterval(typer);
        typer = undefined;
        setSendReady(true);
        armAuto();
      }
    }, TYPE_MS);
  };

  const sendScripted = () => {
    if (!story) return;
    clearTimeout(auto);
    setSendReady(false);
    const cur = story.rounds[round];
    push(cur.mine[idx], true);
    setDraft("");
    idx++;
    if (idx < cur.mine.length) {
      later(650, startTyping);
      return;
    }
    idx = 0;
    round++;
    canReply = false;
    const tm = { ...DEFAULT_TIMING, ...story.timing };
    const readDelay = cur.readDelay ?? tm.readDelay;
    const replyDelay = cur.replyDelay ?? tm.replyDelay;
    later(readDelay, markRead);
    receive(cur.incoming, readDelay + replyDelay, tm, () => {
      if (round < story.rounds.length) {
        canReply = true;
        later(600, startTyping);
      } else {
        e.scripted = false; // 演完了，開放自由打字
        if (e.visible) setLocked(false);
      }
    });
  };

  // 開始播放（頁面載入時就會呼叫，不用等你進聊天室）
  const begin = () => {
    if (e.started) return;
    e.started = true;
    if (!story) return;
    const tm = { ...DEFAULT_TIMING, ...story.timing };
    receive(story.opening, tm.firstMessageDelay, tm, () => {
      canReply = true;
      if (pendingTap) later(300, startTyping);
    });
  };

  const enter = () => {
    e.visible = true;
    pendingTap = false;
    // 進聊天室：對方的訊息全部已讀，通知清掉
    if (e.snap.live.some((i) => !i.outgoing && !i.read)) {
      set({
        live: e.snap.live.map((i) =>
          !i.outgoing && !i.read ? { ...i, read: true } : i,
        ),
      });
    }
    clearNotices(thread);
    begin();
  };

  const leave = () => {
    e.visible = false;
    pendingTap = false;
    clearInterval(typer);
    typer = undefined;
    clearTimeout(auto);
    setSendReady(false);
    // 劇本演完後自己自由打的訊息，離開就清掉（劇本內容保留）
    if (!e.scripted && e.snap.live.some((i) => i.id.startsWith("free-"))) {
      set({ live: e.snap.live.filter((i) => !i.id.startsWith("free-")) });
    }
  };

  const onSend = (text: string): boolean => {
    if (!e.scripted) {
      push(text, true, true);
      return true;
    }
    if (!canReply || typer !== undefined || !getDraft()) return false;
    sendScripted();
    return true;
  };

  const onTap = () => {
    if (!e.scripted || getDraft()) return;
    if (!canReply) {
      pendingTap = true;
      return;
    }
    later(600, startTyping);
  };

  return Object.assign(e, { begin, enter, leave, onSend, onTap });
}

// 手機一開機就呼叫：所有有劇本的對象，各自開始計時
export function bootLineStories(owner: string, stamp: () => string) {
  if (booted) return;
  booted = true;
  bootStamp = stamp;
  for (const [thread, story] of Object.entries(LINE_STORIES)) {
    if (engines.has(thread)) continue;
    const e = createEngine(thread, story, owner);
    engines.set(thread, e);
    e.begin();
  }
}

export function useLineStory(args: {
  thread: string;
  owner: string;
  stamp: () => string;
}) {
  const { thread, owner } = args;
  const stampRef = useRef(args.stamp);
  stampRef.current = args.stamp;

  const snap = useSyncExternalStore(
    subscribe,
    () => engines.get(thread)?.snap ?? EMPTY,
  );

  useEffect(() => {
    if (!thread) return;
    let e = engines.get(thread);
    if (!e) {
      e = createEngine(thread, LINE_STORIES[thread], owner);
      engines.set(thread, e);
    }
    e.owner = owner;
    if (!booted) e.stamp = () => stampRef.current();
    setDraft("");
    setLocked(e.scripted);
    e.enter();
    const offSend = registerSender(e.onSend);
    const offTap = registerTap(e.onTap);
    return () => {
      e.leave();
      offSend();
      offTap();
      setLocked(false);
      setDraft("");
    };
  }, [thread, owner]);

  return snap;
}