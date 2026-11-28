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
import { setCallInfo } from "../phoneCall";
import { usePhoneItems } from "../phoneData";
import { takeDial, endCallReturn } from "../phoneDial";
import { useVolume } from "../volume";
import {
    Calendar,
    Camera,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    SquareArrowUp,
    Delete as BackspaceIcon,
    CirclePlus,
    Clock,
    FolderPlus,
    ListChecks,
    Paperclip,
    SquarePen,
    Voicemail,
    Sparkles,
    Type,
    Info,
    MicOff,
    Lock, 
    Volume2, 
    ArrowDownLeft, 
    ArrowUpRight,
    MoreHorizontal, 
    Video,
    Download,
    AlarmClock, 
    Timer, 
    Plus,
    FileText,
    MessageCircle,
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
    Users,
    Pause,    
    Play,     
    Radio,
    ChevronDown,
    Share,
    Book,
    BookOpen,
    Copy,
    RotateCw,
    Shield,
    SkipBack,    
    Shuffle,  
} from "lucide-react";
import { useEffect, useState,useMemo,useRef  } from "react";
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

type CallLine =
  | { kind: "say"; text: string; me: boolean }
  | { kind: "wait"; sec: number }
  | { kind: "slow" };

// 一行一句；「我：」開頭＝手機主人說的；（停5秒）＝停頓；（以下放慢）＝之後放慢
const parseLines = (body: string): CallLine[] =>
  body
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s): CallLine => {
      let m = s.match(/^[（(]停\s*(\d+(?:\.\d+)?)\s*秒[）)]$/);
      if (m) return { kind: "wait", sec: Number(m[1]) };
      if (/^[（(]以下放慢[）)]$/.test(s)) return { kind: "slow" };
      m = s.match(/^(?:我|me)\s*[：:]\s*(.*)$/i);
      return m
        ? { kind: "say", text: m[1], me: true }
        : { kind: "say", text: s, me: false };
    });

const fmtSecs = (s: number) =>
  String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
