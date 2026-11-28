import { useContext, useEffect, useMemo, useRef, useState } from "react";
import "./line.css";
import {
  Bell,
  Bookmark,
  ChevronLeft,
  Clapperboard,
  Home,
  Menu,
  MessageCircle,
  Music2,
  Mic,
  Newspaper,
  Phone,
  Pin,
  Plus,
  Play,
  Pause,
  Search,
  Settings,
  Camera,
  Send,
  Image as ImageIcon,
  Smile,
  UserPlus,
  Wallet,
} from "lucide-react";
import { NativeComposer, KeyboardContext } from "../DeviceSystem";
import { sendDraft, setDraft, useCanSend } from "../draftStore";
import { clearPending, usePendingThread } from "../lineNotify";
import { useLineStory, useAllLive } from "../useLineStory";
import { HISTORY_ITEMS } from "../lineContacts";
import type { Item } from "../schema";
import {
  Avatar,
  Empty,
  Media,
  SearchBox,
  Tabs,
  useContent,
  type Props,
} from "./shared";

// 主頁個人資料：狀態文字、正在聽的音樂（留空字串 "" 就不顯示）
const PROFILE_STATUS = "好想吃拉麵~";
const PROFILE_MUSIC = "櫻坂46 – Tokyo Snow ";



// ==================== 時間與日期工具 ====================

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function parseYmd(t: string): [number, number, number] | null {
  const [y, m, d] = t.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return [y, m, d];
}

function dayDiff(a: string, b: string): number {
  const pa = parseYmd(a);
  const pb = parseYmd(b);
  if (!pa || !pb) return 0;
  const ta = new Date(pa[0], pa[1] - 1, pa[2]).getTime();
  const tb = new Date(pb[0], pb[1] - 1, pb[2]).getTime();
  return Math.round((tb - ta) / 86_400_000);
}

function weekday(t: string): string {
  const p = parseYmd(t);
  if (!p) return "";
  return WEEK[new Date(p[0], p[1] - 1, p[2]).getDay()];
}

function storyNow(items: Item[]): string {
  return items.reduce((max, i) => (i.time > max ? i.time : max), "");
}
// 現在的日期與時間（本機）
function realNow(): [string, string] {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return [
    `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`,
    `${z(d.getHours())}:${z(d.getMinutes())}`,
  ];
}

// 聊天室裡的日期標籤：今天／昨天／週X／7/1(三)
function dayLabel(time: string, now: string): string {
  const diff = dayDiff(time, now);
  const sameYear = time.slice(0, 4) === now.slice(0, 4);
  const week = weekday(time);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  if (diff > 1 && diff < 7 && sameYear) return `週${week}`;
  const m = Number(time.slice(5, 7));
  const d = Number(time.slice(8, 10));
  return sameYear
    ? `${m}/${d}(${week})`
    : `${time.slice(0, 4)}/${m}/${d}(${week})`;
}

// 聊天列表右邊的時間：14:30／昨天／週X／7/1
function listTime(time: string, now: string): string {
  const diff = dayDiff(time, now);
  const sameYear = time.slice(0, 4) === now.slice(0, 4);
  if (diff <= 0) return time.slice(-5);
  if (diff === 1) return "昨天";
  if (diff < 7 && sameYear) return `週${weekday(time)}`;
  const m = Number(time.slice(5, 7));
  const d = Number(time.slice(8, 10));
  return sameYear ? `${m}/${d}` : `${time.slice(0, 4)}/${m}/${d}`;
}

// 列表上顯示的最後一句話
function preview(i: Item, group: boolean): string {
  const kind = i.kind as string;
  const you = i.outgoing ? "你" : "";
  const text =
    kind === "image" && i.meta?.sticker === "1"
      ? `${you}傳送了貼圖`
      : kind === "image"
      ? `${you}傳送了照片`
      : kind === "video"
        ? `${you}傳送了影片`
        : kind === "audio"
          ? `${you}傳送了語音訊息`
          : kind === "call"
            ? i.meta?.missed === "1"
              ? "未接來電"
              : "通話"
            : i.body.split("\n")[0] || i.title;
  return group && !i.outgoing ? `${i.sender}：${text}` : text;
}

// ==================== 聊天室訊息 ====================

