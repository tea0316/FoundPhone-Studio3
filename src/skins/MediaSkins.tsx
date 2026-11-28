import { AudioPlayer } from "../audio";
import { useSkinState } from "../skinState";
import { useVolume } from "../volume";
import {
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  Heart,
  Bell,
  Home,
  MessageCircle,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Search,
  House, 
  Clapperboard, 
  CirclePlus, 
  CircleUserRound, 
  Shuffle,
  SkipBack,
  SkipForward,
  ChevronLeft,
  Library,
  User,
  Forward,
  Users,
  Video,
} from "lucide-react";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { safeMedia, type Item } from "../schema";
import {
  chooseTrack,
  coverUrl,
  fmtTime,
  playerNext,
  playerPrev,
  playerRepeat,
  playerSeek,
  playerShuffle,
  playerToggle,
  usePlayer,
} from "../player";
import {
  Add,   
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

function TrackPlayer({
  p,
  items,
  onOpen,
}: {
  p: Props;
  items: Item[];
  onOpen?: () => void;
}) {
  const { item } = usePlayer();
  if (!item || !items.some((i) => i.id === item.id)) return null;
  return (
    <div className="track-player">
      <button onClick={() => (onOpen ? onOpen() : p.onItem(item))}>
        {coverUrl(item.avatar) ? (
          <Avatar name={item.title} src={item.avatar} round={false} />
        ) : (
          <Music size={20} />
        )}
        <span>
          {item.title}
          <small>{item.sender}</small>
        </span>
      </button>
      <AudioPlayer />
      <button aria-label="下一首" onClick={playerNext}>
        <SkipForward size={19} />
      </button>
    </div>
  );
}

export function NowPlaying({ p, close }: { p: Props; close: () => void }) {
  const { item, queue, playing, pos, dur, shuffle, repeat } = usePlayer();
  const [liked, setLiked] = useSkinState<string[]>(p, "likes", []);
  const [isPopped, setIsPopped] = useState(false);
  if (!item) return null;
  const isLiked = liked.includes(item.id);
  const cover = coverUrl(item.avatar);
  return (
    <div className="np-page">
      <div className="np-top">
        <button aria-label="收起播放頁" onClick={close}>
          <ChevronDown size={26} />
        </button>
        <div>
          <small>正在播放</small>
          <strong>{item.folder || meta(item, "album", "我的音樂")}</strong>
        </div>
        <span />
      </div>
      <div className="np-cover">
        {cover ? <img src={cover} alt="" /> : <Music size={80} />}
      </div>
      <div className="np-info">
        <div>
          <strong>{item.title}</strong>
          <small>{item.sender}</small>
        </div>
        <button
          aria-label={isLiked ? "取消喜歡" : "喜歡"}
          onClick={() =>
            setLiked(
              isLiked ? liked.filter((x) => x !== item.id) : [...liked, item.id],
            )
          }
          style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {item.id === "spotify-rec-7" ? (
            <img
              src="/giraffe.png"
              alt="長頸鹿"
              onClick={(e) => {
                e.stopPropagation();
                setIsPopped(true);
                setTimeout(() => {
                  setIsPopped(false);
                }, 2000);
              }}
              style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
                transform: isPopped ? "scale(1.5)" : "scale(1)",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                cursor: "pointer",
              }}
            />
          ) : (
            <Heart
              size={24}
              fill={isLiked ? "#1ed760" : "none"}
              color={isLiked ? "#1ed760" : "#fff"}
            />
          )}
        </button>
      </div>
      <div className="np-progress">
        <input
          className="np-seek"
          type="range"
          aria-label="播放進度"
          min={0}
          max={dur || 0}
          step={0.1}
          value={pos}
          style={{ "--pct": dur ? (pos / dur) * 100 + "%" : "0%" } as CSSProperties}
          onChange={(e) => playerSeek(Number(e.target.value))}
        />
        <div>
          <span>{fmtTime(pos)}</span>
          <span>{fmtTime(dur)}</span>
        </div>
      </div>
      <div className="np-controls">
        <button
          className={shuffle ? "on" : ""}
          aria-label="隨機播放"
          aria-pressed={shuffle}
          onClick={playerShuffle}
        >
          <Shuffle size={22} />
        </button>
        <button aria-label="上一首" onClick={playerPrev}>
          <SkipBack size={30} fill="currentColor" />
        </button>
        <button
          className="np-play"
          aria-label={playing ? "暫停" : "播放"}
          onClick={playerToggle}
        >
          {playing ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" />
          )}
        </button>
        <button aria-label="下一首" onClick={playerNext}>
          <SkipForward size={30} fill="currentColor" />
        </button>
        <button
          className={repeat !== "off" ? "on" : ""}
          aria-label="重複播放"
          onClick={playerRepeat}
        >
          {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
        </button>
      </div>
      <div className="np-queue">
        <h4>播放清單</h4>
        {queue.map((q) => (
          <button
            key={q.id}
            className={q.id === item.id ? "on" : ""}
            onClick={() => chooseTrack(p, q, queue)}
          >
            <Avatar name={q.title} src={q.avatar} round={false} />
            <span>
              <b>{q.title}</b>
              <small>
                {q.sender}
                {meta(q, "duration", "") ? " · " + meta(q, "duration", "") : ""}
              </small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const spFolder = (i: Item) => i.folder || "我的音樂";

function SpCover({ name, src }: { name: string; src?: string }) {
  return (
    <span className="sp-cover">
      {src ? (
        <Avatar name={name} src={src} round={false} />
      ) : (
        <span className="catalog-avatar">
          <Music size={22} />
        </span>
      )}
    </span>
  );
}

function SpSong({
  p,
  item,
  queue,
  current,
}: {
  p: Props;
  item: Item;
  queue: Item[];
  current?: string;
}) {
  const album = meta(item, "album", "");
  return (
    <button
      className={"sp-song" + (current === item.id ? " playing" : "")}
      onClick={() => chooseTrack(p, item, queue)}
    >
      <SpCover name={item.title} src={item.avatar} />
      <div>
        <strong>{item.title}</strong>
        <small>
          {item.sender}
          {album ? " · " + album : ""}
        </small>
      </div>
      <small>{meta(item, "duration", "")}</small>
    </button>
  );
}

export function SpotifySkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
  const [playlist, setPlaylist] = useState("");
  const [full, setFull] = useState(false);
  const { item: current, playing } = usePlayer();
  const RECO = "為你推薦";
  const recommended = items.filter((i) => i.folder === RECO);
  const library = items.filter((i) => i.folder !== RECO);
  const podcasts = items.filter((i) => i.folder === "Podcast");


  const groups = groupItems(library, "我的音樂");
  const inPlaylist = (g: string) => library.filter((i) => spFolder(i) === g);
  const coverOf = (g: string) => inPlaylist(g).find((i) => i.avatar)?.avatar;
   // 用一個狀態來記錄點擊過的歌(最多3首)
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (current?.id && items.some((i) => i.id === current.id)) {
      setRecentIds((prev) => {
        // 1. 先過濾掉已經存在的這首歌(不管它在哪)
        const filtered = prev.filter((id) => id !== current.id);
        // 2. 把新點的歌塞到陣列最後面
        return [...filtered, current.id].slice(-3); // 3. 只保留最後 3 筆
      });
    }
  }, [current?.id]);
    // 進入 Spotify 時，如果正在播的不是 Spotify 的歌，就暫停
  useEffect(() => {
    if (playing && current && !items.some((i) => i.id === current.id)) {
      playerToggle();
    }
  }, []);

  // 把 ID 轉換成實際的歌曲資料
  const recent = recentIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is Item => i !== undefined); // 過濾掉找不到的


    return (
    <div className="catalog-skin spotify-ui">
      <Header p={p} />
      <div className="catalog-scroll">
        
        {/* 頂部:頭像 + 膠囊切換按鈕 */}
        <div className="sp-greet">
          <Avatar name={p.owner ?? "我"} />
          <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
            <button
              className={tab === "首頁" ? "selected" : ""}
              onClick={() => { setTab("首頁"); setPlaylist(""); }}
            >
              首頁
            </button>
            <button
              className={tab === "音樂庫" ? "selected" : ""}
              onClick={() => { setTab("音樂庫"); setPlaylist(""); }}
            >
              音樂庫
            </button>
          </div>
        </div>

        {tab === "首頁" && (
          <>
            {recent.length > 0 && (
            <section>
              <h3 className="sp-section">近期播放</h3>
              <div className="sp-shelf">
                {recent.map((i) => ( 
                  <button key={i.id} onClick={() => chooseTrack(p, i, items)}>
                    <SpCover name={i.title} src={i.avatar} />
                    <strong>{i.title}</strong>
                    <small>{i.sender}</small>
                  </button>
                ))}
              </div>
            </section>
            )}

            {/* 👇 Podcast 專區移到這裡 👇 */}
            {podcasts.length > 0 && (
              <section>
                <h3 className="sp-section">Podcast</h3>
                {podcasts.map((i) => (
                  <SpSong
                    key={i.id}
                    p={p}
                    item={i}
                    queue={podcasts}
                    current={current?.id}
                  />
                ))}
              </section>
            )}

            {/* 👇 為你推薦在下面 👇 */}
            <section>
              <h3 className="sp-section">為你推薦</h3>
              {recommended.length > 0 ? (
                recommended.map((i) => (
                  <SpSong
                    key={i.id}
                    p={p}
                    item={i}
                    queue={recommended}
                    current={current?.id}
                  />
                ))
              ) : (
                <div className="sp-empty-reco">
                  目前沒有推薦歌曲
                </div>
              )}
            </section>

            <Empty items={items} />
          </>
        )}

        {tab === "搜尋" && (
          <>
            <h1>搜尋</h1>
            <SearchBox value={q} set={setQ} placeholder="想聽什麼?" />
            {items.map((i) => (
              <SpSong
                key={i.id}
                p={p}
                item={i}
                queue={items}
                current={current?.id}
              />
            ))}
            <Empty items={items} />
          </>
        )}

        {tab === "音樂庫" && !playlist && (
          <>
            <div className="sp-library">
              {groups.map((g) => (
                <button key={g} onClick={() => setPlaylist(g)}>
                  <SpCover name={g} src={coverOf(g)} />
                  <div>
                    <strong>{g}</strong>
                    <small>播放清單 · {inPlaylist(g).length} 首歌曲</small>
                  </div>
                </button>
              ))}
            </div>
            <Empty items={items} />
          </>
        )}

        {tab === "音樂庫" && playlist && (
          <>
            <button className="playlist-back" onClick={() => setPlaylist("")}>
              <ChevronLeft size={18} />
              音樂庫
            </button>
            <div className="sp-playlist-head">
              <SpCover name={playlist} src={coverOf(playlist)} />
              <h1>{playlist}</h1>
              <small>{inPlaylist(playlist).length} 首歌曲</small>
            </div>
            {inPlaylist(playlist).map((i) => (
              <SpSong
                key={i.id}
                p={p}
                item={i}
                queue={inPlaylist(playlist)}
                current={current?.id}
              />
            ))}
          </>
        )}

        {tab === "建立" && (
          <div className="sp-create">
            <h1>建立</h1>
            <button>
              <span className="catalog-avatar">
                <Music size={22} />
              </span>
              <div>
                <strong>播放清單</strong>
                <small>使用歌曲建立播放清單</small>
              </div>
            </button>
            <button>
              <span className="catalog-avatar">
                <Users size={22} />
              </span>
              <div>
                <strong>合輯</strong>
                <small>和朋友一起建立播放清單</small>
              </div>
            </button>
            <Add p={p} label="新增歌曲" />
          </div>
        )}
      </div>
      <TrackPlayer p={p} items={items} onOpen={() => setFull(true)} />
      {full && <NowPlaying p={p} close={() => setFull(false)} />}
      <Tabs
        tabs={["首頁", "搜尋", "音樂庫", "建立"]}
        value={tab}
        set={(t) => {
          if (t === "搜尋" || t === "建立") return;
          setTab(t);
          setPlaylist("");
        }}
        icons={[<Home />, <Search />, <Library />, <Plus />]}
      />
    </div>
  );
  }

