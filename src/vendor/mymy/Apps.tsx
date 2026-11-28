
/* React/data adapters for dudwo5/Mymy UI templates: kt/ktn/KHD/bub,
 * igHome/igProfile/igDM/igSheet, xHome. See NOTICE.txt for permission.
 * Author content, DOM globals, timers and media dependencies are excluded. */
import { useEffect, useRef, useState } from "react";
import { InstagramSkin } from "../../AppSkins";
import {
  ArrowLeft,
  Search,
  Plus,
  Settings,
  Users,
  MessageCircle,
  MoreHorizontal,
  Heart,
  Home,
  Grid,
  Bookmark,
  Repeat2,
  BarChart2,
  Share,
  User,
  Bell,
  Smile,
  Menu,
  Compass,
} from "lucide-react";
import type { SkinProps } from "../../AppSkins";
import { Avatar, Media } from "../../skins/shared";
import { useSkinState } from "../../skinState";
import { makeItem, type Item } from "../../schema";
import "./ui.css";
import "./adapter.css";
import "./x.css";

function grouped(items: Item[]) {
  return [...new Set(items.map((i) => i.title))].map((title) => ({
    title,
    items: items.filter((i) => i.title === title),
  }));
}

export function messageRun(items: Item[], index: number) {
  const m = items[index],
    previous = items[index - 1],
    next = items[index + 1];
  return {
    first:
      !previous ||
      previous.outgoing !== m.outgoing ||
      previous.sender !== m.sender,
    last: !next || next.outgoing !== m.outgoing || next.sender !== m.sender,
  };
}

const read = (p: SkinProps, i: Item) =>
  p.creator || i.password ? p.onItem(i) : p.onRead(i.id);

function Blank() {
  return <p className="mymy-empty">目前沒有內容</p>;
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="返回" onClick={onClick}>
      <ArrowLeft size={22} />
    </button>
  );
}