// 語音訊息：點一下播放／暫停
function VoiceBubble({ src, seconds }: { src: string; seconds: number }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src) return;
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    const a = new Audio(src);
    audio.current = a;
    a.onended = () => setPlaying(false);
    void a.play().catch(() => setPlaying(false));
    setPlaying(true);
  };
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <span
      className="ln-voice"
      style={{ minWidth: 70 + Math.min(seconds, 30) * 4 }}
      onClick={toggle}
    >
      {playing ? <Pause size={16} /> : <Play size={16} />}
      <i className="ln-wave" />
      <em>
        {mm}:{ss}
      </em>
    </span>
  );
}
function ChatLog({
  p,
  items,
  now,
  typing,
}: {
  p: Props;
  items: Item[];
  now: string;
  typing: boolean;
}) {
  const isGroup =
    new Set(items.filter((i) => !i.outgoing).map((i) => i.sender)).size > 1;
      const logRef = useRef<HTMLDivElement>(null);
  const lastItem = items[items.length - 1];
  const newDayForTyping =
    !lastItem || lastItem.time.slice(0, 10) !== now.slice(0, 10);
  const typingFirst = newDayForTyping || !!lastItem?.outgoing;
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    }, [items.length, typing]);

  // 同一個人、同一天、連續的訊息算同一組
  const sameRun = (a?: Item, b?: Item) =>
    !!a &&
    !!b &&
    (a.kind as string) !== "system" &&
    (b.kind as string) !== "system" &&
    a.outgoing === b.outgoing &&
    a.sender === b.sender &&
    a.time.slice(0, 10) === b.time.slice(0, 10);

  return (
    <div className="ln-log" ref={logRef}>
      {items.map((i, idx) => {
        const prev = items[idx - 1];
        const next = items[idx + 1];
        const first = !sameRun(prev, i);
        const lastOfRun = !sameRun(i, next);
        const lastOfMinute = !(
          sameRun(i, next) && next!.time.slice(0, 16) === i.time.slice(0, 16)
        );
        const newDay = !prev || prev.time.slice(0, 10) !== i.time.slice(0, 10);
        const isMedia = ["image", "video"].includes(i.kind);
        const isSticker = i.meta?.sticker === "1";
        const isVoice = i.meta?.voice === "1";
        const rawImg = !!i.media && /^(\/|https?:)/.test(i.media);

        if ((i.kind as string) === "system") {
          return (
            <div key={i.id}>
              {newDay && (
                <time className="ln-date">{dayLabel(i.time, now)}</time>
              )}
              <div className="ln-sys">
                <span>{i.body}</span>
              </div>
            </div>
          );
        }

        return (
          <div key={i.id}>
            {newDay && <time className="ln-date">{dayLabel(i.time, now)}</time>}
            <div className={`ln-row ${i.outgoing ? "out" : "in"}`}>
              {!i.outgoing &&
                (first ? (
                  <Avatar name={i.sender} src={i.avatar} round />
                ) : (
                  <span className="ln-gap" />
                ))}
              <div className="ln-col">
                {!i.outgoing && first && isGroup && (
                  <small className="ln-name">{i.sender}</small>
                )}
                <div className="ln-msg">
                  {i.outgoing && lastOfMinute && (
                    <span className="ln-meta">
                      {i.read && lastOfRun && <em>已讀</em>}
                      {i.time.slice(-5)}
                    </span>
                  )}
                  <button
                    className={`ln-bubble${isMedia ? " media" : ""}${isSticker ? " sticker" : ""}${isVoice ? " voice" : ""}`}
                    onClick={() => (p.creator ? p.onItem(i) : p.onRead(i.id))}
                  >
                    {isVoice ? (
                      <VoiceBubble
                        src={i.media}
                        seconds={Number(i.meta?.seconds ?? 5)}
                      />
                    ) : isSticker || (i.kind === "image" && rawImg) ? (
                      <img className="ln-img" src={i.media} alt="" />
                    ) : ["image", "video", "audio"].includes(i.kind) ? (
                      <Media item={i} />
                    ) : (
                      i.body
                    )}
                  </button>
                  {!i.outgoing && lastOfMinute && (
                    <span className="ln-meta">{i.time.slice(-5)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {typing && (
        <div>
          {newDayForTyping && (
            <time className="ln-date">{dayLabel(now.slice(0, 10), now)}</time>
          )}
          <div className="ln-row in">
            {typingFirst ? (
              <Avatar name={p.thread ?? ""} round />
            ) : (
              <span className="ln-gap" />
            )}
            <div className="ln-col">
              <div className="ln-msg">
                <div className="ln-bubble ln-typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== LINE 主畫面 ====================

export function LineSkin(p: Props) {
 const { tab, setTab, q, setQ, items: baseItems } = useContent(p, "聊天");
  // story.json 的資料 + lineContacts.ts 的舊訊息
  const items = useMemo(() => {
    const key = q.toLowerCase();
    return [
      ...baseItems,
      ...HISTORY_ITEMS.filter(
        (i) => !key || (i.title + i.body + i.sender).toLowerCase().includes(key),
      ),
    ];
  }, [baseItems, q]);
    const isHome = tab === "好友";
    const thread = p.thread;
  // 進出聊天室時，收起鍵盤並清空草稿
  const openKeyboard = useContext(KeyboardContext);
  useEffect(() => {
    openKeyboard(false);
    setDraft("");
  }, [thread]);
  useEffect(() => () => openKeyboard(false), []);

  
  // 劇本播放（對方開場、自動打字、自動回覆）
  const story = useLineStory({
    
    thread: thread ?? "",
    owner: p.owner ?? "我",
    stamp: () => {
      const [d, c] = realNow();
      return `${p.virtualDate || d} ${(p.virtualTime || c).slice(0, 5)}`;
    },
  });
  const canSend = useCanSend();
    // 還沒做的功能：點了跳出小提示
  const [tip, setTip] = useState("");
  useEffect(() => {
    if (!tip) return;
    const timer = setTimeout(() => setTip(""), 1200);
    return () => clearTimeout(timer);
  }, [tip]);
  const soon = (what: string) => () => setTip(`${what}尚未開放`);
    // 深色模式（記在瀏覽器，F5 之後還在）
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("ln-dark") === "1";
    } catch {
      return false;
    }
  });
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("ln-dark", next ? "1" : "0");
    } catch {}
    setTip(next ? "深色模式：開" : "深色模式：關");
  };

  // 「今天」以最新的那一天為準：舊資料、新訊息，哪個比較晚就用哪個
  const liveAll = useAllLive();
  const allItems = useMemo(() => [...items, ...liveAll], [items, liveAll]);
  const liveDay = liveAll
    .reduce((m, i) => (i.time > m ? i.time : m), "")
    .slice(0, 10);

  // 點通知／橫幅後，直接進那個聊天室
  const pendingThread = usePendingThread();
  useEffect(() => {
    if (!pendingThread) return;
    p.onThread(pendingThread);
    clearPending();
  }, [pendingThread]);
  const baseDay = p.virtualDate || storyNow(items).slice(0, 10);
  const now = (liveDay > baseDay ? liveDay : baseDay) + " 23:59";

  // 進入聊天室時，把這個聊天室的未讀訊息標成已讀
  const unreadIds = useMemo(
    () =>
      thread
        ? items
            .filter((i) => i.title === thread && !i.outgoing && !i.read)
            .map((i) => i.id)
            .join(",")
        : "",
    [items, thread],
  );
  useEffect(() => {
    if (!thread || !unreadIds) return;
    unreadIds.split(",").forEach((id) => p.onRead(id));
  }, [thread, unreadIds, p.onRead]);

    const totalUnread = allItems.filter((i) => !i.outgoing && !i.read).length;

  // 一次遍歷，分組出每個聊天室
  const threads = useMemo(() => {
    const map = new Map<string, Item[]>();
     for (const i of allItems) {
      const arr = map.get(i.title);
      if (arr) arr.push(i);
      else map.set(i.title, [i]);
    }
    return [...map.entries()]
      .map(([title, list]) => {
        list.sort((a, b) => a.time.localeCompare(b.time));
        const senders = new Set(
          list.filter((i) => !i.outgoing).map((i) => i.sender),
        );
        return {
          title,
          last: list[list.length - 1],
          unread: list.filter((i) => !i.outgoing && !i.read).length,
          avatar: list.find((i) => i.avatar)?.avatar,
          pinned: list.some((i) => i.meta?.pinned === "1"),
          group: senders.size >= 2,
          members: senders.size + (list.some((i) => i.outgoing) ? 1 : 0),
          senders,
        };
      })
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.last.time.localeCompare(a.last.time),
      );
  }, [allItems]);

  const room = threads.find((t) => t.title === thread);

  const friends = [
    ...new Set(items.filter((i) => !i.outgoing).map((i) => i.sender)),
  ].filter((f) => f.toLowerCase().includes(q.toLowerCase()));

  // 點好友：優先進一對一聊天室
  const openFriend = (sender: string) => {
    const direct = threads.find((t) => !t.group && t.senders.has(sender));
    const fallback = items.find((i) => i.sender === sender);
    if (direct) p.onThread(direct.title);
    else if (fallback) p.onThread(fallback.title);
  };

  // ---------- 聊天室 ----------
  if (thread) {
    return (
      <div className={`catalog-skin ln-app${dark ? " ln-dark" : ""}`}>
        <div className="ln-head">
          <button className="ln-back" onClick={() => p.onThread("")}>
            <ChevronLeft size={24} />
            {totalUnread > 0 && <em>{totalUnread}</em>}
          </button>
          <strong>
            {thread}
            {room?.group ? ` (${room.members})` : ""}
          </strong>
           <span className="ln-head-icons">
            <button aria-label="搜尋" onClick={soon("搜尋")}>
              <Search size={22} />
            </button>
            <button aria-label="通話" onClick={soon("通話")}>
              <Phone size={22} />
            </button>
            <button aria-label="選單" onClick={soon("選單")}>
              <Menu size={22} />
            </button>
          </span>
        </div>

             <ChatLog
          p={p}
                    items={[...items, ...story.live]
            .filter((i) => i.title === thread)
            .sort((a, b) => a.time.localeCompare(b.time))}
          now={now}
          typing={story.typing}
        />

                      <div className="ln-composer">
          <Plus size={26} className="ln-c-plus" />
          <Camera size={26} className="ln-c-extra" />
          <ImageIcon size={26} className="ln-c-extra" />
          <div className="ln-pill">
            <NativeComposer creator={p.creator} onAdd={p.onAdd} />
            <Smile size={24} className="ln-c-smile" />
          </div>
          <Mic size={24} className="ln-c-mic" />
                   <Send
            size={26}
            className={`ln-c-send${canSend ? " ready" : ""}`}
            onClick={sendDraft}
          />
        </div>
        {tip && <div className="ln-tip">{tip}</div>}
      </div>
    );
  }

  // ---------- 主頁／聊天列表 ----------
  return (
    <div className={`catalog-skin ln-app${dark ? " ln-dark" : ""}`}>
      <div className="catalog-scroll">
        {isHome ? (
          <div className="ln-top ln-top-home">
            <span>
              <button aria-label="筆記" onClick={soon("筆記")}>
                <Bookmark size={22} />
              </button>
              <button aria-label="通知" onClick={soon("通知")}>
                <Bell size={22} />
              </button>
              <button aria-label="加好友" onClick={soon("加好友")}>
                <UserPlus size={22} />
              </button>
              <button aria-label="深色模式" onClick={toggleDark}>
                <Settings size={22} />
              </button>
            </span>
          </div>
        ) : (
          <div className="ln-top">
            <h1>聊天</h1>
            <span>
              <button aria-label="新增聊天" onClick={soon("新增聊天")}>
                <Plus size={22} />
              </button>
              <button aria-label="深色模式" onClick={toggleDark}>
                <Settings size={22} />
              </button>
            </span>
          </div>
        )}

        {!isHome && <SearchBox value={q} set={setQ} />}

        {isHome ? (
          <>
            <div className="ln-profile">
              <div className="ln-profile-text">
                <strong>{p.owner ?? "我"}</strong>
                {PROFILE_STATUS && <p>{PROFILE_STATUS}</p>}
                {PROFILE_MUSIC && (
                  <span className="ln-music">
                    <Music2 size={14} />
                    {PROFILE_MUSIC}
                  </span>
                )}
              </div>
<img
  className="ln-my-avatar"
  src={`${import.meta.env.BASE_URL}avatar/line.jpg`}
  alt={p.owner ?? "我"}
/>
            </div>

            <SearchBox value={q} set={setQ} />

            <div className="ln-sec-row">
              <h4 className="ln-sec">好友名單</h4>
              <span>顯示全部</span>
            </div>
            {friends.map((s) => (
              <button
                key={s}
                className="ln-friend"
                onClick={() => openFriend(s)}
              >
                <Avatar
                  name={s}
                  src={items.find((i) => i.sender === s && i.avatar)?.avatar}
                />
                <span>{s}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            {["群組", "朋友"].map((type) => {
              const list = threads.filter((t) =>
                type === "群組" ? t.group : !t.group,
              );
              if (list.length === 0) return null;
              return (
                <div key={type}>
                  <h4 className="ln-sec">{type}</h4>
                  {list.map((t) => (
                    <button
                      key={t.title}
                      className={`ln-chat${t.pinned ? " pinned" : ""}`}
                      onClick={() => p.onThread(t.title)}
                    >
                      <Avatar name={t.title} src={t.avatar} />
                      <div className="ln-main">
                        <strong>
                          <span>
                            {t.title}
                            {t.group ? ` (${t.members})` : ""}
                          </span>
                          {t.pinned && <Pin size={12} className="ln-pin" />}
                        </strong>
                        <p>{preview(t.last, t.group)}</p>
                      </div>
                      <div className="ln-side">
                        <time>{listTime(t.last.time, now)}</time>
                        {t.unread > 0 && (
                          <b className="ln-badge">{t.unread}</b>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
            <Empty items={items} />
          </>
        )}
      </div>

      <Tabs
        tabs={["主頁", "聊天", "VOOM", "新聞", "錢包"]}
        value={isHome ? "主頁" : "聊天"}
        set={(t) => {
          if (t === "主頁") setTab("好友");
          if (t === "聊天") setTab("聊天");
        }}
        icons={[
          <Home />,
          <span className="ln-tabicon">
            <MessageCircle />
            {totalUnread > 0 && (
              <b>{totalUnread > 99 ? "99+" : totalUnread}</b>
            )}
          </span>,
          <Clapperboard />,
          <Newspaper />,
          <Wallet />,
        ]}
      />
      {tip && <div className="ln-tip">{tip}</div>}
    </div>
  );
}