export function NeteaseSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "發現");
  const [folder, setFolder] = useState("");
  const list = folder
    ? items.filter((i) => (i.folder || "我的歌單") === folder)
    : items;
  return (
    <div className="catalog-skin netease-ui">
      <Header p={p} />
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {tab === "發現" ? (
          <>
            <div className="netease-feature">
              <Music size={44} />
              <h2>推薦歌單</h2>
            </div>
            <div className="netease-shelves">
              {groupItems(items, "我的歌單").map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setFolder(g);
                    setTab("我的");
                  }}
                >
                  <Music size={33} />
                  <strong>{g}</strong>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="netease-profile">
              <Avatar name={p.owner ?? "我"} />
              <h2>{p.owner ?? "我的音樂"}</h2>
            </div>
            <h3>{folder || "我的歌單"}</h3>
          </>
        )}
        {list.map((i, n) => (
          <div className="netease-track" key={i.id}>
            <button onClick={() => chooseTrack(p, i, items)}>
              <span>{n + 1}</span>
              <div>
                <strong>{i.title}</strong>
                <small>
                  {i.sender} · {meta(i, "album")}
                </small>
              </div>
            </button>
            <button
              aria-label={`歌曲詳情${i.title}`}
              onClick={() => p.onItem(i)}
            >
              <MessageCircle size={18} />
            </button>
          </div>
        ))}
        <Empty items={list} />
      </div>
       <TrackPlayer p={p} items={items} />
      <Tabs
        tabs={["發現", "我的"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setFolder("");
        }}
        icons={[<Compass />, <Music />]}
      />
    </div>
  );
}


