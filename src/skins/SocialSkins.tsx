import { useSkinState } from "../skinState";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Camera,
  ChevronRight,
  Grid,
  Hash,
  Heart,
  Menu,
  Home,
  Share2,
  MessageCircle,
  Repeat2,
  User,
  Users,
  BarChart2,
  X,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Item } from "../schema";
import {
   Search, Plus, House, Send,
   MoreHorizontal,   
} from "lucide-react";
import { coverUrl } from "../player"; 

import {
  Avatar,
  Empty,
  groupItems,
  Header,
  Media,
  meta,
  SearchBox,
  Tabs,
  useContent,
  type Props,
} from "./shared";

function Actions({ p, item }: { p: Props; item: Item }) {
  const [liked, setLiked] = useSkinState<boolean>(p, `liked-${item.id}`, false),
    [saved, setSaved] = useSkinState<boolean>(p, `saved-${item.id}`, false);
  return (
    <div className="social-actions">
      <button aria-label={`喜歡${item.title}`} onClick={() => setLiked(!liked)}>
        <Heart size={17} fill={liked ? "currentColor" : "none"} />
        {item.likes + (liked ? 1 : 0) || ""}
      </button>
      <button aria-label={`評論${item.title}`} onClick={() => p.onItem(item)}>
        <MessageCircle size={17} />
        {item.comments.length || ""}
      </button>
      <button aria-label={`詳情${item.title}`} onClick={() => p.onItem(item)}>
        <Repeat2 size={17} />
        {meta(item, "reposts")}
      </button>
      <button aria-label={`收藏${item.title}`} onClick={() => setSaved(!saved)}>
        <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
function PostHeader({ item, p }: { item: Item; p: Props }) {
  return (
    <button className="social-author" onClick={() => p.onItem(item)}>
      <Avatar name={item.sender} />
      <span>
        <strong>{item.sender}</strong>
        <small>{meta(item, "handle", item.time)}</small>
      </span>
    </button>
  );
}
function WeiboActions({ p, item }: { p: Props; item: Item }) {
  const [liked, setLiked] = useSkinState<boolean>(p, `liked-${item.id}`, false);
  return (
    <div className="social-actions weibo-actions">
      <button aria-label={`轉發${item.title}`} onClick={() => p.onItem(item)}>
        <Share2 size={17} />
        {meta(item, "reposts", "轉發")}
      </button>
      <button aria-label={`評論${item.title}`} onClick={() => p.onItem(item)}>
        <MessageCircle size={17} />
        {item.comments.length || "評論"}
      </button>
      <button
        aria-label={`喜歡${item.title}`}
        aria-pressed={liked}
        onClick={() => setLiked(!liked)}
      >
        <ThumbsUp size={17} fill={liked ? "currentColor" : "none"} />
        {item.likes + (liked ? 1 : 0) || "點贊"}
      </button>
    </div>
  );
}
export function WeiboSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "關注");
  const [feed, setFeed] = useState("全部");
  const list = feed === "全部" ? items : items.filter((i) => i.folder === feed);
  return (
    <div className="catalog-skin weibo-ui">
      <Header p={p} />
      <div className="weibo-sections">
        {["關注", "發現", "我"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="catalog-scroll">
        {tab === "我" ? (
          <div className="weibo-profile">
            <Avatar name={p.owner ?? "我"} />
            <h2>{p.owner ?? "我"}</h2>
            <span>{items.length} 條微博</span>
          </div>
        ) : (
          <>
            <SearchBox value={q} set={setQ} />
            <div className="weibo-feed-filter">
              {["全部", ...groupItems(items).filter((g) => g !== "未分類")].map(
                (g) => (
                  <button key={g} onClick={() => setFeed(g)}>
                    {g}
                  </button>
                ),
              )}
            </div>
          </>
        )}
        {list.map((i) => (
          <article className="weibo-post" key={i.id}>
            <PostHeader p={p} item={i} />
            <button className="social-body" onClick={() => p.onItem(i)}>
              <p>{i.body}</p>
              {i.media && <Media item={i} />}
            </button>
            <WeiboActions p={p} item={i} />
          </article>
        ))}
        <Empty items={list} />
      </div>
    </div>
  );
}

type Sent = { text: string; time: string };

export function XSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "為你推薦");

  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subj, setSubj] = useState("");
  const [txt, setTxt] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(false);
  const [replied, setReplied] = useState<Record<string, Sent>>({});
  const [liked, setLiked] = useState<string[]>([]);
  const [reposted, setReposted] = useState<string[]>([]);

  const tok = useRef(0);
  const cur = useRef<Item | null>(null);
  const typeDone = useRef(true);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => { tok.current++; }, []);

  const replyOf = (i: Item) => String(meta(i, "reply", "") || "").trim();
  const canReply = (i: Item) => !!replyOf(i) && !replied[i.id];
  const num = (i: Item, k: string) => Number(meta(i, k, "0")) || 0;

  const finishType = () => {
    tok.current++;
    const m = cur.current;
    if (m) {
      setTxt(replyOf(m) + "\n\n— 原始貼文 —\n" + m.body);
      setReadOnly(false);
      requestAnimationFrame(() => {
        if (taRef.current) taRef.current.scrollTop = 0;
      });
    }
    typeDone.current = true;
    setReady(true);
  };

  const startReply = (m: Item) => {
    if (!canReply(m)) return;
    const handle = meta(m, "handle", m.sender);
    setTo("@" + handle);
    setSubj("回覆 @" + handle);
    const t = ++tok.current;
    cur.current = m;
    typeDone.current = false;
    setTxt("");
    setReadOnly(true);
    setReady(false);
    setOpen(true);

    const text = replyOf(m);
    let n = 0;
    const step = () => {
      if (t !== tok.current) return;
      if (n < text.length) {
        const ch = text[n++];
        setTxt((v) => v + ch);
        setTimeout(step, ch === "\n" ? 160 : /[，。！？、,.!?]/.test(ch) ? 140 : 70);
      } else {
        setTimeout(() => { if (t === tok.current) finishType(); }, 200);
      }
    };
    setTimeout(step, 500);
  };

  const startNew = () => {
    tok.current++;
    cur.current = null;
    setReadOnly(false);
    setTo("");
    setSubj("新貼文");
    setTxt("");
    setOpen(true);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const cancel = () => {
    tok.current++;
    cur.current = null;
    typeDone.current = true;
    setReadOnly(false);
    setReady(false);
    setOpen(false);
  };

  const send = () => {
    const c = cur.current;
    if (c && !typeDone.current) finishType();
    const body = c ? replyOf(c) : txt;
    tok.current++;
    cur.current = null;
    typeDone.current = true;
    setReadOnly(false);
    setReady(false);
    setOpen(false);
    if (c) {
      setReplied((r) => ({ ...r, [c.id]: { text: body, time: "剛剛" } }));
      setTimeout(() => {
        document.getElementById("x-post-" + c.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
    setToast(true);
    setTimeout(() => setToast(false), 1400);
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="catalog-skin x-ui" style={{ position: "relative" }}>
      <header className="x-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px" }}>
        <Avatar name={p.owner ?? "我"} />
        <X size={24} />
        <span style={{ width: 32 }} />
      </header>

      <div className="x-feed-tabs">
        <button className={tab === "為你推薦" ? "selected" : ""} onClick={() => setTab("為你推薦")}>為你推薦</button>
        <button className={tab === "正在關注" ? "selected" : ""} onClick={() => setTab("正在關注")}>正在關注</button>
      </div>

      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {items
          .filter((i) => tab === "為你推薦" || i.folder === "正在關注")
          .map((i) => {
            const sent = replied[i.id];
            const isLiked = liked.includes(i.id);
            const isRt = reposted.includes(i.id);
            return (
              <article className="x-post" key={i.id} id={"x-post-" + i.id}>
                <Avatar name={i.sender} />
                <div>
                  <button className="x-byline" onClick={() => p.onItem(i)}>
                    <strong>{i.sender}</strong>
                    <span>@{meta(i, "handle", i.sender)} · {i.time.slice(5, 10)}</span>
                  </button>
                  <button className="social-body" onClick={() => p.onItem(i)}>
                    <p>{i.body}</p>
                    {i.media && <Media item={i} />}
                  </button>

                  <div className="x-actions">
                    <button aria-label="回覆" className={canReply(i) ? "" : "off"} onClick={() => startReply(i)}>
                      <MessageCircle size={18} />
                      <span>{(i.comments?.length ?? num(i, "replies")) + (sent ? 1 : 0)}</span>
                    </button>
                    <button aria-label="轉發" className={isRt ? "on rt" : ""} onClick={() => toggle(reposted, setReposted, i.id)}>
                      <Repeat2 size={18} />
                      <span>{num(i, "reposts") + (isRt ? 1 : 0)}</span>
                    </button>
                    <button aria-label="喜歡" className={isLiked ? "on lk" : ""} onClick={() => toggle(liked, setLiked, i.id)}>
                      <Heart size={18} fill={isLiked ? "#f91880" : "none"} color={isLiked ? "#f91880" : "currentColor"} />
                      <span>{(i.likes ?? 0) + (isLiked ? 1 : 0)}</span>
                    </button>
                    <button aria-label="查看數" onClick={() => p.onItem(i)}>
                      <BarChart2 size={18} />
                      <span>{num(i, "views")}</span>
                    </button>
                  </div>

                  {sent && (
                    <div className="x-sent">
                      <div className="x-sh">
                        <MessageCircle size={16} />
                        <b>{p.owner}</b>
                        <span>已回覆 · {sent.time}</span>
                      </div>
                      <div className="x-s">回覆 @{meta(i, "handle", i.sender)}</div>
                      <div className="x-tx">{sent.text.split("\n").map((line, n) => <span key={n}>{line}<br /></span>)}</div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
      </div>

      <button className="x-fab" aria-label="發文" onClick={startNew}>
        <Plus size={24} />
      </button>

      <Tabs tabs={["為你推薦", "正在關注"]} value={tab} set={setTab} icons={[<Home />, <Users />]} />

      {open && (
        <div className="x-comp">
          <div className="x-comp-h">
            <button onClick={cancel}>取消</button>
            <strong>{subj}</strong>
            <button className={"x-send" + (ready ? " ready" : "")} onClick={send}>傳送</button>
          </div>
          {to && <div className="x-comp-to">回覆對象：{to}</div>}
          <textarea ref={taRef} value={txt} readOnly={readOnly} onChange={(e) => setTxt(e.target.value)} placeholder="有什麼新鮮事？" />
        </div>
      )}

      <div className="x-toast" hidden={!toast}>已傳送</div>
    </div>
  );
}
const thCount = (n: number) =>
  n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "萬" : String(n);

function ThAvatar({
  name,
  src = "",
  size = 40,
}: {
  name: string;
  src?: string;
  size?: number;
}) {
  const u = coverUrl(src);
  return (
    <span
      className="thx-avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {u ? <img src={u} alt="" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ThMedia({ list }: { list: string[] }) {
  const [n, setN] = useState(0);
  return (
    <div className="thx-media">
      {list.length > 1 && (
        <span className="thx-count">
          {n + 1}/{list.length}
        </span>
      )}
      <div
        className="thx-track"
        onScroll={(e) => {
          const el = e.currentTarget;
          const first = el.firstElementChild as HTMLElement | null;
          const w = (first?.offsetWidth ?? el.clientWidth) + 8;
          setN(Math.min(list.length - 1, Math.round(el.scrollLeft / w)));
        }}
      >
        {list.map((src, k) => (
          <img
            key={k}
            className={list.length > 1 ? "multi" : ""}
            src={src}
            alt=""
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

export function ThreadsSkin(p: Props) {
  const [liked, setLiked] = useState<string[]>([]);
  const profile = p.items.find((i) => i.folder === "個人主頁");
  const handle = profile?.sender || p.owner || "我";
  const me = profile?.avatar || "";
  const posts = p.items.filter((i) => i.folder !== "個人主頁");

  const toggle = (id: string) =>
    setLiked(liked.includes(id) ? liked.filter((x) => x !== id) : [...liked, id]);

  return (
    <div className="catalog-skin threads-ui thx">
      <header className="thx-top">
        {/* 👇 左邊換成 Menu 圖示 */}
        <button aria-label="選單" className="thx-menu">
          <Menu size={28} />
        </button>
        
        {/* 👇 中間換成你的圖片，請確保 public 資料夾有這張圖 */}
        <img 
          src="/threads-logo.png" 
          alt="Threads" 
          style={{ height: "50px", objectFit: "contain", marginLeft: "34px" }} 
          
        />
        
        {/* 右邊搜尋保持不變 */}
        <button aria-label="搜尋" className="thx-gray">
          <Search size={28} />
        </button>
      </header>

      <div className="thx-scroll">
        <div className="thx-compose">
          <ThAvatar name={handle} src={me} size={44} />
          <div>
            <strong>{handle}</strong>
            <span>有什麼新鮮事？</span>
          </div>
        </div>


{posts.map((i) => {
  const images = i.meta?.images
    ? i.meta.images.split(",").map((s) => s.trim()).filter(Boolean)
    : i.media
      ? [i.media]
      : [];

  const isLiked = liked.includes(i.id);
  const comments = Number(i.meta?.commentCount ?? i.comments.length);

  return (
    <div key={i.id}>
      <article className="thx-post">
        <span className="thx-av">
          <ThAvatar name={i.sender} src={i.avatar} size={44} />
          <i>
            <Plus size={11} strokeWidth={3.5} />
          </i>
        </span>

        <div className="thx-main">
          <div className="thx-by">
            <strong>{i.sender}</strong>
            <small>{i.meta?.ago || i.time.slice(5, 10)}</small>
            <MoreHorizontal
              size={20}
              className="thx-more"
              style={{ marginLeft: "auto" }}
            />
          </div>

          {i.body && <p className="thx-text">{i.body}</p>}

          {images.length > 0 && <ThMedia list={images} />}

          <div className="thx-actions">
            <button aria-label="喜歡" onClick={() => toggle(i.id)}>
              <Heart
                size={24}
                fill={isLiked ? "#ff3040" : "none"}
                color={isLiked ? "#ff3040" : "currentColor"}
              />
              {thCount(i.likes + (isLiked ? 1 : 0))}
            </button>

            <button aria-label="留言">
              <MessageCircle size={24} />
              {thCount(comments)}
            </button>

            <button aria-label="轉發">
              <Repeat2 size={24} />
              {thCount(Number(i.meta?.reposts ?? 0))}
            </button>

            <button aria-label="傳送">
              <Send size={23} />
              {thCount(Number(i.meta?.shares ?? 0))}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
})}

{!posts.length && <p className="thx-empty">還沒有串文</p>}

      </div>

      <nav className="thx-nav">
        <button aria-label="首頁" className="on">
          <House size={28} fill="currentColor" />
        </button>
        <button aria-label="訊息">
          <Send size={27} />
        </button>
        <button aria-label="發文" className="thx-plus">
          <Plus size={28} />
        </button>
        <button aria-label="活動">
          <Heart size={27} />
        </button>
        <button aria-label="個人">
          <ThAvatar name={handle} src={me} size={32} />
        </button>
      </nav>
    </div>
  );
}

export function FacebookSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "動態");
  const stories = items.filter((i) => i.folder === "Story");
  return (
    <div className="catalog-skin facebook-ui">
      <Header p={p} />
      <Tabs
        tabs={["動態", "好友", "個人主頁"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Users />, <User />]}
      />
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "動態" ? (
          <>
            <button
              className="fb-compose"
              disabled={!p.creator}
              onClick={p.onAdd}
            >
              <Avatar name={p.owner ?? "我"} />
              分享新動態
            </button>
            <div className="fb-stories">
              {stories.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <Media item={i} />
                  <strong>{i.sender}</strong>
                </button>
              ))}
            </div>
            {items
              .filter((i) => i.folder !== "Story")
              .map((i) => (
                <article className="fb-post" key={i.id}>
                  <PostHeader p={p} item={i} />
                  <button className="social-body" onClick={() => p.onItem(i)}>
                    <p>{i.body}</p>
                    {i.media && <Media item={i} />}
                  </button>
                  <Actions p={p} item={i} />
                </article>
              ))}
          </>
        ) : tab === "好友" ? (
          <div className="fb-friends">
            {[...new Set(items.map((i) => i.sender))].map((s) => (
              <button
                key={s}
                onClick={() => p.onItem(items.find((i) => i.sender === s)!)}
              >
                <Avatar name={s} />
                <strong>{s}</strong>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="fb-cover" />
            <div className="fb-profile">
              <Avatar name={p.owner ?? "我"} />
              <h1>{p.owner ?? "我"}</h1>
            </div>
            {items
              .filter((i) => i.folder === "個人主頁")
              .map((i) => (
                <button
                  key={i.id}
                  className="fb-profile-note"
                  onClick={() => p.onItem(i)}
                >
                  {i.title}
                  <p>{i.body}</p>
                </button>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
export function RedbookSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "發現");
  const list =
    tab === "收藏"
      ? items.filter((i) => i.favorite)
      : tab === "關注"
        ? items.filter((i) => i.folder === "關注")
        : items;
  return (
    <div className="catalog-skin redbook-ui">
      <Header p={p} />
      <div className="redbook-top">
        {["關注", "發現", "收藏"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        <div className="redbook-masonry">
          {list.map((i) => (
            <button key={i.id} onClick={() => p.onItem(i)}>
              <Media item={i} />
              <strong>{i.title}</strong>
              <div>
                <Avatar name={i.sender} />
                <small>{i.sender}</small>
                <Heart size={12} />
                <small>{i.likes}</small>
              </div>
            </button>
          ))}
        </div>
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["發現", "收藏"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Bookmark />]}
      />
    </div>
  );
}
export function PinterestSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "發現");
  const [board, setBoard] = useState("");
  const list = board
    ? items.filter((i) => (i.folder || "未分类") === board)
    : items;
  return (
    <div className="catalog-skin pinterest-ui">
      <Header p={p} />
      <div className="catalog-scroll">
        {tab === "收藏板" && !board ? (
          <>
            <h1>收藏板</h1>
            <div className="pinterest-boards">
              {groupItems(items).map((g) => (
                <button key={g} onClick={() => setBoard(g)}>
                  <Media
                    item={items.find((i) => (i.folder || "未分類") === g)!}
                  />
                  <strong>{g}</strong>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <SearchBox value={q} set={setQ} />
            {board && (
              <button
                className="pinterest-board-title"
                onClick={() => setBoard("")}
              >
                {board} · 返回收藏庫
              </button>
            )}
            <div className="pinterest-pins">
              {list.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <Media item={i} />
                  <strong>{i.title}</strong>
                </button>
              ))}
            </div>
            <Empty items={list} />
          </>
        )}
      </div>
      <Tabs
        tabs={["發現", "收藏庫"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setBoard("");
        }}
        icons={[<Home />, <Grid />]}
      />
    </div>
  );
}
export function RedditSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
  const [sort, setSort] = useState("最新");
  const list = [...items].sort((a, b) =>
    sort === "熱門" ? b.likes - a.likes : b.time.localeCompare(a.time),
  );
  return (
    <div className="catalog-skin reddit-ui">
      <Header p={p} />
      <div className="reddit-community">
        <Hash size={21} />
        <button onClick={() => setTab(tab === "首頁" ? "社區" : "首頁")}>
          {tab} ⌄
        </button>
        <select
          aria-label="貼文排序"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>最新</option>
          <option>熱門</option>
        </select>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "社區"
          ? groupItems(items).map((g) => (
              <button
                className="reddit-sub"
                key={g}
                onClick={() => {
                  setQ(g === "未分類" ? "" : g);
                  setTab("首頁");
                }}
              >
                <Hash size={22} />
                {g}
                <small>
                  {items.filter((i) => (i.folder || "未分類") === g).length} 帖
                </small>
              </button>
            ))
          : list.map((i) => <RedditPost key={i.id} p={p} item={i} />)}
        <Empty items={items} />
      </div>
      <Tabs
        tabs={["首頁", "社區"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Users />]}
      />
    </div>
  );
}
function RedditPost({ p, item: i }: { p: Props; item: Item }) {
  const [vote, setVote] = useSkinState<number>(p, `vote-${i.id}`, 0);
  return (
    <article className="reddit-post">
      <button className="reddit-byline" onClick={() => p.onItem(i)}>
        r/{meta(i, "community", i.folder || "story")} · u/{i.sender}
      </button>
      <button className="social-body" onClick={() => p.onItem(i)}>
        <h3>{i.title}</h3>
        <p>{i.body}</p>
        {i.media && <Media item={i} />}
      </button>
      <div className="reddit-actions">
        <button
          aria-label={`贊同${i.title}`}
          onClick={() => setVote(vote === 1 ? 0 : 1)}
        >
          <ArrowUp size={17} />
        </button>
        <span>{Number(meta(i, "votes", String(i.likes))) + vote}</span>
        <button
          aria-label={`反對${i.title}`}
          onClick={() => setVote(vote === -1 ? 0 : -1)}
        >
          <ArrowDown size={17} />
        </button>
        <button onClick={() => p.onItem(i)}>
          <MessageCircle size={16} />
          {i.comments.length} 評論
        </button>
      </div>
    </article>
  );
}
export function ForumSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "貼文");
  const [board, setBoard] = useState("");
  const list = board
    ? items.filter((i) => (i.folder || "未分類") === board)
    : items;
  return (
    <div className="catalog-skin forum-ui">
      <Header p={p} />
      <div className="forum-banner">
        <Hash size={27} />
        <strong>{board || "論壇"}</strong>
        <span>{items.length} 個主題</span>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "板塊"
          ? groupItems(items).map((g) => (
              <button
                className="forum-board"
                key={g}
                onClick={() => {
                  setBoard(g);
                  setTab("貼文");
                }}
              >
                <FolderIcon />
                <div>
                  <strong>{g}</strong>
                  <small>
                    {items.filter((i) => (i.folder || "未分類") === g).length}{" "}
                    個主題
                  </small>
                </div>
                <ChevronRight size={16} />
              </button>
            ))
          : list.map((i) => (
              <button
                className="forum-topic"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <strong>
                  {meta(i, "status") && <em>{meta(i, "status")}</em>}
                  {i.title}
                </strong>
                <p>{i.body.split("\n")[0]}</p>
                <div>
                  <span>
                    {i.sender} · {i.time.slice(5, 16)}
                  </span>
                  <span>
                    {meta(i, "views", "—")} 浏览 · {i.comments.length} 回覆
                  </span>
                </div>
              </button>
            ))}
      </div>
      <Tabs
        tabs={["貼文", "板塊"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setBoard("");
        }}
        icons={[<MessageCircle />, <Grid />]}
      />
    </div>
  );
}
function FolderIcon() {
  return <Hash size={27} />;
}
export function SnapchatSkin(p: Props) {
  const { tab, setTab, items } = useContent(p, "限動");
  const [index, setIndex] = useState(0);
  const list = items.filter((i) =>
    tab === "回憶"
      ? i.favorite || i.folder === "回憶"
      : tab === "聊天"
        ? i.folder === "聊天"
        : i.folder !== "聊天",
  );
  const i = list[index % Math.max(list.length, 1)];
  return (
    <div className="catalog-skin snapchat-ui">
      <Header p={p} />
      <div className="snap-content">
        {tab === "聊天" ? (
          <div className="snap-chats">
            {list.map((x) => (
              <button key={x.id} onClick={() => p.onItem(x)}>
                <Avatar name={x.sender} />
                <div>
                  <strong>{x.sender}</strong>
                  <small>{x.body}</small>
                </div>
                <Camera size={20} />
              </button>
            ))}
          </div>
        ) : i ? (
          <>
            <Media item={i} />
            <button className="snap-author" onClick={() => p.onItem(i)}>
              <Avatar name={i.sender} />
              {i.sender}
            </button>
            <button
              className="snap-next"
              aria-label="下一條限動"
              onClick={() => {
                setIndex((n) => n + 1);
                p.onRead(i.id);
              }}
            >
              <ChevronRight size={25} />
            </button>
            <button className="snap-caption" onClick={() => p.onItem(i)}>
              {i.body}
            </button>
          </>
        ) : (
          <p className="catalog-empty">暫無{tab}</p>
        )}
      </div>
      <Tabs
        tabs={["聊天", "限動", "回憶"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setIndex(0);
        }}
        icons={[<MessageCircle />, <Camera />, <ImageIcon />]}
      />
    </div>
  );
}
function ImageIcon() {
  return <Grid />;
}