const CALL_OPTS = [
  { k: "擴音", Icon: Volume2 },
  { k: "FaceTime", Icon: Video },
  { k: "靜音", Icon: MicOff },
  { k: "更多", Icon: MoreHorizontal },
  { k: "結束", Icon: Phone },
  { k: "鍵盤", Icon: Grid },
];
const PY_EDGES = "阿八嚓哒妸发旮哈讥咔垃妈拏噢妑七呥扨它穵夕丫帀".split("");
const PY_LETTERS = "ABCDEFGHJKLMNOPQRSTWXYZ".split("");
const letterOf = (name: string): string => {
  const c = name.trim().charAt(0);
  if (/[a-z]/i.test(c)) return c.toUpperCase();
  if (!/[\u4e00-\u9fff]/.test(c)) return "#";
  const col = new Intl.Collator("zh-Hans-u-co-pinyin");
  let r = "#";
  for (let i = 0; i < PY_EDGES.length; i++) {
    if (col.compare(c, PY_EDGES[i]) >= 0) r = PY_LETTERS[i];
  }
  return r;
};
// 聯絡人列表：依拼音首字母分組＋右側字母索引，按名字進詳情頁
function ContactBook({
  list,
  onPick,
}: {
  list: Item[];
  onPick: (i: Item) => void;
}) {
  const groups = (() => {
    const m = new Map<string, Item[]>();
    list.forEach((i) => {
      const L = String(meta(i, "letter", "")).toUpperCase() || letterOf(i.title);
      m.set(L, [...(m.get(L) ?? []), i]);
    });
    return [...m.entries()].sort(([a], [b]) =>
      a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b),
    );
  })();
  return (
    <>
      <div className="ct-idx">
        {groups.map(([L]) => (
          <button
            key={L}
            onClick={() =>
              document.getElementById("ct-" + L)?.scrollIntoView({ block: "start" })
            }
          >
            {L}
          </button>
        ))}
      </div>
      {groups.map(([L, rows]) => (
        <div key={L} id={"ct-" + L}>
          <div className="ct-h">{L}</div>
          {rows.map((i) => (
            <button className="ct-row" key={i.id} onClick={() => onPick(i)}>
              {i.title}
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

export function PhoneSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "最近通話");
  const [digits, setDigits] = useState(""),
    [call, setCall] = useState("");

  const CONTACT = "聯絡人";
  const VM = "語音信箱";
  const [openVm, setOpenVm] = useState("");
  const [rf, setRf] = useState<"all" | "missed">("all");
  const voicemails = items.filter((i) => i.folder === VM);
  const norm = (s: string) => s.replace(/\D/g, "");
  const numOf = (i: Item) => String(meta(i, "number", ""));

  // 聯絡人（依名字排序）與通話紀錄
  const contacts = items
    .filter((i) => i.folder === CONTACT)
    .sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"));
 const records = items.filter((i) => i.folder !== CONTACT && i.folder !== VM);

  // 鍵盤輸入的號碼，有沒有對應的聯絡人
  const matched = digits
    ? contacts.find((c) => norm(numOf(c)) === norm(digits))
    : undefined;

  const keyword = q.trim().toLowerCase();
  const base =
    tab === "聯絡人"
      ? contacts
      : records.filter((i) => rf === "all" || meta(i, "status") === "未接");
  const list = base.filter(
    (i) =>
      !keyword ||
      i.title.toLowerCase().includes(keyword) ||
      numOf(i).includes(keyword),
  );
    const isContactTab = tab === "聯絡人";
  const [phase, setPhase] = useState<"dial" | "in" | "none">("dial");
  const [shown, setShown] = useState<{ t: string; me: boolean }[]>([]);
  const [secs, setSecs] = useState(0);
  const [opts, setOpts] = useState<string[]>([]);
    const [localCalls, setLocalCalls] = useState<
    { id: string; name: string; number: string }[]
  >([]);
    // 詳情頁按「通話」時，收到請求就撥號
  useEffect(() => {
    const go = () => {
      const n = takeDial();
      if (n) setCall(n);
    };
    go();
    window.addEventListener("phone-dial", go);
    return () => window.removeEventListener("phone-dial", go);
  }, []);
  const record = (name: string) => {
    const c = contacts.find((x) => x.title === name);
    setLocalCalls((l) => [
      { id: String(Date.now()), name, number: c ? numOf(c) : name },
      ...l,
    ]);
  };
  const capRef = useRef<HTMLDivElement>(null);
  const callItem = contacts.find((c) => c.title === call);
    const recRow = (
    key: string,
    name: string,
    sub: string,
    dir: "in" | "out" | "missed",
    date: string,
    time: string,
    onInfo?: () => void,
  ) => (
    <div className={"cr" + (dir === "missed" ? " missed" : "")} key={key}>
      <button className="cr-main" onClick={() => setCall(name)}>
        <span className="cr-dir">
          {dir === "out" ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
        </span>
        <span className="cr-who">
          <strong>{name}</strong>
          <small>{sub}</small>
        </span>
        <span className="cr-time">
          <span>{date}</span>
          {time && <span>{time}</span>}
        </span>
      </button>
      {onInfo && (
        <button className="cr-info" aria-label="詳細資料" onClick={onInfo}>
          <Info size={22} />
        </button>
      )}
    </div>
  );
  // 撥號時的「嘟——」聲（1 秒響、2 秒停），接通、掛斷、無人接聽就停
  const [vol] = useVolume();
  useEffect(() => {
    if (!call || phase !== "dial") return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    [440, 480].forEach((f) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(gain);
      o.start();
    });
    const level = 0.12 * Number(vol);
    const pulse = () => {
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(level, t);
      gain.gain.setValueAtTime(0, t + 1);
    };
    pulse();
    const id = window.setInterval(pulse, 3000);
    return () => {
      window.clearInterval(id);
      void ctx.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, phase]);
  
  // 開始通話：1.8 秒後接通（沒台詞就無人接聽），台詞一行一行出現
  useEffect(() => {
    if (!call) return;
    const lines = parseLines(callItem?.body ?? "");
    const ans = Number(callItem?.meta.answer);
    const answerMs = (callItem?.meta.answer && Number.isFinite(ans) ? ans : 1.8) * 1000;
    setPhase("dial");
    setShown([]);
    setSecs(0);
    setOpts([]);
    let alive = true;
    const ids: number[] = [];
    const at = (fn: () => void, ms: number) => {
      ids.push(window.setTimeout(() => alive && fn(), ms));
    };
    const play = (i: number, slow: boolean) => {
            if (i >= lines.length) {
        // 台詞說完：停一下就自動掛斷，並記進最近通話
        at(() => {
          record(call);
          endCallReturn();
          setCall("");
        }, 64000);
        return;
      }
      const L = lines[i];
      if (L.kind === "wait") {
        at(() => play(i + 1, slow), L.sec * 1000);
        return;
      }
      if (L.kind === "slow") {
        play(i + 1, true);
        return;
      }
      setShown((s) => [...s, { t: L.text, me: L.me }]);
      const base = Math.max(1800, Math.min(4200, L.text.length * 160));
      at(() => play(i + 1, slow), slow ? Math.round(base * 1.7) + 600 : base);
    };
    at(() => {
      if (!lines.length) {
        setPhase("none");
                at(() => {
          record(call);
          endCallReturn();
          setCall("");
        }, 1800);
        return;
      }
      setPhase("in");
      at(() => play(0, false), 900);
    }, answerMs);
    return () => {
      alive = false;
      ids.forEach((id) => window.clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  // 通話計時
  useEffect(() => {
    if (phase !== "in" || !call) return;
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, call]);
  // 把通話狀態公布給動態島；離開電話 App 就清掉
  useEffect(() => {
    setCallInfo({ active: !!call, name: call, phase, secs });
  }, [call, phase, secs]);
  useEffect(
    () => () => setCallInfo({ active: false, name: "", phase: "dial", secs: 0 }),
    [],
  );
  // 字幕自動捲到最下面
  useEffect(() => {
    capRef.current?.scrollTo({ top: capRef.current.scrollHeight });
  }, [shown]);

  return (
    <div className="catalog-skin native-phone">
      <Header p={p} />
      <div className="catalog-scroll">
        {tab !== "鍵盤" && <h1>{tab}</h1>}
        {tab === "鍵盤" ? (
<div className="kp">
  <output className="kp-num">{digits}</output>
  <div className="kp-sub">
    {matched ? matched.title : digits ? "加入聯絡人" : ""}
  </div>
  <div className="kp-grid">
    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
      <button key={k} onClick={() => setDigits((s) => (s.length < 15 ? s + k : s))}>
        <b>{k}</b>
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
                "0": "+",
              } as Record<string, string>
            )[k]
          }
        </small>
      </button>
    ))}
  </div>
  <div className="kp-bottom">
    <span />
    <button
      className="kp-call"
      disabled={!digits}
      aria-label="撥號"
      onClick={() => {
        setCall(matched ? matched.title : digits);
        const i = items.find((i) => meta(i, "number") === digits);
        if (i) p.onRead(i.id);
      }}
    >
      <Phone size={32} />
    </button>
    <button
      className="kp-del"
      aria-label="刪除"
      style={{ visibility: digits ? "visible" : "hidden" }}
      onClick={() => setDigits((s) => s.slice(0, -1))}
    >
      <BackspaceIcon size={28} />
    </button>
  </div>
</div>
        ) : tab === "語音信箱" ? (
  <>
    {voicemails.map((i) => (
      <div
        key={i.id}
        className="vm-item"
        onClick={() => setOpenVm(openVm === i.id ? "" : i.id)}
      >
        <div className="vm-h">
          <b>{i.title}</b>
          <time>{i.time.slice(5, 10)}</time>
        </div>
        <div className="vm-s">
          語音信箱{meta(i, "duration", "") ? " · " + meta(i, "duration", "") : ""}
        </div>
        {openVm === i.id && (
          <div className="vm-body">
            <div className="vm-play">
              <span>▶</span>
              <span className="vm-bar"><u /></span>
              <span>{meta(i, "duration", "0:12")}</span>
            </div>
            <div className="vm-tx">{i.body}</div>
          </div>
        )}
      </div>
    ))}
    <Empty items={voicemails} label="沒有語音留言" />
  </>
) : (
          <>
                      {tab === "最近通話" && (
              <div className="rf-seg">
                <button className={rf === "all" ? "on" : ""} onClick={() => setRf("all")}>
                  全部
                </button>
                <button className={rf === "missed" ? "on" : ""} onClick={() => setRf("missed")}>
                  未接
                </button>
              </div>
            )}
            <SearchBox value={q} set={setQ} />
            {tab === "最近通話" &&
              rf === "all" &&
              localCalls.map((c) => {
                const who = contacts.find((x) => x.title === c.name);
                return recRow(
                  c.id,
                  c.name,
                  c.number + " · 撥出",
                  "out",
                  "剛剛",
                  "",
                  who ? () => p.onItem(who) : undefined,
                );
              })}
            {tab === "聯絡人"
              ? <ContactBook list={list} onPick={p.onItem} />
              : list.map((i) =>
                  isContactTab ? (
                    <button className="call-row" key={i.id} onClick={() => setCall(i.title)}>
                      <span className="contact-av">
                        <Avatar name={i.title} src={i.avatar} />
                      </span>
                      <span>
                        <strong>{i.title}</strong>
                        <small>{numOf(i)}</small>
                      </span>
                    </button>
                  ) : (
                    recRow(
                      i.id,
                      i.title,
                      meta(i, "number", i.sender) + " · " + meta(i, "status", "通話紀錄"),
                      meta(i, "status") === "撥出"
                        ? "out"
                        : meta(i, "status") === "未接"
                          ? "missed"
                          : "in",
                      i.time.slice(5, 10).replace("-", "/"),
                      i.time.slice(11, 16),
                      () => p.onItem(i),
                    )
                  ),
                )}
            {(isContactTab || localCalls.length === 0) && (
              <Empty
                items={list}
                label={isContactTab ? "還沒有聯絡人" : undefined}
              />
            )}
          </>
        )}
      </div>
      <Tabs
        tabs={["最近通話", "聯絡人", "鍵盤", "語音信箱"]}
        value={tab}
        set={setTab}
        icons={[<Clock />, <Users />, <Grid />, <Voicemail />]}
      />
{call && (
  <div className="virtual-call">
    <small>
      {phase === "in"
        ? fmtSecs(secs)
        : phase === "none"
          ? "無人接聽"
          : "正在撥號…"}
    </small>
    <Avatar name={call} src={callItem?.avatar} />
    <h2>{call}</h2>
    <div className="call-cap" ref={capRef}>
      {shown.map((l, n) => (
        <div key={n} className={"co-line" + (l.me ? " me" : "")}>
          {l.t}
        </div>
      ))}
    </div>
    <div className="co-opts">
      {CALL_OPTS.map(({ k, Icon }) =>
        k === "結束" ? (
          <button
  key={k}
  className="end"
  aria-label="掛斷"
  onClick={() => {
    record(call);
    setCall("");
    endCallReturn();
  }}
>
            <span>
              <Icon size={28} style={{ transform: "rotate(135deg)" }} />
            </span>
            <small>{k}</small>
          </button>
        ) : (
          <button
            key={k}
            className={opts.includes(k) ? "on" : ""}
            onClick={() =>
              setOpts((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]))
            }
          >
            <span>
              <Icon size={26} />
            </span>
            <small>{k}</small>
          </button>
        ),
      )}
    </div>
  </div>
)}
    </div>
  );
}

export function ContactsSkin(p: Props) {
  const [q, setQ] = useState("");
  // 資料共用：讀電話 App 裡 folder 是「聯絡人」的那些
  const phoneItems = usePhoneItems();
  const kw = q.trim().toLowerCase();
  const list = phoneItems
    .filter((i) => i.folder === "聯絡人")
    .sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"))
    .filter(
      (i) =>
        !kw ||
        i.title.toLowerCase().includes(kw) ||
        String(meta(i, "number", "")).includes(kw),
    );
  return (
    <div className="catalog-skin native-contacts">
      <Header p={p} />
      <div className="catalog-scroll">
        <h1>聯絡人</h1>
        <SearchBox value={q} set={setQ} />
        <ContactBook list={list} onPick={p.onItem} />
        <Empty items={list} label="還沒有聯絡人" />
      </div>
    </div>
  );
}
//相簿//
export function PhotosSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "圖庫");
  const [album, setAlbum] = useState("");
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);
  const [bad, setBad] = useState(false);
  const [previewList, setPreviewList] = useState<Item[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const FAV = "個人收藏";

  // 依時間由舊到新（跟 iPhone 一樣，最新在最下面）
  const HID = "已上鎖";
  const all = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const sorted = all.filter((i) => i.folder !== HID);
  const secret = all.filter((i) => i.folder === HID);
  const PW = String(secret[0]?.meta?.password || "0122");
  const favs = sorted.filter((i) => i.favorite);
  const folders = groupItems(
    sorted.filter((i) => i.folder),
    "未分類",
  );
  const albums = [...folders, ...(favs.length ? [FAV] : [])];
   const inAlbum = (g: string) =>
    g === FAV
      ? favs
      : g === HID
        ? secret
        : sorted.filter((i) => i.folder === g);
  const kw = q.trim().toLowerCase();
  const found = sorted.filter(
    (i) =>
      kw &&
      (i.title.toLowerCase().includes(kw) ||
        i.body.toLowerCase().includes(kw) ||
        (i.folder || "").toLowerCase().includes(kw)),
  );

   // 建立一個輔助函式，用來取得目前畫面上顯示的所有照片陣列
  const currentPhotos = tab === "圖庫" ? sorted 
    : tab === "搜尋" ? found 
    : album ? inAlbum(album) 
    : sorted;

  const thumb = (i: Item, list: Item[]) => {
    const index = list.findIndex((photo) => photo.id === i.id);
    return (
      <button
        aria-label={`查看${i.title}`}
        key={i.id}
        onClick={() => {
          setPreviewList(list);
          setPreviewIndex(index);
        }}
      >
        <Media item={i} />
        {i.favorite && <Heart size={14} fill="#ff2d55" color="#ff2d55" />}
      </button>
    );
  };

  return (
    <div className="catalog-skin native-photos">
      <div className="catalog-scroll">
        {tab === "圖庫" && (
          <>
             <h3 className="pf-sec">我的照片</h3>
            <div className="photo-mosaic">{sorted.map((i) => thumb(i, sorted))}</div>
            <p className="media-count">{sorted.length} 張照片</p>
          </>
        )}

        {tab === "為你推薦" && (
          <>
            <h3 className="pf-sec">精選照片</h3>
            <div className="pf-row">
              {(favs.length ? favs : sorted.slice(0, 5)).map((i) => (
                <button
                  className="pf-feat"
                  key={i.id}
                  aria-label={`查看${i.title}`}
                  onClick={() => p.onItem(i)}
                >
                  <Media item={i} />
                </button>
              ))}
            </div>
            <h3 className="pf-sec">回憶</h3>
            <div className="pf-mem">
              {folders.map((g) => (
                <button
                  key={g}
                  className="pf-card"
                  onClick={() => {
                    setTab("相簿");
                    setAlbum(g);
                  }}
                >
                  <Media item={inAlbum(g)[0]} />
                  <span>
                    <strong>{g}</strong>
                    <small>{inAlbum(g).length} 張照片</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "相簿" && !album && (
          <>
            <h3 className="pf-sec">我的相簿</h3>
            <div className="album-grid">
              {/* 渲染一般的相簿 */}
              {albums.map((g) => (
                <button key={g} onClick={() => setAlbum(g)}>
                  <Media item={inAlbum(g)[0]} />
                  <strong>{g}</strong>
                  <small>{inAlbum(g).length}</small>
                </button>
              ))}
              
              {/* 渲染已上鎖的相簿 */}
              {secret.length > 0 && (
                <button onClick={() => setAlbum(HID)}>
                  <span className="lock-cover">
                    <Lock size={32} />
                  </span>
                  <strong>已上鎖</strong>
                  <small>{secret.length}</small>
                </button>
              )}
            </div>
          </>
        )}

        {tab === "相簿" && album && (
          <>
            <button
              className="pf-back"
              onClick={() => {
                setAlbum("");
                setOk(false);
                setPin("");
                setBad(false);
              }}
            >
              <ChevronLeft size={20} />
              相簿
            </button>
            {album === HID && !ok ? (
              <div className="pf-lock-screen">
                <div className="pf-lock-icon">
                  <Lock size={48} strokeWidth={1.5} />
                </div>
                <h2>已上鎖</h2>
                <p>請輸入密碼以查看此相簿</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (pin === PW) {
                    setOk(true);
                    setBad(false);
                  } else {
                    setBad(true);
                    setPin("");
                  }
                }}>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className={bad ? "error" : ""}
                  />
                  {bad && <span className="error-text">密碼錯誤，請再試一次</span>}
                  
                  <button type="submit" className="unlock-btn">
                    解鎖
                  </button>
                </form>
              </div>
            ) : (
              <>
                {album !== HID && <h1>{album}</h1>}
                <div className="photo-mosaic">{inAlbum(album).map((i) => thumb(i, inAlbum(album)))}</div>
                <p className="media-count">{inAlbum(album).length} 張照片</p>
              </>
            )}
          </>
        )}

        {tab === "搜尋" && (
          <>
            <SearchBox value={q} set={setQ} />
            <div className="photo-mosaic">{found.map((i) => thumb(i, found))}</div>
          </>
        )}
        <Empty items={items} />
      </div>
      <Tabs
        tabs={["圖庫", "為你推薦", "相簿", "搜尋"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setAlbum("");
          setOk(false);
          setPin("");
          setBad(false);
        }}
        icons={[<Image />, <Sparkles />, <Folder />, <Search />]}
      />
      {/* 👇 全螢幕預覽 */}
      {previewList.length > 0 && previewIndex >= 0 && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#000",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* 頂部導航列 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            color: "#fff",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
            zIndex: 10
          }}>
            <button 
              onClick={() => setPreviewList([])} 
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <ChevronLeft size={24} />
              <span style={{ marginLeft: "4px" }}>返回</span>
            </button>
            <span style={{ fontSize: "14px" }}>
              {previewIndex + 1} / {previewList.length}
            </span>
          </div>

          {/* 左右滑動的照片區 */}
          <div 
            style={{ 
              flex: 1, 
              display: "flex", 
              overflowX: "auto", 
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none"
            }}
            onWheel={(e) => {
              // 👇 滑鼠滾輪切換
              e.preventDefault();
              if (e.deltaY > 0 && previewIndex < previewList.length - 1) {
                setPreviewIndex(previewIndex + 1);
              } else if (e.deltaY < 0 && previewIndex > 0) {
                setPreviewIndex(previewIndex - 1);
              }
            }}
          >
            {previewList.map((item, idx) => (
              <div 
                key={item.id} 
                style={{ 
                  flex: "0 0 100%", 
                  height: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  scrollSnapAlign: "start",
                  background: "#000" // 
                }}
                ref={(el) => {
                  if (el && idx === previewIndex) {
                    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                  }
                }}
              >
                {/* 👇 直接放圖片，不要讓 Media 元件影響排版 */}
                <img 
                  src={item.media} 
                  alt={item.title} 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "contain" // 👈 完整顯示圖片，不裁切
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
//相機//
type CamFacing = "back" | "front";
const CAM_FACINGS: CamFacing[] = ["front", "back"];
const CAM_MODES = ["照片", "影片"];

const framesFor = (items: Item[], facing: CamFacing, mode: string) =>
  items.filter((i) => {
    const isFront = i.folder === "前鏡頭";
    if ((facing === "front") !== isFront) return false;
    return mode === "影片" ? i.kind === "video" : i.kind !== "video";
  });

export function CameraSkin(p: Props) {
  const [mode, setMode] = useState("照片");
  const [facing, setFacing] = useState<CamFacing>("front");
  const [flashOn, setFlashOn] = useState(false);
  const [flashAnim, setFlashAnim] = useState(false);

  // 進入 App 時，四種組合各抽一次；之後切換只是換著看，不會重抽。
  // 離開 App 再開啟會重新載入這個元件，所以會再抽一次。
  const [picks] = useState<Record<string, Item | null>>(() => {
    const r: Record<string, Item | null> = {};
    for (const f of CAM_FACINGS) {
      for (const m of CAM_MODES) {
        const list = framesFor(p.items, f, m);
        r[`${f}-${m}`] = list.length
          ? list[Math.floor(Math.random() * list.length)]
          : null;
      }
    }
    return r;
  });

  const currentFrame = picks[`${facing}-${mode}`];

  const handleShutter = () => {
    const audio = new Audio("/shutter.mp3");
    audio.play().catch(() => {});
    if (flashOn) {
      setFlashAnim(true);
      setTimeout(() => setFlashAnim(false), 150);
    }
  };

  return (
    <div className="catalog-skin native-camera" style={{ background: "#000", height: "100%", width: "100%", display: "flex", flexDirection: "column", position: "absolute", inset: 0, paddingTop: "59px", zIndex: 50 }}>

      {/* 頂部狀態列 */}
      <div className="camera-top" style={{ padding: "12px 16px 8px", display: "flex", justifyContent: "space-between", color: "#fff", fontSize: "14px" }}>
        <button onClick={() => setFlashOn(!flashOn)} style={{ background: "none", border: "none", color: flashOn ? "#f6cf45" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}>
          <span>⚡️</span> {flashOn ? "開啟" : "關閉"}
        </button>
        <span>{mode === "影片" ? "HD · 30" : "4:3"}</span>
      </div>

      {/* 取景框 */}
      <div className="camera-view" style={{ flex: 1, position: "relative", overflow: "hidden", background: "#151515" }}>
        {currentFrame ? (
          currentFrame.kind === "video" ? (
            <video
              key={currentFrame.id}
              src={currentFrame.media}
              autoPlay
              loop
              muted={meta(currentFrame, "muted") === "true"}
              playsInline
              controls={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            />
          ) : (
            <img
              key={currentFrame.id}
              src={currentFrame.media}
              alt={currentFrame.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            />
          )
        ) : (
          <div style={{ color: "#666", display: "grid", placeItems: "center", height: "100%" }}>未設置取景畫面</div>
        )}

        {flashAnim && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.8, zIndex: 10 }} />}
      </div>

      {/* 模式切換 */}
      <div className="camera-mode" style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "16px", fontSize: "15px", background: "#000" }}>
        {["影片", "照片"].map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{ background: "none", border: "none", color: mode === m ? "#f6cf45" : "#aaa", fontSize: "15px", fontWeight: mode === m ? "bold" : "normal", cursor: "pointer" }}>
            {m}
          </button>
        ))}
      </div>

      {/* 底部控制列 */}
      <div className="camera-controls" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 30px 50px", background: "#000" }}>
        <button style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#333", border: "none", overflow: "hidden", padding: 0 }}>
          {currentFrame && (
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              {currentFrame.kind === "video" ? (
                <video src={currentFrame.media} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <img src={currentFrame.media} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
          )}
        </button>

        <button onClick={handleShutter} style={{ width: "72px", height: "72px", borderRadius: "50%", border: "4px solid #fff", padding: "4px", background: "none", cursor: "pointer" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff" }} />
        </button>

        <button onClick={() => setFacing(facing === "back" ? "front" : "back")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
        </button>
      </div>
    </div>
  );
}

//瀏覽器//
const HISTORY = "歷史紀錄";
const BOOKMARK = "書籤";

type SafariItem = Props["items"][number];

function hasItemContent(item: SafariItem): boolean {
  const hasBody = Boolean(String(item.body || "").trim());
  const m = item.meta || {};
  const hasMeta = Boolean(
    String(m.image || "").trim() ||
      String(m.video || "").trim() ||
      String(m.linkUrl || "").trim()
  );
  return hasBody || hasMeta;
}

function renderItemDetail(item: SafariItem) {
  const m = item.meta || {};
  const bodyText = String(item.body || "").trim();
  const imageSrc = String(m.image || "").trim();
  const videoSrc = String(m.video || "").trim();
  const posterSrc = String(m.poster || "").trim() || undefined;
  const caption = String(m.caption || "").trim();
  const linkUrl = String(m.linkUrl || "").trim();
  const linkLabel = String(m.linkLabel || "").trim() || linkUrl;

  const isVideoOnly = Boolean(videoSrc) && !bodyText && !imageSrc && !linkUrl;

  if (isVideoOnly) {
    return (
      <div className="sf-video-fullscreen">
        <video
        src={videoSrc}
        poster={posterSrc}
        autoPlay
        loop
        playsInline
        preload="auto"
        className="sf-video-fullscreen-player"
        onClick={(e) => {
          const video = e.currentTarget;
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }}
      />
      {caption && <div className="sf-video-fullscreen-caption">{caption}</div>}
    </div>
  );
}

return (
  <div className="sf-site">
    <h1>{item.title}</h1>
    <div className="sf-blocks">
      {bodyText && <p className="sf-block-text">{bodyText}</p>}

      {videoSrc && (
        <figure className="sf-block-figure">
          <video
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            loop
            playsInline
            preload="auto"
            className="sf-block-video"
            onClick={(e) => {
              const video = e.currentTarget;
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
            }}
          />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )}

      {imageSrc && (
        <figure className="sf-block-figure">
          <img src={imageSrc} alt={caption || item.title || ""} className="sf-block-img" />
          {!videoSrc && caption && <figcaption>{caption}</figcaption>}
        </figure>
      )}

        {linkUrl && (
          <div className="sf-block-link-wrap">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-block-link"
            >
              {linkLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function SafariSkin(p: Props) {
  const bookmarkItems = p.items.filter((i) => i.folder === BOOKMARK);

  // 只在 SafariSkin 掛載時洗牌一次，不會隨父層 re-render 一直跳
  const [shuffledHistory] = useState<SafariItem[]>(() => {
    const list = p.items.filter((i) => i.folder === HISTORY);
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [activeItem, setActiveItem] = useState<SafariItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const openPage = (item: SafariItem) => {
    setActiveItem(item);
    contentRef.current?.scrollTo(0, 0);
  };

  const goBack = () => {
    setActiveItem(null);
    contentRef.current?.scrollTo(0, 0);
  };

  return (
    <div className="catalog-skin native-safari sf-ref-theme">
      <div className="safari-content" ref={contentRef}>
        {activeItem ? (
          renderItemDetail(activeItem)
        ) : (
          <div className="sf-history-page">
            <div className="sf-history-header">
              <h1>{HISTORY}</h1>
              <span className="sf-history-count">{shuffledHistory.length}條</span>
            </div>

            {bookmarkItems.length > 0 && (
              <div className="sf-bookmark-bar" aria-label="書籤列">
                {bookmarkItems.map((bm) => {
                  const canOpen = hasItemContent(bm);
                  return canOpen ? (
                    <button
                      key={bm.id}
                      type="button"
                      className="sf-bookmark-chip is-clickable"
                      onClick={() => openPage(bm)}
                    >
                      <Book size={14} color="#007aff" />
                      <span>{bm.title}</span>
                    </button>
                  ) : (
                    <div key={bm.id} className="sf-bookmark-chip">
                      <Book size={14} color="#007aff" />
                      <span>{bm.title}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sf-history-section-label">搜尋歷史</div>

            <div className="sf-history-card">
              {shuffledHistory.map((item) => {
                const canOpen = hasItemContent(item);

                if (canOpen) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="sf-history-row is-clickable"
                      onClick={() => openPage(item)}
                    >
                      <span className="sf-history-icon" aria-hidden="true">
                        <Search size={18} />
                      </span>
                      <span className="sf-history-text">
                        <strong>{item.title}</strong>
                      </span>
                      <ChevronRight size={18} className="sf-history-chevron" />
                    </button>
                  );
                }

                return (
                  <div key={item.id} className="sf-history-row">
                    <span className="sf-history-icon" aria-hidden="true">
                      <Search size={18} />
                    </span>
                    <span className="sf-history-text">
                      <strong>{item.title}</strong>
                    </span>
                    <ChevronRight size={18} className="sf-history-chevron" />
                  </div>
                );
              })}

              {shuffledHistory.length === 0 && (
                <div className="sf-history-empty">沒有歷史紀錄</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="safari-bottom">
        <div className="sf-pill-bar">
          <span className="sf-pill-size">Aa</span>
          <input
            ref={inputRef}
            className="sf-pill-input"
            value=""
            readOnly
            tabIndex={-1}
            placeholder="搜尋歷史"
            aria-label="搜尋歷史"
          />
          <span className="sf-pill-clear" aria-hidden="true">
            ×
          </span>
        </div>

        <div className="safari-toolbar">
          <button
            type="button"
            onClick={goBack}
            disabled={!activeItem}
            aria-label="返回"
          >
            <ChevronLeft size={24} />
          </button>
          <button type="button" disabled aria-label="前進">
            <ChevronRight size={24} />
          </button>
          <button type="button" aria-label="分享">
            <Share size={20} color="#007aff" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveItem(null);
              contentRef.current?.scrollTo(0, 0);
            }}
            aria-label="書籤"
          >
            <Book size={20} color="#9ad0fa" />
          </button>
          <button type="button" aria-label="分頁">
            <Copy size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

//備忘錄//
export function NotesSkin(p: Props) {
  const { items } = useContent(p, "備忘錄");
  const [selectedNote, setSelectedNote] = useState<Item | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [unlocked, setUnlocked] = useState(false); // 👈 新增解鎖狀態
  
  const fname = (i: Item) => i.folder || "備忘錄";
  const byTime = (a: Item, b: Item) => b.time.localeCompare(a.time);
  const day = (t: string) => `${Number(t.slice(5, 7))}月${Number(t.slice(8, 10))}日`;
  const pinned = items.filter((i) => i.favorite).sort(byTime);
  const rest = items.filter((i) => !i.favorite);
  const groups = [...new Set(rest.map(fname))].map((g) => ({
    name: g,
    list: rest.filter((i) => fname(i) === g).sort(byTime),
  }));

  // 👇 點擊列表時，設定選中的筆記
  const row = (i: Item) => (
    <button key={i.id} onClick={() => {
      if (i.password) {
        setSelectedNote(i);
        setPinOpen(true);
        setPin("");
        setPinError(false);
        setUnlocked(false); // 確保每次點擊有鎖的筆記都是鎖定狀態
      } else {
        setSelectedNote(i);
      }
    }}>
      <strong>
        {i.password && <LockKeyhole size={13} />}
        {i.title}
      </strong>
      <span>
        <time>{day(i.time)}</time>
        {i.password ? "已鎖定的備忘錄" : i.body.split("\n")[0]}
      </span>
    </button>
  );

  // 👇 如果選中了筆記，且（已解鎖 或 這則筆記沒有密碼），顯示內文頁面
  if (selectedNote && (unlocked || !selectedNote.password)) {
    return (
      <div className="catalog-skin native-notes note-detail">
        {/* 頂部導航列 */}
        <div className="nd-top">
          <button 
            onClick={() => { setSelectedNote(null); setUnlocked(false); }} 
            className="nd-back"
          >
            <ChevronLeft size={24} />
            備忘錄
          </button>
          <div className="nd-actions">
            <button aria-label="分享"><SquareArrowUp size={22} /></button>
            <button aria-label="更多"><MoreHorizontal size={22} /></button>
          </div>
        </div>

        {/* 內文區塊 */}
        <div className="nd-content">
          <div className="nd-date">
            {(() => {
              const dateStr = selectedNote.time.slice(0, 10); 
              const dateObj = new Date(dateStr);
              const year = dateObj.getFullYear();
              const month = dateObj.getMonth() + 1;
              const day = dateObj.getDate();
              const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
              const wd = weekdays[dateObj.getDay()];
              return `${year}/${month}/${day}(${wd})`;
            })()}
          </div>
          <h1 className="nd-title">{selectedNote.title}</h1>
          <div className="nd-body">{selectedNote.body}</div>
        </div>

        {/* 底部工具列 (膠囊狀) */}
        <div className="nd-footer-wrapper">
          <div className="nd-tools">
            <button aria-label="清單"><ListChecks size={24} /></button>
            <button aria-label="附件"><Paperclip size={24} /></button>
            <button aria-label="字體"><Type size={24} /></button>
          </div>
          <button aria-label="編輯" className="nd-edit-btn">
            <SquarePen size={24} />
          </button>
        </div>
      </div>
    );
  }

  // 👇 原本的列表頁面
  return (
    <div className="catalog-skin native-notes">
      {pinOpen && (
        <div className="nt-pin-modal">
          <div className="nt-pin-box">
            <LockKeyhole size={40} color="#e5a800" />
            <h2>已上鎖的備忘錄</h2>
            <p>請輸入密碼以查看此備忘錄</p>
            
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError(false);
              }}
              className={pinError ? "error" : ""}
            />
            
            {pinError && <span className="error-text">密碼錯誤，請再試一次</span>}
            
            <div className="nt-pin-actions">
              <button onClick={() => { setPinOpen(false); setSelectedNote(null); }}>
                取消
              </button>
              <button 
                className="confirm"
                onClick={() => {
                  if (selectedNote && pin === selectedNote.password) {
                    setPinOpen(false);
                    setPin("");
                    setUnlocked(true); // 👈 解鎖成功
                  } else {
                    setPinError(true);
                    setPin("");
                  }
                }}
              >
                解鎖
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="catalog-scroll">
        <div className="nt-top">
          <button className="nt-back">
            <ChevronLeft size={24} />
            資料夾
          </button>
          <button className="nt-more" aria-label="更多">
            <MoreHorizontal size={20} />
          </button>
        </div>
        {pinned.length > 0 && (
          <>
            <h3 className="nt-sec">已釘選</h3>
            <div className="nt-card nt-notes">{pinned.map(row)}</div>
          </>
        )}
        {groups.map((g) => (
          <div key={g.name}>
            <h3 className="nt-sec">{g.name}</h3>
            <div className="nt-card nt-notes">{g.list.map(row)}</div>
          </div>
        ))}
        <Empty items={items} />
      </div>

      <div className="nt-footer">
        <span className="nt-count">{items.length} 則備忘錄</span>
        <button aria-label="新建備忘錄">
          <SquarePen size={24} />
        </button>
      </div>
    </div>
  );
}

//日曆//
const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDateKey = (year: number, monthIndex: number, day: number) =>
    `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

// 日本星期名稱（以星期日為索引 0）
const WEEKDAY_LABELS = ["日","月","火","水", "木", "金", "土",];

export function CalendarSkin(p: Props) {
    const now = useMemo(() => new Date(), []);
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth(); // 0-11
    const todayDay = now.getDate();

    const [year, setYear] = useState(todayYear);
    const [month, setMonth] = useState(todayMonth);
    const [day, setDay] = useState(todayDay);
    const [showAll, setShowAll] = useState(false);
    // 日期滾輪選擇器
const [showDatePicker, setShowDatePicker] = useState(false);

const [draftYear, setDraftYear] = useState(year);
const [draftMonth, setDraftMonth] = useState(month + 1);
const [draftDay, setDraftDay] = useState(day);

const yearWheelRef = useRef<HTMLDivElement>(null);
const monthWheelRef = useRef<HTMLDivElement>(null);
const dayWheelRef = useRef<HTMLDivElement>(null);

const pickerYears = Array.from(
    { length: 201 },
    (_, i) => 1900 + i
);

const pickerMonths = Array.from(
    { length: 12 },
    (_, i) => i + 1
);

const pickerDays = Array.from(
    { length: new Date(draftYear, draftMonth, 0).getDate() },
    (_, i) => i + 1
);
// 開啟時，將目前日期定位到滾輪中央
useEffect(() => {
    if (!showDatePicker) return;

    const scrollToValue = (
        ref: React.RefObject<HTMLDivElement | null>,
        index: number
    ) => {
        if (ref.current) {
            ref.current.scrollTop = index * 56;
        }
    };

    scrollToValue(
        yearWheelRef,
        pickerYears.indexOf(draftYear)
    );

    scrollToValue(
        monthWheelRef,
        draftMonth - 1
    );

    scrollToValue(
        dayWheelRef,
        draftDay - 1
    );
}, [showDatePicker]);

// 年月改變時，避免日期超出當月天數
useEffect(() => {
    const maxDay = new Date(
        draftYear,
        draftMonth,
        0
    ).getDate();

    setDraftDay((prev) => Math.min(prev, maxDay));
}, [draftYear, draftMonth]);

// 確認選擇日期
const confirmDate = () => {
    setYear(draftYear);
    setMonth(draftMonth - 1);
    setDay(draftDay);
    setShowAll(false);
    setShowDatePicker(false);
};

// 開啟日期選擇器
const openDatePicker = () => {
    setDraftYear(year);
    setDraftMonth(month + 1);
    setDraftDay(day);
    setShowDatePicker(true);
};

    const selectedKey = formatDateKey(year, month, day);
    const isViewingToday =
        year === todayYear && month === todayMonth && day === todayDay;

    const datesWithEvents = useMemo(() => {
        const set = new Set<string>();
        for (const item of p.items) {
            if (item.time.length >= 10) {
                set.add(item.time.slice(0, 10));
            }
        }
        return set;
    }, [p.items]);

    const list = useMemo(() => {
        if (showAll) {
            const monthPrefix = `${year}-${pad2(month + 1)}`;
            return p.items
                .filter((i) => i.time.startsWith(monthPrefix))
                .sort((a, b) => a.time.localeCompare(b.time));
        }
        return p.items.filter((i) => i.time.startsWith(selectedKey));
    }, [p.items, selectedKey, showAll, year, month]);

    const move = (deltaMonth: number) => {
        const nextDate = new Date(year, month + deltaMonth, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = nextDate.getMonth();
        const maxDay = new Date(nextYear, nextMonth + 1, 0).getDate();

        setYear(nextYear);
        setMonth(nextMonth);
        setDay((prev) => Math.min(prev, maxDay));
        setShowAll(false);
    };

    const goToday = () => {
        setYear(todayYear);
        setMonth(todayMonth);
        setDay(todayDay);
        setShowAll(false);
    };

    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <div className="catalog-skin native-calendar">
            <div className="catalog-scroll">
                <div className="month-title">
                    <div className="month-nav">
                        <button
                            type="button"
                            aria-label="上個月"
                            onClick={() => move(-1)}
                        >
                            <ChevronLeft />
                        </button>
<button
    type="button"
    className="date-picker-trigger"
    onClick={openDatePicker}
>
    {year} 年 {month + 1} 月
</button>
                        <button
                            type="button"
                            aria-label="下個月"
                            onClick={() => move(1)}
                        >
                            <ChevronRight />
                        </button>
                    </div>
                    {!isViewingToday && (
                        <button
                            type="button"
                            className="today-btn"
                            aria-label="回到今天"
                            onClick={goToday}
                        >
                            今天
                        </button>
                    )}
                </div>
                 {showDatePicker && (
    <div className="date-picker-overlay">
        <div className="date-picker-modal">

            <div className="date-picker-heading">
                <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                >
                    取消
                </button>

                <strong>選擇日期</strong>

                <button
                    type="button"
                    onClick={confirmDate}
                >
                    確定
                </button>
            </div>

            <div className="date-wheel-container">

                {/* 年 */}
                <div
                    className="date-wheel"
                    ref={yearWheelRef}
                    onScroll={(e) => {
                        const index = Math.round(
                            e.currentTarget.scrollTop / 56
                        );

                        if (pickerYears[index] !== undefined) {
                            setDraftYear(pickerYears[index]);
                        }
                    }}
                >
                    {pickerYears.map((v) => (
                        <div
                            key={v}
                            className={
                                draftYear === v
                                    ? "date-wheel-item active"
                                    : "date-wheel-item"
                            }
                        >
                            {v}年
                        </div>
                    ))}
                </div>

                {/* 月 */}
                <div
                    className="date-wheel"
                    ref={monthWheelRef}
                    onScroll={(e) => {
                        const index = Math.round(
                            e.currentTarget.scrollTop / 56
                        );

                        if (pickerMonths[index] !== undefined) {
                            setDraftMonth(pickerMonths[index]);
                        }
                    }}
                >
                    {pickerMonths.map((v) => (
                        <div
                            key={v}
                            className={
                                draftMonth === v
                                    ? "date-wheel-item active"
                                    : "date-wheel-item"
                            }
                        >
                            {v}月
                        </div>
                    ))}
                </div>

                {/* 日 */}
                <div
                    className="date-wheel"
                    ref={dayWheelRef}
                    onScroll={(e) => {
                        const index = Math.round(
                            e.currentTarget.scrollTop / 56
                        );

                        if (pickerDays[index] !== undefined) {
                            setDraftDay(pickerDays[index]);
                        }
                    }}
                >
                    {pickerDays.map((v) => (
                        <div
                            key={v}
                            className={
                                draftDay === v
                                    ? "date-wheel-item active"
                                    : "date-wheel-item"
                            }
                        >
                            {v}日
                        </div>
                    ))}
                </div>

                <div className="date-wheel-highlight" />

            </div>
        </div>
    </div>
)}
                <div className="calendar-grid">
                   {["月", "火", "水", "木", "金", "土", "日"].map((label) => (
                   <small key={label}>{label}</small>
                    ))}
                    {Array.from({ length: firstDayOfWeek }, (_, i) => (
                        <span key={`blank-${i}`} aria-hidden="true" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const d = i + 1;
                        const key = formatDateKey(year, month, d);
                        const isToday =
                            year === todayYear &&
                            month === todayMonth &&
                            d === todayDay;
                        const isSelected = !showAll && day === d;
                        const hasEvent = datesWithEvents.has(key);

                        const classNames = [
                            isToday ? "today" : "",
                            isSelected ? "selected" : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <button
                                type="button"
                                key={key}
                                className={classNames || undefined}
                                aria-current={isToday ? "date" : undefined}
                                onClick={() => {
                                    setDay(d);
                                    setShowAll(false);
                                }}
                            >
                                {d}
                                {hasEvent && <i />}
                            </button>
                        );
                    })}
                </div>

                <div className="agenda-header">
                    <h4>
                        {showAll
                            ? `${month + 1}月全部行程`
                            : `${month + 1}月${day}日`}
                    </h4>
                    <button
                        type="button"
                        className="show-all-btn"
                        onClick={() => setShowAll((prev) => !prev)}
                    >
                        {showAll ? "返回" : "顯示全部"}
                    </button>
                </div>

                {list.map((item) => {
                    const itemDay = Number(item.time.slice(8, 10)) || day;
                    const itemWeekday =
                        WEEKDAY_LABELS[
                            new Date(year, month, itemDay).getDay()
                        ];
                    
                    return (
                        <button
                            type="button"
                            className="calendar-event"
                            key={item.id}
                            onClick={() => p.onItem(item)}
                        >
                            <div className="event-date-col">
                                <span className="event-day">{itemDay}</span>
                                <span className="event-weekday">
                                    {itemWeekday}
                                </span>
                            </div>
                            <div className="event-body">
                                <strong>{item.title}</strong>
                                <p>{meta(item, "location", item.body)}</p>
                            </div>
                        </button>
                    );
                })}

                <Empty
                    items={list}
                    label={showAll ? "本月沒有行程" : "當天沒有行程"}
                />
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
/* ===== 時鐘 ===== */
const CLOCK_HOME_TZ = "Asia/Tokyo"; // 手機本機時區，世界時鐘的時差以它為基準

const ckPad = (n: number) => String(n).padStart(2, "0");

// 取得某時區「牆上時間」（當成 UTC 毫秒數，方便比較）
function ckWall(tz: string, d = new Date()) {
  try {
    const p: Record<string, number> = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(d)
      .forEach((x) => {
        if (x.type !== "literal") p[x.type] = +x.value;
      });
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  } catch {
    return ckWall(CLOCK_HOME_TZ, d);
  }
}

const ckSwFmt = (ms: number) => {
  const c = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return ckPad(m) + ":" + ckPad(s) + "." + ckPad(c);
};

export function ClockSkin(p: Props) {
  const [tab, setTab] = useState<"world" | "alarm" | "sw">("world");
  const [flipped, setFlipped] = useSkinState<string[]>(p, "alarmFlip", []);
  const [sw, setSw] = useState({ run: false, t0: 0, acc: 0 });
  const [laps, setLaps] = useState<number[]>([]);
  const [, force] = useState(0);

  // 世界時鐘每秒更新；碼表每 40 毫秒更新
  useEffect(() => {
    const id = window.setInterval(
      () => force((n) => n + 1),
      tab === "sw" ? 40 : 1000,
    );
    return () => window.clearInterval(id);
  }, [tab]);

  const inFolder = (i: Item, names: string[]) => names.includes(i.folder);
  const cities = p.items.filter((i) => inFolder(i, ["世界時鐘"]));
  const alarms = p.items.filter((i) => inFolder(i, ["鬧鐘"]));

  const elapsed = sw.acc + (sw.run ? Date.now() - sw.t0 : 0);
  const lapSum = laps.reduce((a, b) => a + b, 0);

  const toggleAlarm = (id: string) =>
    setFlipped(
      flipped.includes(id) ? flipped.filter((x) => x !== id) : [...flipped, id],
    );

  const me = ckWall(CLOCK_HOME_TZ);

  const tabs = [
    { key: "world" as const, label: "世界時鐘", icon: Globe },
    { key: "alarm" as const, label: "鬧鐘", icon: AlarmClock },
    { key: "sw" as const, label: "碼表", icon: Timer },
  ];

  return (
    <div className="clock-ui independent-skin ckx">
      <div className="skin-scroll ckx-scroll">
        <div className="ckx-head">
          <h1>{tabs.find((t) => t.key === tab)?.label}</h1>
          {p.creator && tab !== "sw" && (
            <button aria-label="新增" onClick={p.onAdd}>
              <Plus size={26} />
            </button>
          )}
        </div>

{tab === "world" && (
  <>
    {/* 最上方：本機時區（東京標準時間）即時時鐘 */}
    {(() => {
      const homeNow = new Date(ckWall(CLOCK_HOME_TZ, new Date()));
      return (
        <div className="ckx-hero">
          <div className="ckx-hero-time">
            {ckPad(homeNow.getUTCHours())}:{ckPad(homeNow.getUTCMinutes())}:
            {ckPad(homeNow.getUTCSeconds())}
          </div>
          <div className="ckx-hero-tz">東京標準時間</div>
        </div>
      );
    })()}

    {/* 下方：圓角城市卡片列表 */}
    <div className="ckx-cards">
      {cities.map((c) => {
        const tz = c.meta?.timezone || CLOCK_HOME_TZ;
        const w = ckWall(tz);
        const d = new Date(w);
        const rawDiff = Math.round(((w - me) / 36e5) * 10) / 10;
        const day = Math.floor(w / 864e5) - Math.floor(me / 864e5);
        const dayText = day > 0 ? "明天" : day < 0 ? "昨天" : "今天";
        const diffText =
          rawDiff === 0
            ? "與當地時間相同"
            : `${rawDiff > 0 ? "快" : "慢"}${Math.abs(rawDiff)}小時，${dayText}`;

        return (
          <div className="ckx-card" key={c.id}>
            <div className="ckx-card-left">
              <b>{c.title}</b>
              <span>{diffText}</span>
            </div>
            <div className="ckx-card-time">
              {ckPad(d.getUTCHours())}:{ckPad(d.getUTCMinutes())}
            </div>
          </div>
        );
      })}
      {!cities.length && <p className="ckx-empty">沒有城市</p>}
    </div>
  </>
)}
        {tab === "alarm" && (
          <>
            {alarms.map((a) => {
              const base = a.meta?.on !== "false";
              const on = base !== flipped.includes(a.id);
              const time = a.meta?.time || a.body;
              return (
                <div className="ckx-row" key={a.id}>
                  <div>
                    <div className={"ckx-big" + (on ? "" : " off")}>{time}</div>
                    <span className="ckx-sub">
                      {a.title || "鬧鐘"}
                      {a.meta?.repeat ? "，" + a.meta.repeat : ""}
                    </span>
                  </div>
                  <button
                    className={"ckx-switch" + (on ? " on" : "")}
                    aria-label={on ? "關閉鬧鐘" : "開啟鬧鐘"}
                    onClick={() => toggleAlarm(a.id)}
                  >
                    <i />
                  </button>
                </div>
              );
            })}
            {!alarms.length && <p className="ckx-empty">沒有鬧鐘</p>}
          </>
        )}

        {tab === "sw" && (
          <div className="ckx-sw">
            <div className="ckx-sw-d">{ckSwFmt(elapsed)}</div>
            <div className="ckx-sw-b">
              <button
                className="g"
                onClick={() => {
                  if (sw.run) setLaps([...laps, elapsed - lapSum]);
                  else {
                    setSw({ run: false, t0: 0, acc: 0 });
                    setLaps([]);
                  }
                }}
              >
                {sw.run ? "計圈" : "重置"}
              </button>
              <button
                className={sw.run ? "r" : "gr"}
                onClick={() =>
                  sw.run
                    ? setSw({ run: false, t0: 0, acc: elapsed })
                    : setSw({ run: true, t0: Date.now(), acc: sw.acc })
                }
              >
                {sw.run ? "停止" : "開始"}
              </button>
            </div>
            <div className="ckx-sw-l">
              {[...laps]
                .map((l, i) => ({ l, n: i + 1 }))
                .reverse()
                .map(({ l, n }) => (
                  <div key={n}>
                    <span>第 {n} 圈</span>
                    <span>{ckSwFmt(l)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <nav className="ckx-nav">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "on" : ""}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={24} />
            <small>{t.label}</small>
          </button>
        ))}
      </nav>
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
  const isMusicAppSong = items.some((i) => i.id === song?.id);
  // 如果當前播放的歌不是 Apple Music 的，而且正在播放，就自動暫停
  useEffect(() => {
    if (song && !isMusicAppSong && playing) {
      playerToggle();
    }
  }, [song?.id, isMusicAppSong, playing]);

  const [opened, setOpened] = useState<string[]>([]);
  const [ask, setAsk] = useState<Item | null>(null);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [shake, setShake] = useState(false);
  const pwOf = (i: Item) => String(i.meta?.password || "");
  const isFree = (i: Item) => !pwOf(i) || opened.includes(i.id);

  useEffect(() => {
    if (pwError) {
      const timer = setTimeout(() => setPwError(""), 5000);
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

  const currentTabItems = items.filter((i) => {
    if (tab === "搜尋") {
      return (i.title + i.sender).toLowerCase().includes(q.toLowerCase());
    }
    return i.meta?.folder === tab;
  });
  // 已解鎖或沒上鎖的歌，才可以進播放清單
  const freeItems = currentTabItems.filter(isFree);

  const play = (i: Item) => {
    if (!isFree(i)) {
      setAsk(i);
      setPw("");
      setPwError("");
      return;
    }
    chooseTrack(p, i, freeItems);
  };

  const shuffle = () => {
    if (freeItems.length) {
      chooseTrack(
        p,
        freeItems[Math.floor(Math.random() * freeItems.length)],
        freeItems,
      );
    }
  };

  const submit = () => {
    if (!ask || !pw) return;
    if (pw === pwOf(ask)) {
      const next = [...opened, ask.id];
      setOpened(next);
      chooseTrack(
        p,
        ask,
        currentTabItems.filter((x) => !pwOf(x) || next.includes(x.id)),
      );
      setAsk(null);
      setPw("");
      setPwError("");
    } else {
      setPwError("密碼錯誤，請再試一次");
      setPw("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const row = (i: Item) => (
      <button
      className={"am-row" + (isFree(i) ? "" : " locked")}
      key={i.id}
      onClick={() => play(i)}
    >
      {art(i)}
      <span className={"am-title" + (song?.id === i.id ? " on" : "")}>
        {i.title}
        <small>{i.sender}</small>
      </span>
      {!isFree(i) && <Lock size={15} className="am-lock-ico" />}
      <span className="am-more">⋯</span>
    </button>
  );

  return (
    <div
      className="catalog-skin native-music am"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Header p={p} />

      <div style={{ flex: 1, position: "relative" }}>
        <div className="catalog-scroll am-scroll" style={{ height: "100%" }}>
          {tab === "收藏庫" && <>{currentTabItems.map(row)}</>}

          {tab === "立即聆聽" && (
            <>
              <div className="am-actions">
                <button onClick={() => freeItems[0] && play(freeItems[0])}>
                  <Play size={15} fill="currentColor" /> 播放
                </button>
                <button onClick={shuffle}>
                  <Shuffle size={15} /> 隨機播放
                </button>
              </div>
              {currentTabItems.map(row)}
            </>
          )}

          {tab === "搜尋" && (
            <>
              <SearchBox value={q} set={setQ} />
              {currentTabItems.map(row)}
            </>
          )}

          <Empty items={currentTabItems} />
        </div>
      </div>

      {/* 迷你播放條 */}
      {song && isMusicAppSong && !full && (
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
            {playing ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" />
            )}
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

      {full && isMusicAppSong && <AMNowPlaying close={() => setFull(false)} />}

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

      {/* 輸入密碼視窗 */}
      {ask && (
        <div className="am-pw-mask" onClick={() => setAsk(null)}>
          <form
            className={"am-pw" + (shake ? " shake" : "")}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Lock size={28} />
            <h3>此歌曲已上鎖</h3>
            {ask.meta?.hint && <small>提示：{String(ask.meta.hint)}</small>}
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="輸入密碼"
              autoFocus
            />
            <div className="am-pw-err">{pwError}</div>
            <div className="am-pw-btns">
              <button type="button" onClick={() => setAsk(null)}>
                取消
              </button>
              <button type="submit">解鎖</button>
            </div>
          </form>
        </div>
      )}
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
    return (
        <div className="catalog-skin native-wallet">
            <Header p={p} />
            <div className="catalog-scroll">
                <div className="wallet-title">
                    <h1>錢包</h1>
                    <button aria-label="新增卡片">
                        <CirclePlus size={30} strokeWidth={1.6} />
                    </button>
                </div>

                <div className="wallet-stack">
                    <div className="wallet-card">
                        <img
                            src="/wallet.png"
                            alt="銀行卡"
                        />
                    </div>
                </div>
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