export function YouTubeSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
  const [category, setCategory] = useState("全部");
  const [isSearching, setIsSearching] = useState(false);
  const [activeShortIndex, setActiveShortIndex] = useState(0);

  const isShorts = tab === "Shorts";
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shortCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

// 同時篩選分頁（首頁 / Shorts）、分類與搜尋關鍵字
  const list = items.filter((i) => {
    const keyword = q.trim().toLowerCase();
    const matchQuery =
      !keyword ||
      i.title.toLowerCase().includes(keyword) ||
      i.sender.toLowerCase().includes(keyword);

    if (!matchQuery) return false;

    if (isShorts) {
      return i.folder === "Shorts";
    }

    // 首頁或其他分頁：排除 Shorts，並套用分類篩選
    if (i.folder === "Shorts") return false;
    if (category === "全部") return true;

    const rawCategories = meta(i, "categories", "");
    const extraCategories = Array.isArray(rawCategories)
      ? rawCategories
      : String(rawCategories)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    return i.folder === category || extraCategories.includes(category);
  });

  // 分類標籤
  const chips = ["全部", "UsagiNeko", "Vlog", "音樂", "紀錄片", ];

  // 共用點擊事件：有 youtubeId 開新分頁，否則走原本的 onItem
  const handleOpenItem = (i: any) => {
    const ytId = meta(i, "youtubeId", "");
    if (ytId) {
      window.open(`https://www.youtube.com/watch?v=${ytId}`, "_blank", "noopener,noreferrer");
    } else {
      p.onItem(i);
    }
  };

  // 離開 Shorts 或切換篩選時，暫停所有 Shorts 影片並回到頂端
  useEffect(() => {
    if (!isShorts) {
      Object.values(shortCardRefs.current).forEach((cardEl) => {
        const videoEl = cardEl?.querySelector("video") as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.pause();
        }
      });
      return;
    }

    setActiveShortIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [isShorts, q, category]);

  // 滑動到其他卡片時，把非目前 index 的影片暫停，避免音樂重疊
  useEffect(() => {
    if (!isShorts) return;

    list.forEach((item, idx) => {
      if (idx === activeShortIndex) return;
      const cardEl = shortCardRefs.current[String(item.id)];
      const videoEl = cardEl?.querySelector("video") as HTMLVideoElement | null;
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }
    });
  }, [isShorts, activeShortIndex, list]);

  // 監聽上下滑動，更新目前停在哪一支
  const handleShortsScroll = () => {
    if (!isShorts || !scrollRef.current) return;
    const { scrollTop, clientHeight } = scrollRef.current;
    if (clientHeight <= 0) return;
    const nextIdx = Math.round(scrollTop / clientHeight);
    const clampedIdx = Math.max(0, Math.min(list.length - 1, nextIdx));
    if (clampedIdx !== activeShortIndex) {
      setActiveShortIndex(clampedIdx);
    }
  };

  return (
    <div
      className="catalog-skin youtube-ui"
      style={{
        background: "#0f0f0f",
        color: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 頂部導覽列 — Shorts 模式隱藏 */}
      {!isShorts && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            minHeight: "52px",
            flexShrink: 0,
          }}
        >
          {isSearching ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
              <button
                onClick={() => {
                  setIsSearching(false);
                  setQ("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "16px",
                  padding: "0 4px",
                  cursor: "pointer",
                }}
              >
                ←
              </button>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜尋 YouTube"
                autoFocus
                style={{
                  flex: 1,
                  background: "#272727",
                  border: "none",
                  borderRadius: "18px",
                  padding: "6px 14px",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#aaa",
                    fontSize: "14px",
                    padding: "0 4px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <>
              <img
                src="/youtube-logo.png"
                alt="YouTube"
                style={{ height: "30px", width: "auto", display: "block" }}
              />

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <button
                  style={{ background: "none", border: "none", color: "#fff", padding: 0, cursor: "pointer" }}
                  onClick={() => {}}
                >
                  <Bell size={22} />
                </button>
                <button
                  style={{ background: "none", border: "none", color: "#fff", padding: 0, cursor: "pointer" }}
                  onClick={() => setIsSearching(true)}
                >
                  <Search size={22} />
                </button>
              </div>
            </>
          )}
        </header>
      )}

      {/* 分類標籤 (Chips) — Shorts 模式隱藏 */}
      {!isShorts && (
        <div
          className="youtube-chips"
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY;
          }}
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "0 10px 12px",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {chips.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={active ? "selected" : ""}
                style={{
                  flex: "1 0 auto",
                  textAlign: "center",
                  background: active ? "#fff" : "#272727",
                  color: active ? "#000" : "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* 影片列表與空狀態提示 */}
      <div
        ref={scrollRef}
        onScroll={handleShortsScroll}
        className="catalog-scroll youtube-videos"
        style={{
          flex: 1,
          overflowY: "auto",
          scrollSnapType: isShorts ? "y mandatory" : "none",
          paddingBottom: isShorts ? "0px" : "72px",
        }}
      >
        {list.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#717171",
              padding: "48px 16px",
              fontSize: "14px",
            }}
          >
            找不到相關影片
          </div>
        ) : isShorts ? (
          // 全螢幕上下滑動模式（Shorts）
          list.map((i) => (
            <div
              key={i.id}
              ref={(el) => {
                shortCardRefs.current[String(i.id)] = el;
              }}
              onClick={() => handleOpenItem(i)}
              style={{
                height: "100%",
                width: "100%",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                background: "#000",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <div
                className="shorts-media-frame"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                <Media item={i} />
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "36px 16px 76px",
                  background: "linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)",
                  zIndex: 10,
                }}
              >
                <strong style={{ display: "block", fontSize: "16px", color: "#fff", lineHeight: "1.4" }}>
                  {i.title}
                </strong>
                <p style={{ fontSize: "13px", color: "#ddd", marginTop: "6px", marginBottom: 0 }}>
                  @{i.sender}
                </p>
              </div>
            </div>
          ))
        ) : (
          // 一般首頁列表模式
          list.map((i) => (
            <article key={i.id} style={{ marginBottom: "20px" }}>
              {/* 縮圖區塊 */}
              <button
                className="youtube-thumb"
                onClick={() => handleOpenItem(i)}
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  padding: 0,
                  margin: 0,
                  border: "none",
                  background: "#222",
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <Media item={i} />
                {meta(i, "duration") && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      background: "rgba(0, 0, 0, 0.8)",
                      color: "#fff",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      zIndex: 2,
                    }}
                  >
                    {meta(i, "duration")}
                  </span>
                )}
              </button>

              {/* 標題與頻道資訊區（點擊同樣觸發 handleOpenItem） */}
              <div
                onClick={() => handleOpenItem(i)}
                style={{ padding: "12px 16px", cursor: "pointer" }}
              >
                {/* 影片標題（最多兩行截斷） */}
                <strong
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontSize: "16px",
                    fontWeight: "600",
                    lineHeight: "1.4",
                    color: "#fff",
                  }}
                >
                  {i.title}
                </strong>

                {/* 頻道頭像、頻道名稱、觀看數 */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                  <Avatar name={i.sender} src={meta(i, "avatar", "")} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                      minWidth: 0,
                      fontSize: "13px",
                    }}
                  >
                    <span
                      style={{
                        color: "#aaa",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "130px",
                      }}
                    >
                      @{i.sender}
                    </span>
                    <span style={{ color: "#717171", whiteSpace: "nowrap" }}>
                      {meta(i, "views", "0")}次觀看
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* 底部導覽列 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "#0f0f0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          borderTop: "1px solid #272727",
          zIndex: 10,
        }}
      >
        <button
          style={{
            color: tab === "首頁" ? "#fff" : "#717171",
            background: "none",
            border: "none",
            padding: "10px",
            cursor: "pointer",
          }}
          onClick={() => {
            setTab("首頁");
            setCategory("全部");
            setIsSearching(false);
            setQ("");
          }}
        >
          <House size={26} />
        </button>
        <button
          style={{
            color: tab === "Shorts" ? "#fff" : "#717171",
            background: "none",
            border: "none",
            padding: "10px",
            cursor: "pointer",
          }}
          onClick={() => {
            setTab("Shorts");
            setIsSearching(false);
            setQ("");
          }}
        >
          <Clapperboard size={26} />
        </button>
        <button
          style={{
            color: "#717171",
            background: "none",
            border: "none",
            padding: "10px",
            cursor: "pointer",
          }}
          onClick={() => {}}
        >
          <CirclePlus size={28} />
        </button>
        <button
          style={{
            color: "#717171",
            background: "none",
            border: "none",
            padding: "10px",
            cursor: "pointer",
          }}
          onClick={() => {}}
        >
          <CircleUserRound size={26} />
        </button>
      </div>
    </div>
  );
}
export function BilibiliSkin(p: Props) {
   const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
   const [category, setCategory] = useState("推薦");
   const list =
      tab === "歷史"
         ? items.filter((i) => i.folder === "歷史")
         : tab === "動態"
            ? items.filter((i) => i.folder === "動態")
            : category === "推薦"
               ? items
               : items.filter((i) => i.folder === category);
   return (
      <div className="catalog-skin bilibili-ui">
         <Header p={p} />
         <div className="bili-search">
            <Avatar name={p.owner ?? "我"} />
            <SearchBox value={q} set={setQ} />
         </div>
         <div className="bili-categories">
            {["推薦", "動畫", "音樂", "生活"].map((c) => (
               <button
                  key={c}
                  className={category === c ? "selected" : ""}
                  onClick={() => setCategory(c)}
               >
                  {c}
               </button>
            ))}
         </div>
         <div className="catalog-scroll">
            <div className="bili-grid">
               {list.map((i) => (
                  <button key={i.id} onClick={() => p.onItem(i)}>
                     <div>
                        <Media item={i} />
                        <small>
                           <Play size={10} />
                           {meta(i, "views", "—")}
                           <time>{meta(i, "duration")}</time>
                        </small>
                     </div>
                     <strong>{i.title}</strong>
                     <span>UP · {i.sender}</span>
                  </button>
               ))}
            </div>
            <Empty items={list} />
         </div>
         <Tabs
            tabs={["首頁", "動態", "歷史"]}
            value={tab}
            set={setTab}
            icons={[<Home />, <MessageCircle />, <User />]}
         />
      </div>
   );
}

