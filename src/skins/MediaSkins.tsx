import { AudioPlayer } from "../audio";
import { useSkinState } from "../skinState";
import {
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  Heart,
  Home,
  MessageCircle,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  User,
  Users,
  Video,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { Item } from "../schema";
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

function TrackPlayer({ p, onOpen }: { p: Props; onOpen?: () => void }) {
  const { item } = usePlayer();
  if (!item) return null;
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

function NowPlaying({ p, close }: { p: Props; close: () => void }) {
  const { item, queue, playing, pos, dur, shuffle, repeat } = usePlayer();
  const [liked, setLiked] = useSkinState<string[]>(p, "likes", []);
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
        >
          <Heart
            size={24}
            fill={isLiked ? "#1ed760" : "none"}
            color={isLiked ? "#1ed760" : "#fff"}
          />
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

export function SpotifySkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
  const [playlist, setPlaylist] = useState("");
  const [full, setFull] = useState(false);
  const { item: current } = usePlayer();
  const list = playlist
    ? items.filter((i) => (i.folder || "我的音樂") === playlist)
    : items;
  return (
    <div className="catalog-skin spotify-ui">
      <Header p={p} />
      <div className="catalog-scroll">
        <div className="spotify-heading">
          <Avatar name={p.owner ?? "我"} />
          <button
            className={tab === "首頁" ? "selected" : ""}
            onClick={() => setTab("首頁")}
          >
            音樂
          </button>
          <button
            className={tab === "音樂庫" ? "selected" : ""}
            onClick={() => setTab("音樂庫")}
          >
            音樂庫
          </button>
        </div>
        {tab === "搜尋" && <SearchBox value={q} set={setQ} />}
        <h1>{playlist || (tab === "音樂庫" ? "音樂庫" : "為你收藏")}</h1>
        {!playlist && (
          <div className="spotify-playlists">
            {groupItems(items, "我的音樂").map((g) => (
              <button key={g} onClick={() => setPlaylist(g)}>
                <Music size={29} />
                <strong>{g}</strong>
              </button>
            ))}
          </div>
        )}
        {playlist && (
          <button className="playlist-back" onClick={() => setPlaylist("")}>
            返回全部音樂
          </button>
        )}
        <div className="spotify-tracks">
          {list.map((i, n) => (
            <button
              key={i.id}
              className={current?.id === i.id ? "playing" : ""}
              onClick={() => chooseTrack(p, i, items)}
            >
              <span>{n + 1}</span>
              <div>
                <strong>{i.title}</strong>
                <small>
                  {i.sender} · {meta(i, "album")}
                </small>
              </div>
              <small>{meta(i, "duration")}</small>
            </button>
          ))}
        </div>
        <Empty items={list} />
      </div>
      <TrackPlayer p={p} onOpen={() => setFull(true)} />
      {full && <NowPlaying p={p} close={() => setFull(false)} />}
      <Tabs
        tabs={["首頁", "搜尋", "音樂庫"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setPlaylist("");
        }}
        icons={[<Home />, <Search />, <Music />]}
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
      <TrackPlayer p={p} />
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
   const list = items.filter((i) =>
      tab === "Shorts"
         ? i.folder === "Shorts"
         : tab === "訂閱"
            ? i.folder === "訂閱"
            : tab === "播放清單"
               ? i.favorite || i.folder === "播放清單"
               : category === "全部" || i.folder === category,
   );
   return (
      <div className="catalog-skin youtube-ui">
         <Header p={p} />
         <SearchBox value={q} set={setQ} />
         <div className="youtube-chips">
            {["全部", ...groupItems(items).filter((g) => g !== "未分類")].map(
               (g) => (
                  <button
                     className={category === g ? "selected" : ""}
                     key={g}
                     onClick={() => setCategory(g)}
                  >
                     {g}
                  </button>
               ),
            )}
         </div>
         <div className="catalog-scroll">
            <div className={tab === "Shorts" ? "youtube-shorts" : "youtube-videos"}>
               {list.map((i) => (
                  <article key={i.id}>
                     <button className="youtube-thumb" onClick={() => p.onItem(i)}>
                        <Media item={i} />
                        {meta(i, "duration") && <time>{meta(i, "duration")}</time>}
                     </button>
                     <button className="youtube-byline" onClick={() => p.onItem(i)}>
                        <Avatar name={i.sender} />
                        <div>
                           <strong>{i.title}</strong>
                           <small>
                              {i.sender} · {meta(i, "views", "—")} 次觀看
                           </small>
                        </div>
                     </button>
                  </article>
               ))}
            </div>
            <Empty items={list} />
         </div>
         <Tabs
            tabs={["首頁", "Shorts", "訂閱", "播放清單"]}
            value={tab}
            set={setTab}
            icons={[<Home />, <Video />, <Users />, <User />]}
         />
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

export function TikTokSkin(p: Props) {
   const { tab, setTab, items } = useContent(p, "For You");
   const list =
      tab === "For You"
         ? items
         : tab === "Following"
            ? items.filter((i) => i.folder === "關注" || i.folder === "Following")
            : items.filter((i) => i.folder === "個人主頁");
   return (
      <div className="catalog-skin tiktok-ui">
         <Header p={p} />
         <div className="tiktok-top">
            <button
               className={tab === "Following" ? "selected" : ""}
               onClick={() => setTab("Following")}
            >
               Following
            </button>
            <button
               className={tab === "For You" ? "selected" : ""}
               onClick={() => setTab("For You")}
            >
               For You
            </button>
         </div>
         <div className="vertical-feed">
            {list.map((i) => (
               <VerticalVideo key={i.id} p={p} item={i} />
            ))}
            <Empty items={list} />
         </div>
         <Tabs
            tabs={["For You", "Following", "Profile"]}
            value={tab}
            set={setTab}
            icons={[<Home />, <Users />, <User />]}
         />
      </div>
   );
}

export function NetflixSkin(p: Props) {
   const { tab, setTab, q, setQ, items } = useContent(p, "首頁");
   const [saved, setSaved] = useSkinState<string[]>(p, "saved", []);
   const list =
      tab === "我的清單"
         ? items.filter((i) => i.favorite || saved.includes(i.id))
         : items;
   const featured = list[0];
   return (
      <div className="catalog-skin netflix-ui">
         <Header p={p} />
         <div className="catalog-scroll">
            <SearchBox value={q} set={setQ} />
            {featured && tab === "首頁" && (
               <div className="netflix-feature">
                  <Media item={featured} />
                  <div>
                     <strong>{featured.title}</strong>
                     <small>
                        {meta(featured, "year")} · {meta(featured, "genre")} ·{" "}
                        {meta(featured, "duration")}
                     </small>
                     <button onClick={() => p.onItem(featured)}>
                        <Play size={16} />
                        播放 / 詳情
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
                        {saved.includes(featured.id) ? (
                           <Check size={16} />
                        ) : (
                           <Plus size={16} />
                        )}
                        我的清單
                     </button>
                  </div>
               </div>
            )}
            {groupItems(list, "影片").map((g) => (
               <section className="netflix-shelf" key={g}>
                  <h3>{g}</h3>
                  <div>
                     {list
                        .filter((i) => (i.folder || "影片") === g)
                        .map((i) => (
                           <button key={i.id} onClick={() => p.onItem(i)}>
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
      </div>
   );
}