export function MymyKakao(p: SkinProps) {
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "聊天"),
    [sent, setSent] = useSkinState<string[]>(p, "mymyKktSent", []),
    [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [menu, setMenu] = useState(false);

  const list = grouped(p.items),
    messages = [
      ...p.items.filter((i) => i.title === p.thread),
      ...sent.flatMap((raw, index) => {
        try {
          const entry: unknown = JSON.parse(raw);
          if (
            !Array.isArray(entry) ||
            entry.length !== 3 ||
            !entry.every((v) => typeof v === "string") ||
            entry[0] !== p.thread
          )
            return [];
          return [
            makeItem({
              id: "local-kkt-" + index,
              title: entry[0],
              body: entry[1],
              time: entry[2],
              sender: p.owner || "機主",
              outgoing: true,
              meta: { local: "true" },
            }),
          ];
        } catch {
          return [];
        }
      }),
    ],
    scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroll.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [p.thread, messages.length]);

  return (
    <div className="mymy-ui mymy-kakao" data-mymy="kakao">
      {p.thread ? (
        <>
          <header className="kzth">
            <Back onClick={() => p.onThread("")} />
            <span className="kzname">{p.thread}</span>
            <span className="kzpill">
              <button aria-label="聊天選單" onClick={() => setMenu(!menu)}>
                <Menu size={21} />
              </button>
            </span>
          </header>
          <div className="msgs kk" ref={scroll}>
            {messages.map((m, i) => {
              const run = messageRun(messages, i);
              return (
                <div
                  key={m.id}
                  className={
                    "kzm " +
                    (m.outgoing ? "kzmy" : "kzot") +
                    (run.first ? " first" : "")
                  }
                >
                  {!m.outgoing && run.first && (
                    <>
                      <div className="kzmav">
                        <Avatar name={m.sender} src={m.avatar} />
                      </div>
                      <div className="kzmn">{m.sender}</div>
                    </>
                  )}
                  {m.outgoing && run.last && (
                    <span className="kzt">
                      {m.meta.unread || ""}
                      <br />
                      {m.time.slice(-5)}
                    </span>
                  )}
                  <button
                    className={"kzbub" + (m.media ? " kzimg" : "")}
                    onClick={() => m.meta.local !== "true" && read(p, m)}
                  >
                    {m.media ? <Media item={m} /> : m.body}
                  </button>
                  {!m.outgoing && run.last && (
                    <span className="kzt">{m.time.slice(-5)}</span>
                  )}
                </div>
              );
            })}
            {!messages.length && <Blank />}
          </div>
          <form
            className="kzinp"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                setSent([
                  ...sent,
                  JSON.stringify([
                    p.thread,
                    draft.trim(),
                    p.virtualTime || "09:41",
                  ]),
                ]);
                setDraft("");
              }
            }}
          >
            <button
              type="button"
              aria-label="新增聊天內容"
              onClick={() => (p.creator ? p.onAdd() : setMenu(!menu))}
            >
              <Plus size={21} />
            </button>
            <input
              aria-label="聊天訊息"
              placeholder="輸入訊息"
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Smile size={22} />
            <button
              className={draft.trim() ? "go" : ""}
              aria-label="傳送聊天訊息"
              disabled={!draft.trim()}
            >
              ↑
            </button>
          </form>
          {menu && (
            <div className="mymy-local-menu">
              <strong>{p.thread}</strong>
              <p>
                群組成員：{[...new Set(messages.map((m) => m.sender))].join("、")}
              </p>
              <button onClick={() => setMenu(false)}>完成</button>
            </div>
          )}
        </>
      ) : (
        <div className="kzkk">
          <div className="kzhd">
            <header className="kzkh">
              <b className="kzti">
                {tab === "好友" ? p.owner || "好友" : "聊天"}
              </b>
              <span className="kzic">
                <button
                  aria-label="搜尋聊天"
                  onClick={() => setQuery(query ? "" : " ")}
                >
                  <Search size={21} />
                </button>
                {p.creator && (
                  <button aria-label="新增內容" onClick={p.onAdd}>
                    <Plus />
                  </button>
                )}
                <button aria-label="聊天設定" onClick={() => setMenu(!menu)}>
                  <Settings size={21} />
                </button>
              </span>
            </header>
            <div className="kzkc2">
              {["好友", "聊天"].map((t) => (
                <button
                  key={t}
                  className={"kzkpl " + (t === tab ? "on" : "")}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {query !== "" && (
              <input
                className="mymy-search"
                aria-label="搜尋聊天"
                value={query.trimStart()}
                onChange={(e) => setQuery(e.target.value || " ")}
                placeholder="搜尋"
              />
            )}
          </div>
          <div className="kzkb">
            <div className="kzksec">
              {tab === "好友" ? "好友" : "所有聊天"} {list.length}
            </div>
            {list
              .filter((g) => g.title.includes(query.trim()))
              .map((g) => {
                const last = g.items.at(-1)!;
                return (
                  <button
                    className="kzkr kzkcr"
                    key={g.title}
                    onClick={() => p.onThread(g.title)}
                  >
                    <Avatar name={last.sender || g.title} src={last.avatar} />
                    <span className="kzkn">
                      <b>{g.title}</b>
                      <small>{tab === "好友" ? last.sender : last.body}</small>
                    </span>
                    <span className="kzkmt">
                      {last.time.slice(-5)}
                      {last.meta.unread && (
                        <i className="kzkbd">{last.meta.unread}</i>
                      )}
                    </span>
                  </button>
                );
              })}
            {!list.length && <Blank />}
          </div>
          <nav className="kzknv">
            {[Users, MessageCircle, Compass, Grid, MoreHorizontal].map(
              (Icon, i) => (
                <button
                  key={i}
                  aria-label={["好友", "聊天", "探索", "更多功能", "設定"][i]}
                  className={(tab === "好友" ? 0 : 1) === i ? "on" : ""}
                  onClick={() =>
                    i < 2 ? setTab(["好友", "聊天"][i]) : setMenu(true)
                  }
                >
                  <Icon />
                </button>
              ),
            )}
          </nav>
          {menu && (
            <div className="mymy-local-menu">
              <strong>KakaoTalk</strong>
              <p>作品內聊天</p>
              <button onClick={() => setMenu(false)}>完成</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MymyInstagram(p: SkinProps) {
  return <InstagramSkin {...p} />;
}

/* ================= X ================= */
const XI = {
  rep: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H11l-4 4v-4H4Z"/></svg>',
  rt: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m17 3 4 4-4 4M3 11V9a2 2 0 0 1 2-2h16M7 21l-4-4 4-4m14 0v2a2 2 0 0 1-2 2H3"/></svg>',
  lk: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20.5S3 15.4 3 8.9A4.9 4.9 0 0 1 12 6.4a4.9 4.9 0 0 1 9 2.5c0 6.500-9 11.600-9 11.600Z"/></svg>',
  vw: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
    sh: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
};
const XLOGO =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.7 3h3.1l-6.8 7.700L22 21h-6.200l-4.900-6.400L5.300 21H2.200l7.300-8.300L2 3h6.400l4.400 5.800ZM16.600 19.100h1.700L7.500 4.800H5.700Z"/></svg>';

function XIcon({ html }: { html: string }) {
  return <span className="x-ico" dangerouslySetInnerHTML={{ __html: html }} />;
}

type MyPost = { id: string; text: string; time: string };
type MyComment = { pid: string; name: string; handle: string; text: string };

/* ===== 自動留言規則 =====
   keywords：貼文「包含」其中任一個詞，就觸發這組留言
   replies ：這組可以留的言（留言裡可以埋別的關鍵字，讓玩家接著發）
   要新增劇情，就照這個格式再加一組 */
type XRule = { keywords: string[]; replies: string[] };

const X_RULES: XRule[] = [
  {
    keywords: ["咖啡", "coffee"],
    replies: [
      "我只喝美式，你有試過手沖嗎？",
      "巷口新開了一間貓咖啡，聽說店貓超黏人",
      "咖啡喝多了晚上會睡不著欸",
    ],
  },
  {
    keywords: ["手沖"],
    replies: [
      "手沖我推薦淺焙，花香很明顯",
      "我家有磨豆機，但一直沒拿出來用",
      "下雨天手沖特別有氣氛",
    ],
  },
  {
    keywords: ["貓", "貓咪"],
    replies: [
      "你家貓會不會在你喝咖啡時跳上桌？",
      "我家貓最近只吃罐罐，其他都不理我",
      "牠半夜跑酷害我睡不著",
    ],
  },
  {
    keywords: ["睡不著", "失眠"],
    replies: [
      "睡不著的話我都半夜煮宵夜",
      "數羊沒有用，要不要試試聽雨聲？",
      "失眠的夜晚最適合發廢文",
    ],
  },
  {
    keywords: ["宵夜", "夜宵"],
    replies: [
      "宵夜我選泡麵加蛋",
      "半夜吃火鍋才是王道",
      "吃完宵夜明天又要後悔了",
    ],
  },
  {
    keywords: ["下雨", "雨天"],
    replies: [
      "下雨天最適合窩在家喝咖啡",
      "我今天沒帶傘，整個人濕透",
      "雨聲配貓呼嚕聲，完美",
    ],
  },
  {
    keywords: ["火鍋"],
    replies: [
      "火鍋一定要有芝麻醬",
      "冬天來一鍋，什麼煩惱都沒了",
      "吃完火鍋還想喝杯咖啡",
    ],
  },
];

// 沒有任何關鍵字符合時的通用留言
const X_FALLBACK = [
  "⋯⋯？",
  "我好像沒看懂 XD",
  "這個話題沒什麼人在聊欸",
  "+1",
];
// 搜尋頁「最近」的帳號和關鍵字，自己改
const X_RECENT_USERS = [
  { name: "でんでん", handle: "1636fafa", lock: true },
  { name: "サクラミ…", handle: "sakura__", lock: false },
  { name: "サクコ…", handle: "sakukoio", lock: false },
  { name: "ぽーた", handle: "t46_sakura", lock: false },
];
const X_RECENT_TERMS = [
  "ヌオー壁紙",
  "壁紙",
  "村井優 山下瞳月",
  "村井優不仲",
  "兔貓不仲",
];
const X_ME = "/avatar/ig.jpg";

// 留言的人（輪流使用）
const X_USERS = [
  { name: "小圓", handle: "yuan_0" },
  { name: "阿倫", handle: "alun88" },
  { name: "夜貓子", handle: "nightcat" },
  { name: "Mia", handle: "mia_daily" },
  { name: "路過的人", handle: "passerby" },
  
];

const MAX_RULES = 3; // 一則貼文最多觸發幾組規則
const PER_RULE = 2; // 每組隨機取幾則留言
const REPLY_DELAY = 1500; // 每則留言間隔（毫秒）
const HIGHLIGHT_WORDS = false; // true = 留言裡的關鍵字會變成可點的連結，點了直接帶入撰寫視窗

const ALL_KEYWORDS = X_RULES.flatMap((r) => r.keywords);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function makeReplies(text: string): string[] {
  const low = text.toLowerCase();
  const hit = X_RULES.filter((r) =>
    r.keywords.some((k) => low.includes(k.toLowerCase())),
  ).slice(0, MAX_RULES);
  const out = hit.flatMap((r) =>
    [...r.replies].sort(() => Math.random() - 0.5).slice(0, PER_RULE),
  );
  return out.length ? out : X_FALLBACK.slice(0, 2);
}

// 留言文字：HIGHLIGHT_WORDS 開啟時，關鍵字變成可點
function XText({ text, onPick }: { text: string; onPick: (w: string) => void }) {
  if (!HIGHLIGHT_WORDS) return <>{text}</>;
  const re = new RegExp("(" + ALL_KEYWORDS.map(escapeRe).join("|") + ")", "g");
  return (
    <>
      {text.split(re).map((part, n) =>
        ALL_KEYWORDS.includes(part) ? (
          <button key={n} type="button" className="x-kw" onClick={() => onPick(part)}>
            {part}
          </button>
        ) : (
          <span key={n}>{part}</span>
        ),
      )}
    </>
  );
}

export function MymyX(p: SkinProps) {
  const [dark, setDark] = useSkinState<boolean>(p, "x-dark", true);
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "推薦"),
[likes, setLikes] = useState<string[]>([]),
[reposts, setReposts] = useState<string[]>([]),
[marks, setMarks] = useState<string[]>([]),
    [query, setQuery] = useState("");
  const [recentOn, setRecentOn] = useState(true);
  const [detailId, setDetailId] = useState("");
  const [rep, setRep] = useState("");
  /* ===== 玩家自己發的貼文 + 自動留言（存起來，重新整理還在）===== */
const [postLog, setPostLog] = useState<string[]>([]);
const [cmLog, setCmLog] = useState<string[]>([]);
  const postRef = useRef(postLog);
  postRef.current = postLog;
  const cmRef = useRef(cmLog);
  cmRef.current = cmLog;
  const feedRef = useRef<HTMLDivElement>(null);

  // 最新的貼文排最上面
  const myPosts: MyPost[] = postLog.map((s) => JSON.parse(s)).reverse();
  const commentsOf = (pid: string): MyComment[] =>
    cmLog.map((s) => JSON.parse(s) as MyComment).filter((c) => c.pid === pid);

  /* ===== 新增貼文視窗 ===== */
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const [toast, setToast] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const startNew = (prefill = "") => {
    setTxt(prefill);
    setOpen(true);
    setTimeout(() => taRef.current?.focus(), 0);
  };
  const cancel = () => setOpen(false);

  // 發出貼文，然後讓大家一則一則留言
  const publishPost = (text: string) => {
    const pid = "my-" + Date.now();
    const nextPosts = [
      ...postRef.current,
      JSON.stringify({ id: pid, text, time: "剛剛" }),
    ];
    postRef.current = nextPosts;
    setPostLog(nextPosts);
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    makeReplies(text).forEach((line, n) => {
      setTimeout(() => {
        const u = X_USERS[cmRef.current.length % X_USERS.length];
        const c: MyComment = { pid, name: u.name, handle: u.handle, text: line };
        const next = [...cmRef.current, JSON.stringify(c)];
        cmRef.current = next;
        setCmLog(next);
      }, REPLY_DELAY * (n + 1));
    });
  };

  const send = () => {
    const body = txt.trim();
    if (!body) return;
    p.fireEv?.("xsend", { subject: "新貼文", text: body });
    setOpen(false);
    publishPost(body);
    setToast(true);
    setTimeout(() => setToast(false), 1400);
  };

  const isLiked = (id: string) =>
    typeof p.ui?.["liked-" + id] === "boolean"
      ? Boolean(p.ui["liked-" + id])
      : likes.includes(id);

  const isSaved = (id: string) =>
    typeof p.ui?.["saved-" + id] === "boolean"
      ? Boolean(p.ui["saved-" + id])
      : marks.includes(id);

  const toggle = (id: string, v: string[], set: (x: string[]) => void) =>
    set(v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  if (tab === "搜尋") {
    const q = query.trim();
    return (
      <div
        className={"mymy-ui mymy-x " + (dark ? "x-reference-dark" : "")}
        data-mymy="twitter"
      >
        <div className="x-sp">
          <div className="x-sp-bar">
            <button
              aria-label="返回"
              onClick={() => {
                setQuery("");
                setTab("為你推薦");
              }}
            >
              <ArrowLeft size={22} />
            </button>
            <Search size={22} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋"
            />
          </div>

          {q === "" && recentOn && (
            <>
              <div className="x-sp-h">
                <b>最近</b>
                <button aria-label="清除最近搜尋" onClick={() => setRecentOn(false)}>
                  ✕
                </button>
              </div>
              <div className="x-sp-users">
                {X_RECENT_USERS.map((u) => (
                  <button
                    key={u.handle}
                    className="x-sp-u"
                    onClick={() => setQuery(u.name)}
                  >
                    <Avatar name={u.name} />
                    <b>
                      {u.name}
                      {u.lock ? " 🔒" : ""}
                    </b>
                    <small>@{u.handle}</small>
                  </button>
                ))}
              </div>
              {X_RECENT_TERMS.map((t) => (
                <button key={t} className="x-sp-t" onClick={() => setQuery(t)}>
                  <span>{t}</span>
                  <em>↖</em>
                </button>
              ))}
            </>
          )}

          {q !== "" &&
            p.items
              .filter((i) => (i.title + i.body + i.sender).includes(q))
              .map((i) => (
                <button key={i.id} className="x-sp-r" onClick={() => p.onItem(i)}>
                  <Avatar name={i.sender} src={i.avatar} />
                  <div>
                    <b>{i.sender}</b>
                    <small> @{i.meta.handle || "user"}</small>
                    <div>{i.body}</div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    );
  }
    const detail = myPosts.find((m) => m.id === detailId);
  if (detail) {
    const cms = commentsOf(detail.id);
    const addMine = () => {
      const t = rep.trim();
      if (!t) return;
      const c: MyComment = {
        pid: detail.id,
        name: p.owner ?? "我",
        handle: "me",
        text: t,
      };
      const next = [...cmRef.current, JSON.stringify(c)];
      cmRef.current = next;
      setCmLog(next);
      setRep("");
    };
    return (
      <div
        className={"mymy-ui mymy-x " + (dark ? "x-reference-dark" : "")}
        data-mymy="twitter"
      >
        <div className="x-dt">
          <div className="x-dt-bar">
            <button aria-label="返回" onClick={() => setDetailId("")}>
              <ArrowLeft size={22} />
            </button>
            <b>貼文</b>
            <span />
          </div>
          <div className="x-dt-body">
            <div className="x-dt-main">
              <div className="x-dt-au">
                <Avatar name={p.owner ?? "我"} src={X_ME} />
                <div>
                  <b>{p.owner ?? "我"}</b>
                  <small>@me</small>
                </div>
              </div>
              <div className="x-dt-tx">{detail.text}</div>
              <div className="x-dt-meta">{detail.time} · 1 次查看</div>
              <div className="x-dt-stat">
                <span><b>{cms.length}</b> 回覆</span>
                <span><b>0</b> 轉發</span>
                <span><b>0</b> 喜歡</span>
              </div>
              <div className="x-dt-act">
                <XIcon html={XI.rep} />
                <XIcon html={XI.rt} />
                <XIcon html={XI.lk} />
                <Bookmark size={18} />
                <Share size={18} />
              </div>
            </div>
            {cms.map((c, n) => (
              <div className="x-dt-c" key={n}>
                <Avatar name={c.name} />
                <div className="x-dt-cb">
                  <div className="x-dt-ch">
                    <b>{c.name}</b>
                    <small>@{c.handle} · 剛剛</small>
                  </div>
                  <div className="x-dt-ct">
                    <XText
                      text={c.text}
                      onPick={(w) => {
                        setDetailId("");
                        startNew(w);
                      }}
                    />
                  </div>
                  <div className="kzxac">
                    <span><XIcon html={XI.rep} /></span>
                    <span><XIcon html={XI.rt} /></span>
                    <span><XIcon html={XI.lk} /></span>
                    <span><XIcon html={XI.vw} /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="x-dt-reply">
            <Avatar name={p.owner ?? "我"} src={X_ME} />
            <input
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              placeholder="貼出你的回覆"
            />
            <button onClick={addMine}>回覆</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={"mymy-ui mymy-x " + (dark ? "x-reference-dark" : "")}
      data-mymy="twitter"
    >
      <div className="kzxw">
       <header className="kzxh">
  <button className="x-me" aria-label="關閉目前 App" onClick={p.onBack}>
    <Avatar name={p.owner ?? "我"} src="/avatar/ig.jpg" />
  </button>
  <button
    className="kzxlg"
    aria-label="切換 X 外觀"
    onClick={() => setDark(!dark)}
    dangerouslySetInnerHTML={{ __html: XLOGO }}
  />
  <span className="x-up">升級</span>
</header>
        <div className="kzxtb">
          {["為你推薦", "正在追蹤", "新增 +"].map((t) => (
            <button
              className={t === tab ? "on" : ""}
              key={t}
              disabled={t === "正在追蹤"}
              onClick={() => (t === "新增 +" ? startNew() : setTab(t))}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "搜尋" && (
          <input
            className="mymy-search"
            aria-label="搜尋 X"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋"
          />
        )}
        <div className="kzxfd">

          {myPosts.map((m) => (
            <article className="kzxt" key={m.id} id={"x-post-" + m.id}>
              <Avatar name={p.owner ?? "我"} src={X_ME} />
              <div className="kzxb">
                <div className="kzxn">
                  <b>{p.owner ?? "我"}</b>
                  <small>@me · {m.time}</small>
                </div>
                <button className="kzxx" onClick={() => setDetailId(m.id)}>
                  {m.text}
                </button>
                <div className="kzxac">
                  <button
                    aria-label="查看留言"
                    onClick={() => setDetailId(m.id)}
                  >
                    <XIcon html={XI.rep} />
                    {commentsOf(m.id).length}
                  </button>
                  <span><XIcon html={XI.rt} />0</span>
                  <span><XIcon html={XI.lk} />0</span>
                  <span><XIcon html={XI.vw} />1</span>
                </div>
              </div>
            </article>
          ))}
          {p.items
            .filter((i) => (i.title + i.body).includes(query))
            .map((i) => {

              return (
                <article className="kzxt" key={i.id} id={"x-post-" + i.id}>
                  <Avatar name={i.sender} src={i.avatar} />
                  <div className="kzxb">
                    <div className="kzxn">
                      <b>{i.sender}</b>
                      <small>
                        @{i.meta.handle || "user"} · {i.time.slice(-5)}
                      </small>
                      <em>
                        <MoreHorizontal size={18} />
                      </em>
                    </div>
<div className="kzxx">{i.body}</div>
                    {i.media && (
                      <div className="kzxv">
  <Media item={i} />
</div>
                    )}
                    <div className="kzxac">
<button aria-label={"留言" + i.title}>
  <XIcon html={XI.rep} />
  {Number(i.meta.replies) || i.comments.length || ""}
</button>
                      <button
                        aria-label={"轉發" + i.title}
                        aria-pressed={reposts.includes(i.id)}
                        className={reposts.includes(i.id) ? "on rt" : ""}
                        onClick={() => toggle(i.id, reposts, setReposts)}
                      >
                        <XIcon html={XI.rt} />
                        {(Number(i.meta.reposts) || 0) + (reposts.includes(i.id) ? 1 : 0)}
                      </button>
                      <button
                        aria-label={"對" + i.title + "按讚"}
                        aria-pressed={isLiked(i.id)}
                        className={isLiked(i.id) ? "on lk" : ""}
                        onClick={() => {
                          toggle(i.id, likes, setLikes);
                          p.onUi?.("liked-" + i.id, !isLiked(i.id));
                        }}
                      >
                        <XIcon html={XI.lk} />
                        {i.likes + (isLiked(i.id) ? 1 : 0)}
                      </button>
                      <button
                        aria-label={"收藏" + i.title}
                        aria-pressed={isSaved(i.id)}
                        onClick={() => {
                          toggle(i.id, marks, setMarks);
                          p.onUi?.("saved-" + i.id, !isSaved(i.id));
                        }}
                      >
                        <Bookmark />
                      </button>
<button aria-label="分享">
  <XIcon html={XI.sh} />
</button>
                    </div>
                  </div>
                </article>
              );
            })}
          {!p.items.length && <Blank />}
        </div>
        <button className="x-fab" aria-label="新增貼文" onClick={() => startNew()}>
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
</button>
        <nav className="kzxnav">
  {[Home, Search, Bell, MessageCircle].map((Icon, n) => (
    <button
      key={n}
      aria-label={["動態", "搜尋", "通知", "私訊"][n]}
      onClick={() => n < 2 && setTab(n ? "搜尋" : "為你推薦")}
    >
      <Icon />
    </button>
  ))}
</nav>

{open && (
  <div className="x-comp">
    <div className="x-comp-h">
      <button onClick={cancel}>取消</button>
      <strong>新貼文</strong>
      <button
        className={"x-send" + (txt.trim() ? " ready" : "")}
        onClick={send}
      >
        傳送
      </button>
    </div>
    <textarea
      ref={taRef}
      value={txt}
      onChange={(e) => setTxt(e.target.value)}
      placeholder="有什麼新鮮事？"
    />
  </div>
)}
        <div className="x-toast" hidden={!toast}>已傳送</div>
      </div>
    </div>
  );
}
