/*ig、微信、WhatsAppApp 的模擬介面*/
import { NativeComposer } from "./DeviceSystem";
import { useSkinState } from "./skinState";
import { useVolume } from "./volume";
import { usePlayer, playerToggle } from "./player";
import { useEffect, useMemo, useRef, useState } from "react";
import { coverUrl } from "./player";
import {
  ChevronLeft,
  Plus,
  CirclePlus,
  Search,
  MessageCircle,
  Users,
  Compass,
  User,
  Camera,
  Phone,
  Video,
  Settings,
  Heart,
  Send,
  Repeat2,
  Play,
  Bookmark,
  MoreHorizontal,
  Mic,
  Smile,
  Grid,
  CheckCheck,
  Star,
  Music,
  Volume2, 
  VolumeX, 
  Image as ImageIcon,
  Layers,
  House, 
  Lock, 
  Menu,
  CirclePlay, 
  ShoppingBag,
  ArrowLeft, 
  ChevronRight, 
  Image,
} from "lucide-react";
import { safeMedia, type Item, type UiValue } from "./schema";
export type SkinProps = {
  ui?: Record<string, UiValue>;
  onUi?: (key: string, value: UiValue) => void;
  appId?: string;
  owner?: string;
  virtualTime?: string;
  virtualDate?: string;
  name: string;
  items: Item[];
  creator: boolean;
  onRead: (id: string) => void;
  onItem: (i: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  thread: string;
  onThread: (s: string) => void;
  fireEv?: (name: string, data: { subject: string; text: string }) => void; 
};
function Avatar({
  name,
  round = false,
  src = "",
}: {
  name: string;
  round?: boolean;
  src?: string;
}) {
  return (
    <span className={`skin-avatar ${round ? "round" : ""}`}>
      {/^(\/|data:image\/)/.test(safeMedia(src)) ? (
        <img src={safeMedia(src)} alt="" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
function ItemMedia({ item }: { item: Item }) {
  const src = safeMedia(item.media);
  return src ? (
    item.kind === "audio" ? (
      <audio controls src={src} />
    ) : item.kind === "video" ? (
      <video controls playsInline src={src} />
    ) : (
      <img loading="lazy" alt={item.title} src={src} />
    )
  ) : (
    <div className="skin-photo">
      <span>{item.title}</span>
    </div>
  );
}
function MessageList({
  items,
  creator,
  onItem,
  onRead,
  whatsapp = false,
}: {
  items: Item[];
  creator: boolean;
  onItem: (i: Item) => void;
  onRead: (id: string) => void;
  whatsapp?: boolean;
}) {
  return (
    <div className={`skin-messages ${whatsapp ? "wa-wallpaper" : ""}`}>
      <div className="skin-date">{items[0]?.time.slice(0, 10)}</div>
      {items.map((i) => (
        <div
          key={i.id}
          className={`skin-message ${i.outgoing ? "outgoing" : ""}`}
        >
          {!whatsapp && !i.outgoing && (
            <Avatar name={i.sender} src={i.avatar} />
          )}
          <button
            className="skin-bubble"
            onClick={() => (creator ? onItem(i) : onRead(i.id))}
          >
            {["image", "audio", "video"].includes(i.kind) ? (
              <ItemMedia item={i} />
            ) : i.kind === "transfer" ? (
              <div className="skin-transfer">
                ¥ {i.body}
                <small>轉帳紀錄 · 虛構</small>
              </div>
            ) : (
              i.body
            )}
            <small className={whatsapp ? undefined : "wx-message-time"}>
              {i.time.slice(-5)}{" "}
              {whatsapp && i.outgoing && <CheckCheck size={11} />}
            </small>
          </button>
          {!whatsapp && i.outgoing && <Avatar name={i.sender} src={i.avatar} />}
        </div>
      ))}
    </div>
  );
}
function Compose({
  creator,
  onAdd,
  wa = false,
}: {
  creator: boolean;
  onAdd: () => void;
  wa?: boolean;
}) {
  return (
    <div className={`skin-compose ${wa ? "wa-compose" : ""}`}>
      {wa ? <Plus size={20} /> : <Mic size={20} />}
      <NativeComposer creator={creator} onAdd={onAdd} />

      <Smile size={21} />
      {wa ? <Mic size={20} /> : <Plus size={22} />}
    </div>
  );
}
export function WeChatSkin(p: SkinProps) {
  const [tab, setTab] = useState("微信"),
    [query, setQuery] = useState(""),
    [moments, setMoments] = useState(false),
    [menu, setMenu] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [utility, setUtility] = useState("");
  const [readThreads, setReadThreads] = useSkinState<string[]>(
    p,
    "readThreads",
    [],
  );
  const conversations = [
    ...new Set(
      p.items
        .filter((i) => !["朋友圈", "我"].includes(i.folder))
        .map((i) => i.title),
    ),
  ];
  const contacts = [
    ...new Set(p.items.map((i) => i.sender).filter((s) => s !== "我")),
  ];
  const posts = p.items.filter(
    (i) => i.folder === "朋友圈" || i.kind === "post",
  );
  return (
    <div
      className="wechat-ui independent-skin"
      data-tab={tab}
      data-thread={!!p.thread}
      data-moments={moments}
      data-utility={!!utility}
    >
      <div className="app-nav wx-nav">
        <button
          aria-label={utility || p.thread || moments ? "返回" : "收藏"}
          onClick={() =>
            utility
              ? setUtility("")
              : p.thread
                ? p.onThread("")
                : moments
                  ? setMoments(false)
                  : setUtility("收藏")
          }
        >
          {utility || p.thread || moments ? (
            <ChevronLeft size={22} />
          ) : (
            <Star size={22} />
          )}
        </button>
        <strong>
          {utility ||
            p.thread ||
            (moments ? "朋友圈" : tab === "微信" ? p.name : tab)}
        </strong>
        <button
          aria-label={
            p.creator ? "新增內容" : p.thread ? "聊天詳情" : "微信菜單"
          }
          onClick={
            p.creator
              ? p.onAdd
              : () => (p.thread ? setUtility("聊天訊息") : setMenu(!menu))
          }
        >
          {p.thread ? <MoreHorizontal size={22} /> : <CirclePlus size={22} />}
        </button>
      </div>
      {menu && (
        <div className="wx-popup-menu" role="menu">
          {["搜尋", "發起群組聊天", "新增好友", "掃一掃", "收付款"].map((label) => (
            <button
              role="menuitem"
              key={label}
              onClick={() => {
                setMenu(false);
                if (label === "搜尋") {
                  setSearchOpen(true);
                } else setUtility(label);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {utility ? (
        <div className="skin-scroll wx-utility">
          {utility === "聊天訊息" && (
            <div className="wx-members">
              {[
                ...new Set(
                  p.items
                    .filter((i) => i.title === p.thread)
                    .map((i) => i.sender),
                ),
              ].map((name) => (
                <div key={name}>
                  <Avatar
                    name={name}
                    src={p.items.find((i) => i.sender === name)?.avatar}
                  />
                  <small>{name}</small>
                </div>
              ))}
            </div>
          )}
          {p.items
            .filter((i) => i.folder === utility)
            .map((i) => (
              <button
                key={i.id}
                className="wx-discovery"
                onClick={() => p.onItem(i)}
              >
                {i.title}
                <span>›</span>
              </button>
            ))}
          {!p.items.some((i) => i.folder === utility) &&
            utility !== "聊天訊息" && <p className="skin-empty">暫無內容</p>}
        </div>
      ) : p.thread ? (
        <>
          <MessageList
            items={p.items.filter((i) => i.title === p.thread)}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
          />
          <Compose creator={p.creator} onAdd={p.onAdd} />
        </>
      ) : moments ? (
        <div className="wx-moments">
          <div className="wx-moment-cover">
            <Camera size={32} />
            <span>朋友圈</span>
          </div>
          {posts.map((i) => (
            <button
              key={i.id}
              className="wx-moment-post"
              onClick={() => p.onItem(i)}
            >
              <Avatar name={i.sender} />
              <div>
                <strong>{i.sender}</strong>
                <p>{i.body}</p>
                {i.media && <ItemMedia item={i} />}
                <small>{i.time}</small>
              </div>
            </button>
          ))}
          {!posts.length && <p className="skin-empty">暫無朋友圈動態</p>}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              添加朋友圈動態
            </button>
          )}
        </div>
      ) : (
        <div className="skin-scroll">
          {tab === "微信" ? (
            <>
              {searchOpen && (
                <label className="wx-search">
                  <Search size={14} />
                  <input
                    aria-label="搜尋微信內容"
                    placeholder="搜尋"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
              {conversations
                .filter(
                  (t) =>
                    t.includes(query) ||
                    p.items.some(
                      (i) => i.title === t && i.body.includes(query),
                    ),
                )
                .map((t) => {
                  const list = p.items.filter((i) => i.title === t),
                    last = list.at(-1)!;
                  return (
                    <button
                      className="wx-chat-row"
                      key={t}
                      onClick={() => {
                        setReadThreads((v) => (v.includes(t) ? v : [...v, t]));
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <span className="wx-chat-avatar">
                        <Avatar name={t} src={last.avatar} />
                        {!readThreads.includes(t) &&
                          list.some((i) => !i.read) && (
                            <b className="wx-unread">
                              {list.filter((i) => !i.read).length}
                            </b>
                          )}
                      </span>
                      <div>
                        <strong>{t}</strong>
                        <p>{last.body}</p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
              {!conversations.length && <p className="skin-empty">暫無聊天</p>}
            </>
          ) : tab === "聯絡人" ? (
            <>
              <div className="wx-section-label">聯絡人</div>
              {contacts.map((c) => (
                <button
                  key={c}
                  className="wx-contact"
                  onClick={() => {
                    const item = p.items.find((i) => i.sender === c);
                    if (item) {
                      p.onThread(item.title);
                      p.onRead(item.title);
                    }
                  }}
                >
                  <Avatar
                    name={c}
                    src={p.items.find((i) => i.sender === c)?.avatar}
                  />
                  {c}
                </button>
              ))}
            </>
          ) : tab === "發現" ? (
            <div className="wx-discover-groups">
              {[
                [Camera, "朋友圈", "#26a958"],
                [Play, "視頻號", "#fa9d3b"],
                [Music, "聽一聽", "#fa5151"],
              ].map(([Icon, label, color]) => {
                const Glyph = Icon as typeof Camera;
                return (
                  <button
                    key={String(label)}
                    className="wx-discovery"
                    onClick={() =>
                      label === "朋友圈"
                        ? setMoments(true)
                        : setUtility(String(label))
                    }
                  >
                    <Glyph size={22} style={{ color: String(color) }} />
                    {String(label)}
                    <span>›</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="wx-profile">
                <Avatar name={p.owner || "機主"} />
                <div>
                  <h2>{p.owner || "機主"}</h2>
                  <small>微信號：未設置</small>
                  <button
                    className="wx-profile-status"
                    onClick={() => setUtility("狀態")}
                  >
                    ＋ 狀態
                  </button>
                </div>
              </div>
              <div className="wx-profile-menu">
                {[
                  [MessageCircle, "服務", "#07c160"],
                  [Layers, "收藏", "#e8a828"],
                  [ImageIcon, "朋友圈", "#3a9bd9"],
                  [Layers, "作品", "#329dd8"],
                  [ShoppingBag, "小店與卡包", "#ed7c59"],
                  [Smile, "表情", "#f7b900"],
                  [Settings, "設置", "#1696d2"],
                ].map(([Icon, label, color]) => {
                  const Glyph = Icon as typeof Settings;
                  return (
                    <button
                      key={String(label)}
                      className="wx-discovery"
                      onClick={() =>
                        label === "朋友圈"
                          ? setMoments(true)
                          : setUtility(String(label))
                      }
                    >
                      <Glyph size={22} style={{ color: String(color) }} />
                      {String(label)}
                      <span>›</span>
                    </button>
                  );
                })}
              </div>
              {p.items
                .filter((i) => i.folder === "我")
                .map((i) => (
                  <button
                    className="wx-discovery"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <User size={18} />
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
              {p.creator && (
                <button className="phone-add" onClick={p.onAdd}>
                  編輯個人檔案內容
                </button>
              )}
            </>
          )}
        </div>
      )}
      {!p.thread && !moments && !utility && (
        <nav className="wx-bottom">
          {[
            { label: "微信", icon: MessageCircle },
            { label: "聯絡人", icon: Users },
            { label: "發現", icon: Compass },
            { label: "我", icon: User },
          ].map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={21} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
export function WhatsAppSkin(p: SkinProps) {
  const [tab, setTab] = useState("聊天"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("全部");
  const tabs = [
    { label: "動態", icon: Compass },
    { label: "通話", icon: Phone },
    { label: "社區", icon: Users },
    { label: "聊天", icon: MessageCircle },
    { label: "設置", icon: Settings },
  ];
  const conversations = [
    ...new Set(
      p.items
        .filter((i) => !["動態", "通話", "社區", "設置"].includes(i.folder))
        .filter((i) => filter !== "未讀" || !i.read)
        .map((i) => i.title),
    ),
  ];
  const name = tab === "聊天" ? p.name : tab;
  return (
    <div className="whatsapp-ui independent-skin">
      <div className="app-nav wa-nav">
        <button
          aria-label="返回"
          onClick={() => (p.thread ? p.onThread("") : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{p.thread || name}</strong>
        <button
          aria-label={p.creator ? "新增內容" : "搜尋內容"}
          onClick={
            p.creator
              ? p.onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(".wa-search input")
                    ?.focus()
          }
        >
          {p.creator ? <Plus size={21} /> : <Search size={20} />}
        </button>
      </div>
      {p.thread ? (
        <>
          <div className="wa-thread-profile">
            <button aria-label="返回聊天列表" onClick={() => p.onThread("")}>
              <ChevronLeft size={23} />
            </button>
            <Avatar
              name={p.thread}
              src={p.items.find((i) => i.title === p.thread)?.avatar}
              round
            />
            <div>
              <strong>{p.thread}</strong>
              <small>聯絡人</small>
            </div>
            <Video size={18} />
            <Phone size={17} />
          </div>
          <MessageList
            items={p.items.filter((i) => i.title === p.thread)}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
            whatsapp
          />
          <Compose creator={p.creator} onAdd={p.onAdd} wa />
        </>
      ) : (
        <div className="skin-scroll">
          <h1 className="wa-large-title">{tab}</h1>
          {tab === "聊天" ? (
            <>
              <label className="wa-search">
                <Search size={16} />
                <input
                  placeholder="搜尋"
                  aria-label="搜尋WhatsApp"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="wa-filters">
                {["全部", "未讀", "群組"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "selected" : ""}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {conversations
                .filter((t) => t.includes(query))
                .filter(
                  (t) =>
                    filter !== "群組" ||
                    p.items.some((i) => i.title === t && i.folder === "群組"),
                )
                .map((t) => {
                  const last = p.items.filter((i) => i.title === t).at(-1)!;
                  return (
                    <button
                      className="wa-chat-row"
                      key={t}
                      onClick={() => {
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <Avatar name={t} src={last.avatar} round />
                      <div>
                        <strong>{t}</strong>
                        <p>
                          {last.outgoing && <CheckCheck size={12} />}{" "}
                          {last.body}
                        </p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
            </>
          ) : tab === "設置" ? (
            <>
              <div className="wa-settings-profile">
                <Avatar name="我" round />
                <h2>個人資料</h2>
              </div>
              {p.items
                .filter((i) => i.folder === "設置")
                .map((i) => (
                  <button
                    key={i.id}
                    className="wa-record"
                    onClick={() => p.onItem(i)}
                  >
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
            </>
          ) : (
            <>
              {tab === "動態" && (
                <div className="wa-status">
                  <Avatar name="我" round />
                  <span>我的狀態</span>
                  {p.creator && (
                    <button aria-label="添加狀態" onClick={p.onAdd}>
                      <Plus size={17} />
                    </button>
                  )}
                </div>
              )}
              {p.items
                .filter(
                  (i) =>
                    i.folder === tab || (tab === "通話" && i.kind === "call"),
                )
                .map((i) => (
                  <button
                    className="wa-record"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <Avatar name={i.sender} src={i.avatar} round />
                    <div>
                      <strong>{i.title}</strong>
                      <p>{i.body}</p>
                    </div>
                    <span>
                      {tab === "通話" ? (
                        <Phone size={17} />
                      ) : (
                        <ChevronLeft size={15} />
                      )}
                    </span>
                  </button>
                ))}
              {!p.items.some((i) => i.folder === tab) && (
                <p className="skin-empty">暫無{tab}內容</p>
              )}
            </>
          )}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              添加{tab === "聊天" ? "聊天" : tab}內容
            </button>
          )}
        </div>
      )}
      {!p.thread && (
        <nav className="wa-bottom">
          {tabs.map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
const IG_OTHER = [
  "限時動態", "Story", "私訊", "私信", "Reels", "個人主頁", "个人主页", "珍藏",
];

function IgAvatar({
  name,
  src = "",
  size = 32,
  ghost = false,
}: {
  name: string;
  src?: string;
  size?: number;
  ghost?: boolean;
}) {
  const u = coverUrl(src);
  return (
    <span
      className="igx-avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {u ? (
        <img src={u} alt="" />
      ) : ghost ? (
        <User size={size * 0.62} fill="currentColor" strokeWidth={0} />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
function IgCarousel({ item }: { item: Item }) {
  const list = item.meta?.images
    ? item.meta.images.split(",").map((s) => s.trim()).filter(Boolean)
    : [item.media];
  const [n, setN] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (d: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: (n + d) * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="igx-car">
      <div
        className="igx-car-track"
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setN(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {list.map((src, k) => (
          <div key={k} className="igx-car-slide">
            <ItemMedia item={{ ...item, media: src }} />
          </div>
        ))}
      </div>
      {list.length > 1 && (
        <>
          <span className="igx-car-count">
            {n + 1}/{list.length}
          </span>
          {n > 0 && (
            <button
              className="igx-car-arrow l"
              aria-label="上一張"
              onClick={() => go(-1)}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {n < list.length - 1 && (
            <button
              className="igx-car-arrow r"
              aria-label="下一張"
              onClick={() => go(1)}
            >
              <ChevronRight size={18} />
            </button>
          )}
          <div className="igx-dots">
            {list.map((_, k) => (
              <i key={k} className={k === n ? "on" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
const igCount = (n: number) =>
  n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "萬" : String(n);

function IgReel({
  item,
  liked,
  onLike,
}: {
  item: Item;
  liked: boolean;
  onLike: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [vol] = useVolume();
  const isVideo =
    item.kind === "video" || /\.(mp4|webm|mov)$/i.test(item.media);
useEffect(() => {
    if (vid.current) vid.current.muted = muted;
  }, [muted]);
  useEffect(() => {
    if (vid.current)
      vid.current.volume = Math.min(1, Math.max(0, Number(vol)));
  }, [vol]);
  // 進入畫面才播放，離開就暫停
  useEffect(() => {
    const v = vid.current;
    const b = box.current;
    if (!v || !b) return;
    const io = new IntersectionObserver(
      ([e]) => {
                if (e.isIntersecting)
          v.play().catch(() => {
            v.muted = true;
            setMuted(true);
            v.play().catch(() => {});
          });
        else {
          v.pause();
          v.currentTime = 0;
        }
      },
      { threshold: 0.6 },
    );
    io.observe(b);
    return () => io.disconnect();
  }, []);

  const likes = Math.max(
  0,
  item.likes + (liked ? 1 : 0) - (item.meta?.liked === "1" ? 1 : 0),
);
   return (
    <div className="igr" ref={box}>
      {isVideo ? (
        <video
          ref={vid}
          className="igr-video"
          src={item.media}
          loop
          playsInline
          onClick={() => setMuted(!muted)}
        />
      ) : (
        <ItemMedia item={item} />
      )}
      <div className="igr-shade" />
      {isVideo && (
        <span className="igr-mute">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </span>
      )}
      <div className="igr-side">
        <button aria-label="喜歡" onClick={onLike}>
          <Heart
            size={28}
            fill={liked ? "#ed4956" : "none"}
            color={liked ? "#ed4956" : "#fff"}
          />
          {igCount(likes)}
        </button>
        <button aria-label="轉發">
          <Repeat2 size={30} />
        </button>
        <button aria-label="分享">
          <Send size={26} />
        </button>
        <button aria-label="珍藏">
          <Bookmark size={26} />
        </button>
        <button aria-label="選項">
          <MoreHorizontal size={26} />
        </button>
      </div>
      <div className="igr-info">
        <div className="igr-user">
          <IgAvatar name={item.sender} src={item.avatar} size={40} />
          <strong>{item.sender}</strong>
        </div>
        {item.body && <p>{item.body}</p>}
        <div className="igr-audio">
          <Music size={16} />
          <span>{item.meta?.audio || item.sender + " · 原創音訊"}</span>
        </div>
      </div>
    </div>
  );
}
// 👇 放在 IgAvatar 外面，不要包在 IgAvatar 裡面
function IgVoiceBubble({
  src,
  isSent,
}: {
  src: string;
  isSent: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 ~ 1
  const [duration, setDuration] = useState(0);

  const bars = [
    0.35, 0.6, 0.85, 0.45, 0.95, 0.7, 0.4, 0.8, 1, 0.55,
    0.75, 0.5, 0.9, 0.65, 0.35, 0.7, 0.85, 0.5, 0.4, 0.65,
  ];

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec <= 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const bubbleBg = isSent ? "#3797f0" : "#efefef";
  const activeBarColor = isSent ? "#ffffff" : "#111111";
  const inactiveBarColor = isSent
    ? "rgba(255, 255, 255, 0.42)"
    : "rgba(0, 0, 0, 0.22)";
  const textColor = isSent ? "#ffffff" : "#262626";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        minWidth: "205px",
        maxWidth: "250px",
        borderRadius: "20px",
        background: bubbleBg,
        color: textColor,
        userSelect: "none",
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el || !el.duration) return;
          setProgress(el.currentTime / el.duration);
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "暫停語音" : "播放語音"}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: isSent ? "1.5px solid rgba(255,255,255,0.85)" : "1.5px solid #262626",
          background: "transparent",
          color: textColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          padding: 0,
        }}
      >
        {playing ? (
          <span style={{ display: "inline-flex", gap: "2.5px" }}>
            <i
              style={{
                width: "2.5px",
                height: "10px",
                background: "currentColor",
                borderRadius: "1px",
              }}
            />
            <i
              style={{
                width: "2.5px",
                height: "10px",
                background: "currentColor",
                borderRadius: "1px",
              }}
            />
          </span>
        ) : (
          <span
            style={{
              width: 0,
              height: 0,
              marginLeft: "2px",
              borderTop: "5.5px solid transparent",
              borderBottom: "5.5px solid transparent",
              borderLeft: "9px solid currentColor",
            }}
          />
        )}
      </button>

      <div
        onClick={(e) => {
          const el = audioRef.current;
          if (!el || !el.duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          el.currentTime = ratio * el.duration;
          setProgress(ratio);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2.5px",
          height: "24px",
          flex: 1,
          cursor: "pointer",
        }}
      >
        {bars.map((h, idx) => {
          const barRatio = idx / bars.length;
          const isPlayed = barRatio <= progress;
          const heightPx = Math.max(5, Math.round(h * 20));
          return (
            <span
              key={idx}
              style={{
                width: "2.5px",
                height: `${heightPx}px`,
                borderRadius: "999px",
                background: isPlayed ? activeBarColor : inactiveBarColor,
                transition: "background 0.12s ease",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      <span
        style={{
          fontSize: "11px",
          opacity: 0.85,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        {formatTime(duration)}
      </span>
    </div>
  );
}
/* ===== 聊天室自動回覆規則 =====
   key 要跟私訊列表上顯示的帳號（item.sender）完全一樣
   rules：依序比對，輸入的文字「包含」任一關鍵字就回覆 reply，先符合的優先
   fallback：沒有任何關鍵字符合時，固定回覆這句 */
type ChatMsg = { from: "me" | "them"; text: string };
type ChatBot = {
  rules: { keywords: string[]; reply: string }[];
  fallback: string;
};

const CHAT_BOTS: Record<string, ChatBot> = {
  村井優: {
    rules: [
      { keywords: ["你好", "嗨"], reply: "A：你好呀" },
      { keywords: ["吃飯", "晚餐"], reply: "A：我還沒吃" },
    ],
    fallback: "1",
  },
  石森璃花: {
    rules: [
      { keywords: ["在嗎"], reply: "B：在" },
      { keywords: ["晚安"], reply: "B：晚安，好夢" },
      { keywords: ["照片", "圖"], reply: "[image]/ig/rika.jpg" },
      { keywords: ["愛你", "港區"], reply: "[audio]/ig/rika.mp3" },

    ],
    fallback: "來看看我的 IG：https://www.instagram.com/rika.ishimori.official/",
  },
  // 之後新增 C、D 就照這個格式再加一組：
  // 對象C的帳號: { rules: [{ keywords: ["..."], reply: "..." }], fallback: "3" },
};

// 沒有設定規則的聊天對象（避免空白）
const DEFAULT_BOT: ChatBot = { rules: [], fallback: "🌸" };

export function InstagramSkin(p: SkinProps) {
  
  const [tab, setTab] = useState("首頁");
  const [dm, setDm] = useState(false);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [chatAvatar, setChatAvatar] = useState<string>(""); 
  const [query, setQuery] = useState("");
  const [pTab, setPTab] = useState("grid");
const [unliked, setUnliked] = useSkinState<string[]>(p, "unliked", []);
const isLiked = (id: string) => !unliked.includes(id);
const [flipped, setFlipped] = useSkinState<string[]>(p, "reelFlip", []);
const reelLiked = (i: Item) => (i.meta.liked === "1") !== flipped.includes(i.id);
  const [followList, setFollowList] = useState<"followers" | "following" | null>(null);
  const [chatLog, setChatLog] = useSkinState<string[]>(p, "chats", []);
  const { playing: musicOn } = usePlayer();
  useEffect(() => {
    if (tab === "Reels" && musicOn) playerToggle();
  }, [tab, musicOn]);
  const [draft, setDraft] = useState("");
    const storyDrag = useRef({ down: false, x: 0, left: 0 });
  const logRef = useRef(chatLog);
  logRef.current = chatLog;
  const msgBox = useRef<HTMLDivElement>(null);

  // 取出某個對象的所有訊息
  const chatOf = (who: string): ChatMsg[] =>
    chatLog
      .filter((l) => l.startsWith(who + "\t"))
      .map((l) => {
        const [, from, ...rest] = l.split("\t");
        return { from: from === "me" ? "me" : "them", text: rest.join("\t") };
      });

  const pushChat = (who: string, msg: ChatMsg) => {
    const next = [...logRef.current, who + "\t" + msg.from + "\t" + msg.text];
    logRef.current = next;
    setChatLog(next);
  };
  const timer = useRef<number | undefined>(undefined);

  const clearChat = (who: string) => {
    window.clearTimeout(timer.current); // 取消還沒送出的自動回覆
    const next = logRef.current.filter((l) => !l.startsWith(who + "\t"));
    logRef.current = next;
    setChatLog(next);
    setDraft("");
  };
  const sendChat = () => {
    const text = draft.trim();
    if (!text || !chatWith) return;
    const who = chatWith;
    const bot = CHAT_BOTS[who] ?? DEFAULT_BOT;
    const lower = text.toLowerCase();
    const hit = bot.rules.find((r) =>
      r.keywords.some((k) => lower.includes(k.toLowerCase())),
    );
    const reply = hit ? hit.reply : bot.fallback;
    pushChat(who, { from: "me", text });
    setDraft("");
        timer.current = window.setTimeout(
      () => pushChat(who, { from: "them", text: reply }),
      750,
    );
  };

  useEffect(() => {
    const el = msgBox.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog, chatWith]);

  const inFolder = (i: Item, names: string[]) => names.includes(i.folder);
  const dms = p.items.filter((i) => inFolder(i, ["私訊", "私信"]));
  const reels = p.items.filter((i) => inFolder(i, ["Reels"]));
  const savedPosts = p.items.filter((i) => inFolder(i, ["珍藏"]));
  const profile = p.items.find((i) => inFolder(i, ["個人主頁", "个人主页"]));
  const posts = p.items.filter(
  (i) =>
    !inFolder(i, IG_OTHER) &&
    i.folder !== "追蹤中"
);

  const name = profile?.title || p.owner || "我";
  const handle = profile?.sender || name;
  const me = profile?.avatar || "";
    const followingList = p.items.filter((i) => i.folder === "追蹤中");
  // 自己發布的貼文
const myPosts = posts.filter((i) => i.sender === handle);
  const storyOrder = useMemo(
    () => [...followingList].sort(() => Math.random() - 0.5),
    [followingList.length],
  );

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const found = posts.filter((i) =>
    (i.title + i.body + i.sender).toLowerCase().includes(query.toLowerCase()),
  );
  const mine = pTab === "saved" ? savedPosts : myPosts;

    const post = (i: Item) => (
    <article className="igx-post" key={i.id}>
      <div className="igx-post-head">
        <IgAvatar name={i.sender} src={i.avatar} size={32} />
        <strong>{i.sender}</strong>
        <MoreHorizontal size={20} />
      </div>
<IgCarousel item={i} />
      <div className="igx-actions">
        <button
          aria-label="喜歡"
          onClick={() => toggle(unliked, setUnliked, i.id)}
        >
          <Heart
            size={25}
            fill={isLiked(i.id) ? "#ed4956" : "none"}
            color={isLiked(i.id) ? "#ed4956" : "currentColor"}
          />
        </button>
        <button aria-label="轉發">
          <Repeat2 size={26} />
        </button>
        <button aria-label="分享">
          <Send size={23} />
        </button>
        <button aria-label="收藏" className="igx-save">
          <Bookmark size={24} />
        </button>
      </div>
      <div className="igx-caption">
        <strong>
          {Math.max(0, i.likes - (isLiked(i.id) ? 0 : 1))} 個讚
        </strong>
        <p>
          <b>{i.sender}</b> {i.body}
        </p>
      </div>
    </article>
  );

  const grid = (list: Item[]) => (
    <div className="igx-grid">
      {list.map((i) => (
        <div key={i.id}>
          <ItemMedia item={i} />
        </div>
      ))}
    </div>
  );

  const nav = [
    { key: "首頁", icon: House },
    { key: "Reels", icon: CirclePlay },
    { key: "私訊", icon: Send },
    { key: "搜尋", icon: Search },
    { key: "個人", icon: null },
  ];

  return (
    <div
      className={
        "instagram-ui independent-skin igx" + (tab === "Reels" ? " dark" : "")
      }
    >
      {(tab === "首頁" || tab === "私訊" || dm) && !chatWith && (
        <header className="igx-top">
          {/* 左側按鈕 */}
          <div style={{ width: 30, display: "flex", alignItems: "center" }}>
            {dm ? (
              <button aria-label="返回" onClick={() => setDm(false)}>
                <ChevronLeft size={26} />
              </button>
            ) : tab === "首頁" ? (
              <button aria-label="新增內容" onClick={() => p.onAdd?.()}>
                <Plus size={28} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>

          {/* 中間標題 */}
          <div className={"igx-logo" + (dm || tab === "私訊" ? " plain" : "")}>
            {dm || tab === "私訊" ? (
              handle
            ) : (
              <img
                src="/ig.header.png"
                alt="Instagram"
                style={{ height: "38px", objectFit: "contain" }}
              />
            )}
          </div>

          {/* 右側按鈕 */}
          <div style={{ width: 30, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {tab === "首頁" && (
              <button
                aria-label="通知"
                style={{ position: "relative", background: "none", border: "none", padding: 0 }}
              >
                <Heart size={26} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </header>
      )}

      <div className="skin-scroll igx-scroll">
        {dm ? (
          chatWith ? (
            // 👇 專屬聊天室畫面
<div className="igx-chat-room">
  <div className="igx-chat-header">
    <button
      aria-label="返回"
      onClick={() => {
        if (chatWith) clearChat(chatWith);
        setChatWith(null);
        setDm(false);
        setFollowList("following");
      }}
    >
      <ArrowLeft size={26} />
    </button>
    <span className="igx-online-wrap">
      <IgAvatar name={chatWith || ""} src={chatAvatar} size={42} />
      <i className="igx-online" />
    </span>
    <div className="igx-chat-title">
      <strong>
        {chatWith}
        <ChevronRight size={16} color="#8e8e93" />
      </strong>
      <small>目前在線上</small>
    </div>
    <div className="igx-chat-tools">
      <Phone size={24} />
      <Video size={24} />
    </div>
  </div>

  <div className="igx-chat-messages" ref={msgBox}>
    {(() => {
const first = dms.find((d) => d.sender === chatWith);
    const history: ChatMsg[] = [
      ...(first?.body ? [{ from: "them" as const, text: first.body }] : []),
      ...chatOf(chatWith ?? ""),
    ];
      return (
        <>

          {history.map((m, n) => {
            const isFirst = history[n - 1]?.from !== m.from;
            const isLast = history[n + 1]?.from !== m.from;
            const cls = m.from === "me" ? "sent" : "received";
            return (
              <div
                key={n}
                className={
                  "igx-row " + cls + (isFirst ? " first" : "") + (isLast ? " last" : "")
                }
              >
                {m.from === "them" && (
                  <IgAvatar name={chatWith || ""} src={chatAvatar} size={40} />
                )}
<div
                  className={"igx-msg " + cls}
                  style={{
                    padding:
                      m.text.startsWith("[image]") || m.text.startsWith("[audio]")
                        ? 0
                        : undefined,
                    background:
                      m.text.startsWith("[image]") || m.text.startsWith("[audio]")
                        ? "transparent"
                        : undefined,
                  }}
                >
                  {(() => {
                    // 1. 圖片訊息
                    if (m.text.startsWith("[image]")) {
                      const rawUrl = m.text.replace("[image]", "");
                      const srcUrl = coverUrl(rawUrl) || rawUrl;
                      return (
                        <img
                          src={srcUrl}
                          alt="圖片"
                          style={{
                            maxWidth: "220px",
                            borderRadius: "16px",
                            display: "block",
                          }}
                        />
                      );
                    }

                    // 2. 仿 IG 聲波語音訊息
                    if (m.text.startsWith("[audio]")) {
                      const rawUrl = m.text.replace("[audio]", "");
                      const srcUrl = coverUrl(rawUrl) || rawUrl;
                      return (
                        <IgVoiceBubble
                          src={srcUrl}
                          isSent={m.from === "me"}
                        />
                      );
                    }

                    // 3. 一般文字與網址
                    return m.text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                      if (part.match(/^https?:\/\//)) {
                        return (
                          <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: cls === "sent" ? "#fff" : "#0095f6",
                              textDecoration: "underline",
                            }}
                          >
                            {part}
                          </a>
                        );
                      }
                      return <span key={index}>{part}</span>;
                    });
                  })()}
                </div>
                </div>
              );
            })}
          </>
        );
      })()}
    </div>

  <form
    className="igx-chat-form"
    onSubmit={(e) => {
      e.preventDefault();
      sendChat();
    }}
  >
    <span className="cam">
      <Camera size={22} />
    </span>
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder="發送訊息......"
      aria-label="輸入訊息"
    />
    {draft.trim() ? (
      <button type="submit" className="send">
        傳送
      </button>
    ) : (
      <span className="tools">
        <Mic size={20} />
        <Image size={20} />
        <Smile size={20} />
        <Plus size={20} />
      </span>
    )}
  </form>
</div>

          ) : (
            // 👇 私訊列表
            <>
              {dms.map((i) => (
                <button
                  key={i.id}
                  className="igx-dm"
                  onClick={() => {
                    setChatWith(i.sender);
                    setChatAvatar(i.avatar);
                  }}
                >
                  <IgAvatar name={i.sender} src={i.avatar} size={52} />
                  <div>
                    <strong>{i.sender}</strong>
                    <p>{i.body}</p>
                  </div>
                  <time>{i.time.slice(5, 10)}</time>
                </button>
              ))}
              {!dms.length && <p className="igx-empty">還沒有訊息</p>}
            </>
          )
        ) : tab === "首頁" ? (
          <>
                        <div
              className="igx-stories"
              onPointerDown={(e) => {
                storyDrag.current = {
                  down: true,
                  x: e.clientX,
                  left: e.currentTarget.scrollLeft,
                };
              }}
              onPointerMove={(e) => {
                const d = storyDrag.current;
                if (d.down)
                  e.currentTarget.scrollLeft = d.left - (e.clientX - d.x);
              }}
              onPointerUp={() => (storyDrag.current.down = false)}
              onPointerLeave={() => (storyDrag.current.down = false)}
              onPointerCancel={() => (storyDrag.current.down = false)}
            >
              <button
                className="igx-story mine"
                onClick={p.creator ? p.onAdd : undefined}
              >
                <span className="ring none">
                  <IgAvatar name={name} src={me} size={58} />
                  <i>
                    <Plus size={12} strokeWidth={3} />
                  </i>
                </span>
                <small>你的限時動態</small>
              </button>
{storyOrder.map((i) => (
                <button key={i.id} className="igx-story">
                  <span className="ring">
                    <IgAvatar
                      name={i.title || i.sender}
                      src={i.avatar}
                      size={58}
                    />
                  </span>
                  <small>{i.title || i.sender}</small>
                </button>
              ))}
            </div>
            {posts.map(post)}
            {!posts.length && <p className="igx-empty">還沒有貼文</p>}
          </>
        ) : tab === "搜尋" ? (
          <>
            <label className="igx-search">
              <Search size={16} />
              <input
                value={query}
                placeholder="搜尋"
                aria-label="搜尋"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {grid(found)}
            {!found.length && <p className="igx-empty">沒有符合的內容</p>}
          </>
                ) : tab === "Reels" ? (
          <div className="igr-wrap">
            <div className="igr-top">
              <strong>Reels</strong>
              <Camera size={26} />
            </div>
            <div className="igr-list">
              {reels.map((i) => (
  <IgReel
    key={i.id}
    item={i}
    liked={reelLiked(i)}
    onLike={() => toggle(flipped, setFlipped, i.id)}
  />
))}
              {!reels.length && <p className="igx-empty">還沒有 Reels</p>}
            </div>
          </div>
        ) : tab === "私訊" ? (
          <>
            {dms.map((i) => (
              <button
                key={i.id}
                className="igx-dm"
                onClick={() => p.onItem(i)}
              >
                <IgAvatar name={i.sender} src={i.avatar} size={52} />
                <div>
                  <strong>{i.sender}</strong>
                  <p>{i.body}</p>
                </div>
                <time>{i.time.slice(5, 10)}</time>
              </button>
            ))}
            {!dms.length && <p className="igx-empty">還沒有訊息</p>}
          </>
        ) : (
          // 👇 個人主頁
          <>
            <div className="igx-ptop">
              <button aria-label="新增" onClick={p.creator ? p.onAdd : undefined}>
                <Plus size={30} strokeWidth={1.6} />
              </button>
              <strong>
                <Lock size={15} /> {handle}
              </strong>
              <button aria-label="選單">
                <Menu size={30} strokeWidth={1.6} />
              </button>
            </div>
            <div className="igx-phead">
<div className="igx-phead">
  <IgAvatar name={name} src={me} size={90} ghost />

  <div className="igx-pinfo">
    <div className="igx-display-name">{name}</div>

    <div className="igx-stats">
      <span>
        <b>{myPosts.length}</b>
        貼文
      </span>

      <span>
        <b>{profile?.meta?.followers ?? "0"}</b>
        粉絲
      </span>

      <span
        onClick={() => setFollowList("following")}
        style={{ cursor: "pointer" }}
      >
        <b>{profile?.meta?.following ?? "0"}</b>
        追蹤中
      </span>
    </div>
  </div>
</div>
            </div>

            <div className="igx-pbtns">
              <button>編輯個人檔案</button>
              <button>分享個人檔案</button>
            </div>
            <div className="igx-ptabs">
              <button
                aria-label="貼文"
                className={pTab === "grid" ? "on" : ""}
                onClick={() => setPTab("grid")}
              >
                <Grid size={22} />
              </button>
              <button
                aria-label="已收藏"
                className={pTab === "saved" ? "on" : ""}
                onClick={() => setPTab("saved")}
              >
                <Bookmark size={22} />
              </button>
            </div>
            {grid(mine)}
            {!mine.length && <p className="igx-empty">還沒有貼文</p>}
          </>
        )}
      </div>
       {/* 👇 只有不在聊天室時，才顯示底部導覽列 */}
      {!chatWith && (
        <nav className="igx-nav">
          {nav.map((n) => {
            const isActive = tab === n.key;
            return (
              <button
                key={n.key}
                aria-label={n.key}
                className={isActive ? "on" : ""}
                onClick={() => {
                  if (n.key === "搜尋" || n.key === "私訊") return;
                  setTab(n.key);
                  setDm(false);
                }}
              >
                {n.icon ? (
                  <n.icon size={26} strokeWidth={isActive ? 2.8 : 1.9} />
                ) : (
                  <IgAvatar name={name} src={me} size={26} />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* 👇 追蹤列表的彈出畫面 */}
      {followList && (
        <div className="igx-follow-overlay">
          <div className="igx-follow-header">
            <button onClick={() => setFollowList(null)}>
              <ChevronLeft size={24} />
            </button>
            <strong>
              {followList === "following" ? "追蹤中" : "粉絲"}
            </strong>
            <span style={{ width: 24 }} />
          </div>
          <div style={{ padding: "16px 16px 4px", fontSize: "14px", color: "#6a6a70" }}>
            排設依據 追蹤日期：由近到遠
          </div>
          <div className="igx-follow-list">
            {followingList.map((user) => (
              <div key={user.id} className="igx-follow-row">
                <IgAvatar name={user.title} src={user.avatar} size={44} />
                <div className="igx-follow-info" style={{ display: "flex", flexDirection: "column", gap: "2px", marginLeft: "12px" }}>
                  <strong style={{ fontSize: "14px", fontWeight: "600", color: "#000" }}>
                    {user.title}
                  </strong>
                  {user.sender && (
                    <small style={{ fontSize: "13px", color: "#8e8e93" }}>
                      {user.sender}
                    </small>
                  )}
                </div>
                <button
                  onClick={() => {
                    setFollowList(null);
                    setChatWith(user.sender);
                    setChatAvatar(user.avatar);
                    setDm(true);
                  }}
                >
                  發送訊息
                </button>
              </div>
            ))}
            {followingList.length === 0 && (
              <p className="igx-empty" style={{ padding: "20px", textAlign: "center", color: "#8e8e93" }}>
                還沒有追蹤任何人
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}