function VerticalVideo({ p, item }: { p: Props; item: Item }) {
   const [liked, setLiked] = useSkinState<boolean>(p, `liked-${item.id}`, false),
      [saved, setSaved] = useSkinState<boolean>(p, `saved-${item.id}`, false);
   return (
      <article className="vertical-video">
         <Media item={item} />
         <div className="vertical-actions">
            <button
               aria-label={`作者${item.sender}`}
               onClick={() => p.onItem(item)}
            >
               <Avatar name={item.sender} />
            </button>
            <button
               aria-label={`喜歡${item.title}`}
               onClick={() => setLiked(!liked)}
            >
               <Heart size={29} fill={liked ? "#f44368" : "white"} />
               <small>{item.likes + (liked ? 1 : 0)}</small>
            </button>
            <button aria-label={`留言${item.title}`} onClick={() => p.onItem(item)}>
               <MessageCircle size={29} />
               <small>{item.comments.length}</small>
            </button>
            <button
               aria-label={`收藏${item.title}`}
               onClick={() => setSaved(!saved)}
            >
               <Bookmark size={27} fill={saved ? "#f8cc55" : "none"} />
            </button>
         </div>
         <button className="vertical-caption" onClick={() => p.onItem(item)}>
            <strong>@{item.sender}</strong>
            <p>{item.body}</p>
            <small>
               <Music size={11} />
               {item.title}
            </small>
         </button>
      </article>
   );
}

