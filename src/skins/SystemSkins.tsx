export { WeatherSkin, HealthSkin } from "./CalibratedSystemApps";
import {
  chooseTrack,
  coverUrl,
  playerNext,
  playerPrev,
  playerSeek,
  playerToggle,
  usePlayer,
} from "../player";
import { useSkinState } from "../skinState";
import {
    Calendar,
    Camera,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileText,
    Folder,
    Globe,
    Grid,
    Heart,
    Image,
    LockKeyhole,
    MapPin,
    Music,
    Phone,
    Search,
    SkipForward,
    Star,
    Users,
    Wallet,
    Pause,    
    Play,     
    Radio,
    ChevronDown,
    SkipBack,    
    Shuffle,  
} from "lucide-react";
import { useEffect, useState } from "react";
import { download } from "../io";
import type { Item } from "../schema";
import {
    Add,
    Avatar,
    Empty,
    groupItems,
    Header,
    Media,
    meta,
    Row,
    SearchBox,
    Tabs,
    useContent,
    type Props,
} from "./shared";
export function PhoneSkin(p: Props) {
    const { tab, setTab, q, setQ, items } = useContent(p, "最近通話");
    const [digits, setDigits] = useState(""),
        [call, setCall] = useState("");
    const list = tab === "收藏" ? items.filter((i) => i.favorite) : items;
    return (
        <div className="catalog-skin native-phone">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>{tab}</h1>
                {tab === "鍵盤" ? (
                    <div className="dialer">
                        <output>{digits || "輸入號碼"}</output>
                        <div>
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                                (k) => (
                                    <button key={k} onClick={() => setDigits((s) => s + k)}>
                                        {k}
                                        <small>
                                            {
                                                (
                                                    {
                                                        "2": "ABC",
                                                        "3": "DEF",
                                                        "4": "GHI",
                                                        "5": "JKL",
                                                        "6": "MNO",
                                                        "7": "PQRS",
                                                        "8": "TUV",
                                                        "9": "WXYZ",
                                                    } as Record<string, string>
                                                )[k]
                                            }
                                        </small>
                                    </button>
                                ),
                            )}
                        </div>
                        <button
                            className="dial-call"
                            disabled={!digits}
                            aria-label="撥號"
                            onClick={() => {
                                setCall(digits);
                                const i = items.find((i) => meta(i, "number") === digits);
                                if (i) p.onRead(i.id);
                            }}
                        >
                            <Phone size={24} />
                        </button>
                        <button onClick={() => setDigits((s) => s.slice(0, -1))}>
                            刪除
                        </button>
                    </div>
                ) : (
                    <>
                        <SearchBox value={q} set={setQ} />
                        {list.map((i) => (
                            <button
                                className={`call-row ${meta(i, "status") === "未接" ? "missed" : ""}`}
                                key={i.id}
                                onClick={() => p.onItem(i)}
                            >
                                <Phone size={17} />
                                <span>
                                    <strong>{i.title}</strong>
                                    <small>
                                        {meta(i, "number", i.sender)} ·{" "}
                                        {meta(i, "status", "通話紀錄")}
                                    </small>
                                </span>
                                <time>{i.time.slice(5, 10)}</time>
                            </button>
                        ))}
                        <Empty items={list} />
                    </>
                )}
            </div>
            <Tabs
                tabs={["收藏", "最近通話", "聯絡人", "鍵盤"]}
                value={tab}
                set={setTab}
                icons={[<Star />, <Clock />, <Users />, <Grid />]}
            />
            {call && (
                <div className="virtual-call">
                    <small>虛擬通話</small>
                    <Avatar name={call} />
                    <h2>{call}</h2>
                    <p>這是作品內的通話模擬</p>
                    <button aria-label="掛斷" onClick={() => setCall("")}>
                        <Phone />
                    </button>
                </div>
            )}
        </div>
    );
}
export function ContactsSkin(p: Props) {
    const { q, setQ, items } = useContent(p, "所有聯絡人");
    return (
        <div className="catalog-skin native-contacts">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>聯絡人</h1>
                <SearchBox value={q} set={setQ} />
                <button
                    className="contact-self"
                    onClick={() => {
                        if (items[0]) p.onItem(items[0]);
                        else if (p.creator) p.onAdd();
                    }}
                >
                    <Avatar name={p.owner ?? "我"} />
                    <span>
                        <strong>{p.owner ?? "我的資料"}</strong>
                        <small>我的資料</small>
                    </span>
                </button>
                {groupItems(items, "所有聯絡人").map((g) => (
                    <section key={g}>
                        <h4 className="native-section">{g}</h4>
                        {items
                            .filter((i) => (i.folder || "所有聯絡人") === g)
                            .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"))
                            .map((i) => (
                                <Row
                                    key={i.id}
                                    item={i}
                                    onItem={p.onItem}
                                    leading={<Avatar name={i.title} />}
                                />
                            ))}
                    </section>
                ))}
                <Empty items={items} />
            </div>
        </div>
    );
}
export function PhotosSkin(p: Props) {
    const { tab, setTab, q, setQ, items } = useContent(p, "相片");
    const [album, setAlbum] = useState("");
    const list =
        tab === "收藏"
            ? items.filter((i) => i.favorite)
            : album
                ? items.filter((i) => (i.folder || "未分類") === album)
                : items;
    return (
        <div className="catalog-skin native-photos">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>{album || tab}</h1>
                {tab === "相簿" && !album ? (
                    <div className="album-grid">
                        {groupItems(items, "未分類").map((g) => (
                            <button key={g} onClick={() => setAlbum(g)}>
                                <Media
                                    item={items.find((i) => (i.folder || "未分類") === g)!}
                                />
                                <strong>{g}</strong>
                                <small>
                                    {items.filter((i) => (i.folder || "未分類") === g).length} 項
                                </small>
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        <SearchBox value={q} set={setQ} />
                        <div className="photo-mosaic">
                            {list.map((i) => (
                                <button
                                    aria-label={`查看${i.title}`}
                                    key={i.id}
                                    onClick={() => p.onItem(i)}
                                >
                                    <Media item={i} />
                                    {i.favorite && <Heart size={12} fill="white" />}
                                </button>
                            ))}
                        </div>
                        <p className="media-count">{list.length} 个项目</p>
                    </>
                )}
                <Empty items={list} />
            </div>
            <Tabs
                tabs={["相片", "相簿", "收藏"]}
                value={tab}
                set={(t) => {
                    setTab(t);
                    setAlbum("");
                }}
                icons={[<Image />, <Folder />, <Heart />]}
            />
        </div>
    );
}
export function CameraSkin(p: Props) {
    const [mode, setMode] = useState("照片"),
        [index, setIndex] = useState(0);
    const frames = p.items.filter((i) =>
        mode === "影片" ? i.kind === "video" : i.kind !== "video",
    );
    const frame = frames[index % Math.max(frames.length, 1)];
    return (
        <div className="catalog-skin native-camera">
            <Header p={p} />
            <div className="camera-top">
                <span>閃光燈關閉</span>
                <span>{mode === "影片" ? "HD · 30" : "4:3"}</span>
            </div>
            <div className="camera-view">
                {frame ? <Media item={frame} /> : <p>未設置取景畫面</p>}
                <div className="camera-grid" />
            </div>
            <div className="camera-mode">
                {["影片", "照片"].map((m) => (
                    <button
                        className={mode === m ? "selected" : ""}
                        key={m}
                        onClick={() => {
                            setMode(m);
                            setIndex(0);
                        }}
                    >
                        {m}
                    </button>
                ))}
            </div>
            <div className="camera-controls">
                <button
                    aria-label="查看上一畫面"
                    disabled={!frames.length}
                    onClick={() => setIndex((i) => (i + 1) % frames.length)}
                >
                    <Image size={24} />
                </button>
                <button
                    className="camera-shutter"
                    aria-label={p.creator ? "編輯拍攝內容" : "查看拍攝內容"}
                    disabled={!p.creator && !frame}
                    onClick={() => (p.creator ? p.onAdd() : frame && p.onItem(frame))}
                >
                    <span />
                </button>
                <button
                    aria-label="切換取景畫面"
                    disabled={frames.length < 2}
                    onClick={() => setIndex((i) => i + 1)}
                >
                    <Camera size={24} />
                </button>
            </div>
            <small className="camera-caption">作者设置的虛構取景內容</small>
        </div>
    );
}
export function SafariSkin(p: Props) {
    const [q, setQ] = useState(""),
        [tab, setTab] = useState("書籤");
    const items = p.items
        .filter((i) =>
            (i.title + i.body + meta(i, "url"))
                .toLowerCase()
                .includes(q.toLowerCase()),
        )
        .filter((i) =>
            tab === "书签"
                ? i.favorite || i.folder !== "歷史紀錄"
                : i.folder === "歷史紀錄",
        );
    return (
        <div className="catalog-skin native-safari">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>{tab}</h1>
                <div className="safari-favorites">
                    {items.map((i) => (
                        <button key={i.id} onClick={() => p.onItem(i)}>
                            <span>
                                <Globe size={28} />
                            </span>
                            <strong>{i.title}</strong>
                            <small>{meta(i, "url")}</small>
                        </button>
                    ))}
                </div>
                <Empty items={items} label="沒有匹配的虛構網頁" />
            </div>
            <label className="safari-address">
                <LockKeyhole size={13} />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="搜尋或輸入虛構的網址"
                    aria-label="地址欄"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && items[0]) p.onItem(items[0]);
                    }}
                />
                <Search size={16} />
            </label>
            <Tabs
                tabs={["書籤", "歷史紀錄"]}
                value={tab}
                set={setTab}
                icons={[<Globe />, <Clock />]}
            />
        </div>
    );
}
export function NotesSkin(p: Props) {
    const { q, setQ, items } = useContent(p, "備忘錄");
    const [folder, setFolder] = useState<string | null>(null);
    const list = folder
        ? items.filter((i) => (i.folder || "備忘錄") === folder)
        : items;
    return (
        <div className="catalog-skin native-notes">
            <Header p={p} />
            <div className="catalog-scroll">
                <button className="notes-back" onClick={() => setFolder(null)}>
                    <Folder size={17} />
                    文件夹
                </button>
                <h1>{folder || "所有備忘錄"}</h1>
                <SearchBox value={q} set={setQ} />
                {!folder && (
                    <div className="note-folders">
                        {groupItems(items, "備忘錄").map((g) => (
                            <button key={g} onClick={() => setFolder(g)}>
                                <Folder size={17} />
                                {g}
                                <small>
                                    {items.filter((i) => (i.folder || "備忘錄") === g).length}
                                </small>
                            </button>
                        ))}
                    </div>
                )}
                <div className="notes-list">
                    {list.map((i) => (
                        <button key={i.id} onClick={() => p.onItem(i)}>
                            <strong>
                                {i.password && <LockKeyhole size={12} />} {i.title}
                            </strong>
                            <p>
                                <time>{i.time.slice(5, 10)}</time>{" "}
                                {i.password ? "已鎖定的備忘錄" : i.body.split("\n")[0]}
                            </p>
                            <small>{i.folder}</small>
                        </button>
                    ))}
                </div>
                <Empty items={list} />
            </div>
            <div className="notes-footer">
                <span>{list.length} 則備忘錄</span>
                <Add p={p} label="新建備忘錄" />
            </div>
        </div>
    );
}
export function CalendarSkin(p: Props) {
    const [month, setMonth] = useState(8),
        [year, setYear] = useState(2026),
        [day, setDay] = useState(1);
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const list = p.items.filter((i) =>
        i.time.startsWith(`${prefix}-${String(day).padStart(2, "0")}`),
    );
    const move = (d: number) => {
        const date = new Date(Date.UTC(year, month + d, 1));
        setYear(date.getUTCFullYear());
        setMonth(date.getUTCMonth());
        setDay(1);
    };
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay(),
        days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return (
        <div className="catalog-skin native-calendar">
            <Header p={p} />
            <div className="catalog-scroll">
                <div className="month-title">
                    <button aria-label="上個月" onClick={() => move(-1)}>
                        <ChevronLeft />
                    </button>
                    <h2>
                        {year} 年 {month + 1} 月
                    </h2>
                    <button aria-label="下个月" onClick={() => move(1)}>
                        <ChevronRight />
                    </button>
                </div>
                <div className="calendar-grid">
                    {["日", "月", "火", "水", "木", "金", "土"].map((t) => (
                        <small key={t}>{t}</small>
                    ))}
                    {Array.from({ length: first }, (_, i) => (
                        <span key={"blank" + i} />
                    ))}
                    {Array.from({ length: days }, (_, i) => (
                        <button
                            className={day === i + 1 ? "selected" : ""}
                            key={i}
                            onClick={() => setDay(i + 1)}
                        >
                            {i + 1}
                            {p.items.some((x) =>
                                x.time.startsWith(
                                    `${prefix}-${String(i + 1).padStart(2, "0")}`,
                                ),
                            ) && <i />}
                        </button>
                    ))}
                </div>
                <h4 className="native-section">
                    {month + 1} 月 {day} 日
                </h4>
                {list.map((i) => (
                    <button
                        className="calendar-event"
                        key={i.id}
                        onClick={() => p.onItem(i)}
                    >
                        <time>{i.time.slice(-5)}</time>
                        <div>
                            <strong>{i.title}</strong>
                            <p>{meta(i, "location", i.body)}</p>
                        </div>
                    </button>
                ))}
                <Empty items={list} label="當天沒有行程" />
                <Add p={p} label="添加行程" />
            </div>
        </div>
    );
}
export function MailSkin(p: Props) {
    const { tab, setTab, q, setQ, items } = useContent(p, "訊息");
    const list = items.filter(
        (i) =>
            tab === "全部訊息" ||
            i.folder === tab ||
            (tab === "訊息" &&
                (!i.folder || !["草稿", "已發送"].includes(i.folder))),
    );
    return (
        <div className="catalog-skin native-mail">
            <Header p={p} />
            <div className="mail-folders">
                {["訊息", "草稿", "已發送", "全部訊息"].map((t) => (
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
                <h1>{tab}</h1>
                <SearchBox value={q} set={setQ} />
                {list.map((i) => (
                    <button
                        className="mail-preview"
                        key={i.id}
                        onClick={() => p.onItem(i)}
                    >
                        <i className={!i.read ? "unread" : ""} />
                        <div>
                            <strong>{i.sender}</strong>
                            <h3>{i.title}</h3>
                            <p>{i.body}</p>
                        </div>
                        <time>{i.time.slice(5, 10)}</time>
                    </button>
                ))}
                <Empty items={list} />
            </div>
            <footer className="mail-footer">
                <span>{list.length} 封郵件</span>
                <Add p={p} label="寫郵件" />
            </footer>
        </div>
    );
}
export function ClockSkin(p: Props) {
    const { tab, setTab, items } = useContent(p, "鬧鐘");
    const [enabled, setEnabled] = useSkinState<string[]>(p, "alarms", []),
        [seconds, setSeconds] = useState(0),
        [running, setRunning] = useState(false);
    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, [running]);
    return (
        <div className="catalog-skin native-clock">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>{tab}</h1>
                {tab === "碼表" ? (
                    <div className="stopwatch">
                        <output>
                            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                            {String(seconds % 60).padStart(2, "0")}
                        </output>
                        <div>
                            <button
                                onClick={() => {
                                    setSeconds(0);
                                    setRunning(false);
                                }}
                            >
                                歸零
                            </button>
                            <button onClick={() => setRunning(!running)}>
                                {running ? "暫停" : "開始"}
                            </button>
                        </div>
                    </div>
                ) : (
                    items.map((i) => (
                        <div className="alarm-row" key={i.id}>
                            <button onClick={() => p.onItem(i)}>
                                <time>{meta(i, "clock", i.time.slice(-5))}</time>
                                <small>
                                    {tab === "世界時鐘" ? meta(i, "city", i.title) : i.title}
                                </small>
                            </button>
                            {tab === "鬧鐘" ? (
                                <button
                                    role="switch"
                                    aria-label={`鬧鐘${i.title}`}
                                    aria-checked={enabled.includes(i.id)}
                                    className={`native-switch ${enabled.includes(i.id) ? "on" : ""}`}
                                    onClick={() =>
                                        setEnabled(
                                            enabled.includes(i.id)
                                                ? enabled.filter((x) => x !== i.id)
                                                : [...enabled, i.id],
                                        )
                                    }
                                >
                                    <span />
                                </button>
                            ) : (
                                <Clock size={35} />
                            )}
                        </div>
                    ))
                )}
            </div>
            <Tabs
                tabs={["世界時鐘", "鬧鐘", "碼表"]}
                value={tab}
                set={setTab}
                icons={[<Globe />, <Clock />, <Clock />]}
            />
        </div>
    );
}
export function RemindersSkin(p: Props) {
    const { tab, setTab, q, setQ, items } = useContent(p, "全部");
    const [checked, setChecked] = useSkinState<string[]>(p, "checked", []);
    const list =
        tab === "已完成"
            ? items.filter((i) => checked.includes(i.id))
            : items.filter((i) => !checked.includes(i.id));
    return (
        <div className="catalog-skin native-reminders">
            <Header p={p} />
            <div className="catalog-scroll">
                <SearchBox value={q} set={setQ} />
                <div className="reminder-categories">
                    {["全部", "已完成"].map((t) => (
                        <button key={t} onClick={() => setTab(t)}>
                            <Calendar size={22} />
                            <strong>
                                {t === "全部" ? items.length - checked.length : checked.length}
                            </strong>
                            <span>{t}</span>
                        </button>
                    ))}
                </div>
                <h1>{tab}</h1>
                {list.map((i) => (
                    <div className="reminder-row" key={i.id}>
                        <button
                            aria-label={`完成${i.title}`}
                            role="checkbox"
                            aria-checked={checked.includes(i.id)}
                            onClick={() =>
                                setChecked(
                                    checked.includes(i.id)
                                        ? checked.filter((x) => x !== i.id)
                                        : [...checked, i.id],
                                )
                            }
                        >
                            <CheckCircle size={21} />
                        </button>
                        <button onClick={() => p.onItem(i)}>
                            <strong>{i.title}</strong>
                            <small>
                                {i.time} · {i.folder}
                            </small>
                        </button>
                    </div>
                ))}
                <Add p={p} label="新提醒事项" />
            </div>
        </div>
    );
}
export function FilesSkin(p: Props) {
    const { tab, setTab, q, setQ, items } = useContent(p, "最近項目");
    const [folder, setFolder] = useState("");
    const list = folder
        ? items.filter((i) => (i.folder || "我的iPhone") === folder)
        : items;
    return (
        <div className="catalog-skin native-files">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>{folder || tab}</h1>
                <SearchBox value={q} set={setQ} />
                {tab === "瀏覽" && !folder ? (
                    <div className="file-folders">
                        {groupItems(items, "我的iPhone").map((g) => (
                            <button key={g} onClick={() => setFolder(g)}>
                                <Folder size={45} />
                                <strong>{g}</strong>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="file-grid">
                        {list.map((i) => (
                            <div key={i.id}>
                                <button onClick={() => p.onItem(i)}>
                                    {i.media ? <Media item={i} /> : <FileText size={49} />}
                                    <strong>{i.title}</strong>
                                    <small>
                                        {meta(i, "extension", "文件")} ·{" "}
                                        {meta(i, "size", i.time.slice(0, 10))}
                                    </small>
                                </button>
                                <button
                                    aria-label={`下載${i.title}文本`}
                                    onClick={() =>
                                        download(
                                            new Blob([i.body], { type: "text/plain" }),
                                            `${i.title}.txt`,
                                        )
                                    }
                                >
                                    <Download size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <Empty items={list} />
            </div>
            <Tabs
                tabs={["最近項目", "瀏覽"]}
                value={tab}
                set={(t) => {
                    setTab(t);
                    setFolder("");
                }}
                icons={[<Clock />, <Folder />]}
            />
        </div>
    );
}
function AMNowPlaying({ close }: { close: () => void }) {
  const { item, playing, pos, dur } = usePlayer();
  const isEnding = playing && dur > 0 && dur - pos <= 42 && dur - pos > 0;
  const [liked, setLiked] = useState(false); 
  const [isPopped, setIsPopped] = useState(false);
  
  if (!item) return null;
  const u = coverUrl(item.avatar || "");
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <div className="am-np">
      {isEnding && item.id === "test-item-music-3" && (
        <div className="fireworks-container">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`firework firework-${i}`} />
          ))}
        </div>
      )}  
      {u && <div className="am-np-bg" style={{ backgroundImage: `url(${u})` }} />}
      <button className="am-np-grab" aria-label="收起" onClick={close}>
        <ChevronDown size={26} />
      </button>
      <div
        className={"am-np-cover" + (playing ? "" : " paused")}
        style={u ? { backgroundImage: `url(${u})` } : undefined}
      >
        {!u && <Music size={64} />}
      </div>

      <div className="am-np-info-wrapper">
        <div className="am-np-info">
          <strong>{item.title}</strong>
          <span>{item.sender}</span>
        </div>
                <button 
          className="am-np-heart" 
          onClick={() => setLiked(!liked)}
          aria-label="喜歡"
        >
         {item.id === "test-item-music-3" ? ( 
            <img 
              src="/saxophone.png"
              alt="薩克斯風" 
              onClick={(e) => {
                e.stopPropagation(); // 防止觸發外層的點擊事件
                setIsPopped(true);   // 點擊時放大
                setTimeout(() => {
                  setIsPopped(false); // 1 秒鐘後縮小
                }, 2000);
              }}
              style={{ 
                width: "32px", 
                height: "32px", 
                objectFit: "contain",
                // 👇 這裡改用我們剛剛加的 isPopped 狀態，並加上過渡動畫
                transform: isPopped ? "scale(1.4)" : "scale(1)",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                cursor: "pointer",
              }} 
            />
          ) : (
            <Heart 
              size={22} 
              fill={liked ? "#fa2d48" : "none"} 
              color={liked ? "#fa2d48" : "#111"} 
            />
          )}
        </button>
      </div>

      <input
        className="am-np-seek"
        type="range"
        min={0}
        max={dur || 0}
        step={1}
        value={Math.min(pos, dur || 0)}
        style={{ ["--pct" as string]: pct + "%" }}
        onChange={(e) => playerSeek(Number(e.target.value))}
      />
      <div className="am-np-time">
        <span>{fmt(pos)}</span>
        <span>{fmt(dur)}</span>
      </div>
      <div className="am-np-ctl">
        <button aria-label="上一首" onClick={playerPrev}>
          <SkipBack size={38} fill="currentColor" />
        </button>
        <button aria-label="播放或暫停" onClick={playerToggle}>
          {playing ? (
            <Pause size={44} fill="currentColor" />
          ) : (
            <Play size={44} fill="currentColor" />
          )}
        </button>
        <button aria-label="下一首" onClick={playerNext}>
          <SkipForward size={38} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
export function MusicSkin(p: Props) {
  const { items, q, setQ } = useContent(p, "收藏庫");
  const [tab, setTab] = useState("立即聆聽");
  const [full, setFull] = useState(false);
  const { item: song, playing } = usePlayer();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const SECRET_PASSWORD = "1116"; // 這裡設定密碼

  useEffect(() => {
    if (pwError) {
      const timer = setTimeout(() => {
        setPwError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pwError]);

  const art = (i: Item, cls = "am-art") => {
    const u = coverUrl(i.avatar || "");
    return (
      <span className={cls} style={u ? { backgroundImage: `url(${u})` } : undefined}>
        {!u && <Music size={18} />}
      </span>
    );
  };

  // 1. 先宣告過濾邏輯（把 meta.folder 考慮進去）
  const currentTabItems = items.filter((i) => {
    if (tab === "搜尋") {
      return (i.title + i.sender).toLowerCase().includes(q.toLowerCase());
    }
    return i.meta?.folder === tab;
  });

  // 2. 接著才宣告 play 與 shuffle，此時抓得到 currentTabItems
  const play = (i: Item) => chooseTrack(p, i, currentTabItems);
  
  const shuffle = () => {
    if (currentTabItems.length) {
      play(currentTabItems[Math.floor(Math.random() * currentTabItems.length)]);
    }
  };

  const row = (i: Item) => (
    <button className="am-row" key={i.id} onClick={() => play(i)}>
      {art(i)}
      <span className={"am-title" + (song?.id === i.id ? " on" : "")}>
        {i.title}
        <small>{i.sender}</small>
      </span>
      <span className="am-more">⋯</span>
    </button>
  );

  return (
    <div className="catalog-skin native-music am" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            
      {tab === "收藏庫" && !unlocked ? (
        <div className="am-nav-only-back">
          <button onClick={() => p.onBack()} aria-label="返回">
            <ChevronLeft size={26} />
          </button>
        </div>
      ) : (
        <Header p={p} />
      )}

      {/* 中間內容區 */}
      <div style={{ flex: 1, position: "relative" }}>
        
        {/* 如果選中收藏庫且未解鎖，顯示解鎖畫面 */}
        {tab === "收藏庫" && !unlocked ? (
          <div className="am-lock-screen">
            <h2>請輸入密碼</h2>
            <span className="am-lock-hint">提示：Captain</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="輸入 4 位數密碼"
              maxLength={4}
            />
            <div className="am-lock-error">
              {pwError && <span>{pwError}</span>}
            </div>
            <button
              onClick={() => {
                if (!pw) return;
                if (pw === SECRET_PASSWORD) {
                  setUnlocked(true);
                  setPwError("");
                  setPw("");
                } else {
                  setPwError("密碼錯誤，請再試一次");
                }
              }}
            >
              解鎖
            </button>
          </div>
        ) : (
          
          <div className="catalog-scroll am-scroll" style={{ height: "100%" }}>
            
            {/* 收藏庫分頁 (需解鎖) */}
            {tab === "收藏庫" && unlocked && (
              <>
                {currentTabItems.map(row)}
              </>
            )}

            {/* 立即聆聽分頁 */}
            {tab === "立即聆聽" && (
              <>            
                <div className="am-actions">
                  <button onClick={() => currentTabItems[0] && play(currentTabItems[0])}>
                    <Play size={15} fill="currentColor" /> 播放
                  </button>
                  <button onClick={shuffle}>
                    <Shuffle size={15} /> 隨機播放
                  </button>
                </div>
                {currentTabItems.map(row)}
              </>
            )}

            {/* 搜尋分頁 */}
            {tab === "搜尋" && (
              <>          
                <SearchBox value={q} set={setQ} />
                {currentTabItems.map(row)}
              </>
            )}
            
            <Empty items={currentTabItems} />
          </div>
        )}
      </div>

      {/* 迷你播放條 */}
      {song && !full && (
        <div className="am-mini" onClick={() => setFull(true)}>
          {art(song)}
          <b>{song.title}</b>
          <button
            aria-label="播放或暫停"
            onClick={(e) => {
              e.stopPropagation();
              playerToggle();
            }}
          >
            {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button
            aria-label="下一首"
            onClick={(e) => {
              e.stopPropagation();
              playerNext();
            }}
          >
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>
      )}
      {full && <AMNowPlaying close={() => setFull(false)} />}
      
      {/* 底部 Tabs：維持原本點擊限制 */}
      <Tabs
        tabs={["立即聆聽", "瀏覽", "廣播", "收藏庫", "搜尋"]}
        value={tab}
        set={(t) => {
          if (t === "立即聆聽" || t === "收藏庫") {
            setTab(t);
          }
        }}
        icons={[<Play />, <Grid />, <Radio />, <Music />, <Search />]}
      />
    </div>
  );

}
function LocationMap({
    items,
    onItem,
    find = false,
}: {
    items: Item[];
    onItem: (i: Item) => void;
    find?: boolean;
}) {
    return (
        <div className={`fiction-map ${find ? "find-map" : ""}`}>
            <svg viewBox="0 0 300 300" aria-label="原創虛構地圖">
                <rect width="300" height="300" fill="#e4e5d8" />
                {[35, 100, 190, 260].map((n) => (
                    <path
                        key={n}
                        d={`M0 ${n} H300 M${n} 0 V300`}
                        stroke="#fff"
                        strokeWidth="11"
                    />
                ))}
                <path
                    d="M20 0 Q190 110 120 300"
                    stroke="#b6d8df"
                    strokeWidth="24"
                    fill="none"
                />
                <rect x="205" y="112" width="42" height="65" rx="7" fill="#bdcfac" />
            </svg>
            {items.map((i, n) => (
                <button
                    key={i.id}
                    aria-label={`地圖位置${i.title}`}
                    className="map-pin"
                    style={{
                        left: `${Math.max(5, Math.min(90, Number(meta(i, "x", String(20 + ((n * 17) % 65))))))}%`,
                        top: `${Math.max(8, Math.min(80, Number(meta(i, "y", String(25 + ((n * 13) % 50))))))}%`,
                    }}
                    onClick={() => onItem(i)}
                >
                    {find ? <Avatar name={i.title} /> : <MapPin size={24} />}
                </button>
            ))}
        </div>
    );
}
export function MapsSkin(p: Props) {
    const { q, setQ, items } = useContent(p, "地點");
    return (
        <div className="catalog-skin native-maps">
            <Header p={p} />
            <LocationMap items={items} onItem={p.onItem} />
            <div className="map-sheet">
                <SearchBox value={q} set={setQ} placeholder="收尋虛構地點" />
                <div className="map-places">
                    {items.map((i) => (
                        <Row key={i.id} item={i} onItem={p.onItem} leading={<MapPin />} />
                    ))}
                </div>
            </div>
        </div>
    );
}
export function WalletSkin(p: Props) {
    const [selected, setSelected] = useState("");
    const cards = p.items.filter((i) => i.folder !== "交易"),
        transactions = p.items.filter((i) => i.folder === "交易");
    return (
        <div className="catalog-skin native-wallet">
            <Header p={p} />
            <div className="catalog-scroll">
                <h1>錢包</h1>
                <div className="wallet-stack">
                    {cards.map((i, n) => (
                        <button
                            key={i.id}
                            className={selected === i.id ? "selected" : ""}
                            style={{
                                background: ["#252d38", "#716456", "#4a655d", "#735e6b"][n % 4],
                            }}
                            onClick={() => {
                                setSelected(i.id);
                                p.onItem(i);
                            }}
                        >
                            <strong>{i.title}</strong>
                            <span>{meta(i, "number", "••••")}</span>
                            <small>{meta(i, "amount", i.sender)}</small>
                        </button>
                    ))}
                </div>
                <h4 className="native-section">交易紀錄</h4>
                {transactions.map((i) => (
                    <Row key={i.id} item={i} onItem={p.onItem} leading={<Wallet />}>
                        <strong>{meta(i, "amount")}</strong>
                    </Row>
                ))}
                <Empty items={p.items} />
            </div>
        </div>
    );
}
export function FindSkin(p: Props) {
    const { tab, setTab, items } = useContent(p, "設備");
    const list = items.filter((i) =>
        tab === "設備" ? i.folder !== "人物" : i.folder === "人物",
    );
    return (
        <div className="catalog-skin native-find">
            <Header p={p} />
            <LocationMap items={list} onItem={p.onItem} find />
            <div className="find-sheet">
                <h2>{tab}</h2>
                {list.map((i) => (
                    <Row
                        key={i.id}
                        item={i}
                        onItem={p.onItem}
                        leading={<Avatar name={i.title} />}
                    >
                        {meta(i, "status", "位置記錄")}
                    </Row>
                ))}
                <Empty items={list} />
            </div>
            <Tabs
                tabs={["人物", "設備"]}
                value={tab}
                set={setTab}
                icons={[<Users />, <MapPin />]}
            />
        </div>
    );
}