export function DouyinSkin(p: Props) {
   const { tab, setTab, items } = useContent(p, "推薦");
   const list = tab === "推薦" ? items : items.filter((i) => i.folder === tab);
   return (
      <div className="catalog-skin douyin-ui">
         <Header p={p} />
         <div className="douyin-top">
            {["同城", "關注", "推薦"].map((t) => (
               <button
                  className={tab === t ? "selected" : ""}
                  key={t}
                  onClick={() => setTab(t)}
               >
                  {t}
               </button>
            ))}
         </div>
         <div className="vertical-feed">
            {list.map((i) => (
               <VerticalVideo key={i.id} p={p} item={i} />
            ))}
            <Empty items={list} />
         </div>
         <Tabs
            tabs={["推薦", "關注", "我"]}
            value={tab}
            set={setTab}
            icons={[<Home />, <Users />, <User />]}
         />
      </div>
   );
}

const fmtCount = (n: number) =>
  n >= 10000 ? (n / 10000).toFixed(1) + "萬" : String(n);

function TikVideo({ p, item }: { p: Props; item: Item }) {
  const box = useRef<HTMLElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [vol] = useVolume();
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useSkinState<boolean>(p, `liked-${item.id}`, false);
  const [saved, setSaved] = useSkinState<boolean>(p, `saved-${item.id}`, false);
  const src = safeMedia(item.media);
  const isVideo = item.kind === "video" && !!src;

  useEffect(() => {
    if (ref.current) ref.current.volume = vol;
  }, [vol]);

  // 滑到這支影片超過 60% 才播放，滑走就暫停
  useEffect(() => {
    const v = ref.current,
      el = box.current;
    if (!v || !el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          v.currentTime = 0;
          v.play().catch(() => {
            v.muted = true;
            v.play().catch(() => {});
          });
          setPaused(false);
        } else {
          v.pause();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      v.pause();
    };
  }, [src]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <article className="tt-item" ref={box}>
      {isVideo ? (
        <video
          ref={ref}
          className="tt-video"
          src={src}
          loop
          playsInline
          preload="metadata"
          onClick={toggle}
        />
      ) : (
        <Media item={item} className="tt-video" />
      )}
      {paused && (
        <div className="tt-paused">
          <Play size={54} fill="currentColor" />
        </div>
      )}
      <div className="tt-actions">
<button className="tt-avatar" aria-label={`作者${item.sender}`}>
          <Avatar name={item.sender} />
          <i>
            <Plus size={11} strokeWidth={3} />
          </i>
        </button>
        <button aria-label="喜歡" onClick={() => setLiked(!liked)}>
          <Heart size={32} fill={liked ? "#fe2c55" : "white"} stroke="none" />
          <small>{fmtCount(item.likes + (liked ? 1 : 0))}</small>
        </button>
        <button aria-label="留言">
          <MessageCircle size={31} fill="white" stroke="none" />
          <small>{fmtCount(Number(item.meta.comments) || item.comments.length)}</small>
        </button>
        <button aria-label="收藏" onClick={() => setSaved(!saved)}>
          <Bookmark size={30} fill={saved ? "#ffc933" : "white"} stroke="none" />
          <small>{saved ? "已收藏" : "收藏"}</small>
        </button>
        <button aria-label="分享">
          <Forward size={30} fill="white" stroke="none" />
          <small>分享</small>
        </button>
      </div>
      <div className="tt-caption">
        <strong>@{item.sender}</strong>
        <p>{item.body}</p>
        <small>
          <Music size={12} />
          {item.title}
        </small>
      </div>
    </article>
  );
}

export function TikTokSkin(p: Props) {
  const { playing } = usePlayer();
  // 👇 進入 TikTok 時，如果正在播放音樂，就自動暫停
  useEffect(() => {
    if (playing) {
      playerToggle();
    }
  }, []);
  const { items } = useContent(p, "為你推薦");
  const [tab, setTab] = useState("追蹤中");
  const isFollowing = (i: Item) => i.folder === "關注" || i.folder === "Following";
  const list =
    tab === "為你推薦"
      ? items.filter((i) => !isFollowing(i))
      : items.filter(isFollowing);
  return (
    <div className="catalog-skin tiktok-ui tt">
      <div className="tt-top">
        {["追蹤中", "為你推薦"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="tt-feed" key={tab}>
        {list.map((i) => (
          <TikVideo key={i.id} p={p} item={i} />
        ))}
      </div>
      {list.length === 0 && (
  <div className="tt-empty">
    {tab === "追蹤中" ? "還沒有任何的內容" : "目前沒有影片"}
  </div>
)}
      <div className="tt-nav" style={{ pointerEvents: "auto" }}>
        <span className="on" role="button" style={{ cursor: "pointer" }}>首頁</span>
        <span role="button" style={{ cursor: "pointer" }}>朋友</span>
        <span className="tt-plus" role="button" style={{ cursor: "pointer" }}>
          <b />
        </span>
        <span role="button" style={{ cursor: "pointer" }}>信件匣</span>
        <span role="button" style={{ cursor: "pointer" }}>個人資料</span>
      </div>
    </div>
  );
}

export function NetflixSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
  const [saved, setSaved] = useSkinState<string[]>(p, "saved", []);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  
  const list =
    tab === "我的清單"
      ? items.filter((i) => i.favorite || saved.includes(i.id))
      : items;
      
  const featured = list[0];

  // 👇 點擊影片跳轉到 YouTube 的函式
  const playVideo = (item: any) => {
    // 這裡你可以把 youtubeId 換成該影片的預告片 ID
    const ytId = meta(item, "youtubeId", ""); 
    if (ytId) {
      window.open(`https://www.youtube.com/watch?v=${ytId}`, "_blank");
    } else {
      // 如果沒有設定 ID，就跳出提示或執行原本的 p.onItem
      alert("這部影片還沒有預告片連結喔！");
    }
  };

  return (
    <div className="catalog-skin netflix-ui">
      {/* 👇 自訂頂部導航列 */}
      <div className="catalog-nav" style={{ 
        position: "relative", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "12px 16px", 
        background: "#151515" 
      }}>
        {/* 返回鍵固定在左邊 */}
        <button 
          onClick={p.onBack} 
          style={{ 
            position: "absolute", 
            left: "16px", 
            background: "none", 
            border: "none", 
            color: "#d35050", 
            padding: 0 
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        
        {/* 中間的 Logo 圖片 */}
        <img 
          src="/netflix-logo.png" 
          alt="Netflix" 
          style={{ 
            height: "48px", 
            objectFit: "contain", 
            marginLeft: "18px" 
          }} 
        />
      </div>
      
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        
        {/* 首頁大圖 (Hero Banner) */}
        {featured && tab === "首頁" && (
          <div className="netflix-feature">
            {/* 👇 這裡永遠只顯示圖片，影片交給彈出視窗播放 */}
            <img 
              src={meta(featured, "banner") || coverUrl(featured.avatar) || ""} 
              alt={featured.title} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            
            <div>
              <strong>{featured.title}</strong>
              <small>
                {meta(featured, "year")} · {meta(featured, "genre")} · {meta(featured, "duration")}
              </small>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
                <button onClick={() => {
                  const videoUrl = meta(featured, "videoUrl", "");
                  if (videoUrl) {
                    setPlayingVideo(videoUrl);
                  } else {
                    playVideo(featured);
                  }
                }}>
                  <Play size={16} /> 播放
                </button>
                <button
                  onClick={() =>
                    setSaved(
                      saved.includes(featured.id)
                        ? saved.filter((id) => id !== featured.id)
                        : [...saved, featured.id],
                    )
                  }
                >
                  {saved.includes(featured.id) ? <Check size={16} /> : <Plus size={16} />}
                  我的片單
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 橫向滑動影片架 (Shelves) */}
        {groupItems(list, "影片").map((g) => (
          <section className="netflix-shelf" key={g}>
            <h3>{g}</h3>
            <div
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                padding: "0 13px",
              }}
            >
              {list
                .filter((i) => (i.folder || "影片") === g)
                .map((i) => (
                  <button key={i.id} onClick={() => playVideo(i)}>
                    <Media item={i} />
                    <strong>{i.title}</strong>
                  </button>
                ))}
            </div>
          </section>
        ))}

        <Empty items={list} />
      </div>

      <Tabs
        tabs={["首頁", "我的清單"]}
        value={tab}
        set={setTab}
        icons={[<Home />, <Bookmark />]}
      />

      {/* 👇 彈出式影片播放器 */}
      {playingVideo && (
        <div style={{
          position: "absolute", // 👈 改用 absolute 覆蓋整個 App
          inset: 0,
          zIndex: 100,
          background: "#000",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          {/* 關閉按鈕 */}
          <button 
            onClick={() => setPlayingVideo(null)}
            style={{ 
              position: "absolute", 
              top: "20px", 
              right: "20px", 
              color: "#fff", 
              background: "rgba(0,0,0,0.5)", 
              border: "none", 
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              fontSize: "20px", 
              cursor: "pointer", 
              zIndex: 101,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
          
          {/* 影片播放器 */}
          <video 
            src={playingVideo} 
            controls 
            autoPlay 
            style={{ 
              width: "100%", 
              height: "100%", // 👈 讓影片填滿整個容器
              objectFit: "contain" // 👈 保持比例，不會變形
            }} 
          />
        </div>
      )}
    </div>
  );
}
