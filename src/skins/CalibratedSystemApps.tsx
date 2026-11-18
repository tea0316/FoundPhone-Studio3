import { useState } from "react";
import {
  Heart,
  Users,
  Grid2X2,
  Flame,
  Bed,
  Footprints,
  ChevronRight,
  ChevronLeft,
  User,
  MoonStar,
  Sunrise,
  CloudSun,
  Droplet,
  Wind,
  Cloud,
  Activity,
Sun,
CloudRain,
Snowflake,
CloudLightning,
Sunset,
CloudMoon,
} from "lucide-react";
import { useSkinState } from "../skinState";
import type { Item } from "../schema";
import { meta, type Props } from "./shared";
import { useLiveWeather } from "../liveWeather";
import "../ios/native-apps.css";
const healthTypes = [
  { id: "cycle", title: "經期追蹤", icon: Activity, color: "#7361ff" },
  { id: "activity", title: "健身記錄", icon: Flame, color: "#ff5900" },
  { id: "sleep", title: "睡眠評分", icon: Bed, color: "#7361ff" },
  { id: "steps", title: "步數", icon: Footprints, color: "#ff5900" },
];
function seriesFor(item: Item | undefined) {
  try {
    const values = JSON.parse(meta(item, "series", "[]"));
    return Array.isArray(values)
      ? values
          .filter((v) => typeof v === "number" && Number.isFinite(v) && v >= 0)
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
function recordFor(items: Item[], key: string) {
  const map: Record<string, string[]> = {
    cycle: ["經期", "生理期"],
    activity: ["活動", "健身"],
    sleep: ["睡眠"],
    steps: ["步數"],
  };
  return items.find((i) =>
    map[key].some((s) => meta(i, "metric", i.title).includes(s)),
  );
}
export function HealthSkin(p: Props) {
  const [tab, setTab] = useSkinState<string>(p, "tab", "摘要"),
    [pins, setPins] = useSkinState<string[]>(
      p,
      "pins",
      p.items.some((i) => recordFor([i], "cycle"))
        ? ["cycle", "activity", "sleep", "steps"]
        : ["activity", "sleep", "steps"],
    );
  const [editing, setEditing] = useState(false),
    [detail, setDetail] = useState(""),
    [profile, setProfile] = useState(false);
  const current = recordFor(p.items, detail);
  const open = (key: string) => {
    const i = recordFor(p.items, key);
    if (i && p.creator) {
      p.onItem(i);
      return;
    }
    if (i?.password) {
      p.onItem(i);
      return;
    }
    if (i) p.onRead(i.id);
    setDetail(key);
  };
  return (
    <div className="catalog-skin native-health calibrated-health">
      <header className="health-native-nav">
        {detail || profile ? (
          <button
            aria-label="返回健康摘要"
            onClick={() => {
              setDetail("");
              setProfile(false);
            }}
          >
            <ChevronLeft />
          </button>
        ) : (
          <span />
        )}
        <strong>
          {detail
            ? healthTypes.find((x) => x.id === detail)?.title
            : profile
              ? "健康詳細檔案"
              : tab}
        </strong>
        <button
          aria-label="健康檔案"
          onClick={() => (p.creator ? p.onAdd() : setProfile(true))}
        >
          <User size={23} />
        </button>
      </header>
      <div className="health-native-scroll">
        {profile ? (
          <>
            <h1>健康詳細檔案</h1>
            <section className="health-profile-empty">
              <User size={45} />
              <h2>{p.owner || "機主"}</h2>
              <p>尚未設定更多檔案</p>
            </section>
          </>
        ) : detail ? (
          <>
            <div className="health-periods">
              {["日", "週", "月", "6個月", "年"].map((x) => (
                <button
                  key={x}
                  onClick={(e) => {
                    e.currentTarget.parentElement
                      ?.querySelectorAll("button")
                      .forEach((b) => b.removeAttribute("data-selected"));
                    e.currentTarget.dataset.selected = "true";
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
            <p className="health-detail-value">
              {current ? meta(current, "value", "—") : "無資料"}{" "}
              <small>{current ? meta(current, "unit") : ""}</small>
            </p>
            <div className="health-detail-chart" aria-label="健康記錄圖表">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    height:
                      seriesFor(current)[i] !== undefined
                        ? `${Math.max(2, (seriesFor(current)[i] / Math.max(...seriesFor(current), 1)) * 100)}%`
                        : "3px",
                  }}
                />
              ))}
            </div>
            <section className="health-detail-description">
              <h2>記錄</h2>
              {current ? (
                <>
                  <p>{current.body}</p>
                  <small>{current.time}</small>
                </>
              ) : (
                <p>暫無資料</p>
              )}
            </section>
          </>
        ) : tab === "摘要" ? (
          <>
            <div className="health-section-title">
              <h2>釘選</h2>
              <button onClick={() => setEditing(!editing)}>
                {editing ? "完成" : "編輯"}
              </button>
            </div>
            {editing && (
              <div className="health-pin-editor">
                {healthTypes.map((t) => (
                  <label key={t.id}>
                    <input
                      type="checkbox"
                      checked={pins.includes(t.id)}
                      onChange={() =>
                        setPins(
                          pins.includes(t.id)
                            ? pins.filter((x) => x !== t.id)
                            : [...pins, t.id],
                        )
                      }
                    />
                    {t.title}
                  </label>
                ))}
              </div>
            )}
            <div className="health-cards">
              {pins.map((id) => {
                const t = healthTypes.find((t) => t.id === id);
                if (!t) return null;
                const i = recordFor(p.items, id);
                const Icon = t.icon;
                return (
                  <button
                    key={id}
                    className={"health-native-card health-card-" + id}
                    onClick={() => open(id)}
                  >
                    <header style={{ color: t.color }}>
                      <Icon size={19} />
                      <strong>{t.title}</strong>
                      <time>{i?.time.slice(5, 10) || ""}</time>
                      <ChevronRight size={18} />
                    </header>
                    {id === "activity" ? (
                      <div className="health-activity-values">
                        {[
                          ["活動", "active", "大卡"],
                          ["體能訓練", "exercise", "分鐘"],
                          ["站立", "stand", "小時"],
                        ].map(([name, key, unit], n) => (
                          <div
                            key={key}
                            style={{
                              color: ["#ff2d55", "#54c900", "#00b2d9"][n],
                            }}
                          >
                            <small>{name}</small>
                            <p>
                              <b>{i ? meta(i, key, "—") : "—"}</b>
                              <span>{unit}</span>
                            </p>
                          </div>
                        ))}
                        <div className="activity-rings">
                          <i />
                          <i />
                          <i />
                        </div>
                      </div>
                    ) : (
                      <div className="health-card-bottom">
                        <div>
                          <b>
                            {i
                              ? meta(i, "value", i.body || "無資料")
                              : "無資料"}
                          </b>
                          <span>{i ? meta(i, "unit") : ""}</span>
                        </div>
                        {id === "steps" && (
                          <div className="health-spark" aria-hidden="true">
                            {Array.from({ length: 7 }, (_, n) => (
                              <i
                                key={n}
                                style={{
                                  height:
                                    seriesFor(i)[n] !== undefined
                                      ? `${Math.max(3, (seriesFor(i)[n] / Math.max(...seriesFor(i), 1)) * 45)}px`
                                      : "8px",
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button className="health-all-row" onClick={() => setTab("瀏覽")}>
              <Heart color="#ff2d55" />
              顯示所有健康資料
              <ChevronRight />
            </button>
            <h2 className="health-trends-title">趨勢</h2>
            <div className="health-trends-empty">
              {p.items.length ? "查看健康資料中的記錄" : "暫無趨勢"}
            </div>
          </>
        ) : tab === "共享" ? (
          <section className="health-sharing">
            <Users size={54} />
            <h2>分享健康資料</h2>
            <p>尚未分享資料</p>
            {p.items
              .filter((i) => i.folder === "共享")
              .map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  {i.title}
                </button>
              ))}
          </section>
        ) : (
          <>
            <h1>瀏覽</h1>
            {healthTypes.map((t) => (
              <button
                key={t.id}
                className="health-browse-row"
                onClick={() => open(t.id)}
              >
                <t.icon size={22} color={t.color} />
                {t.title}
                <ChevronRight />
              </button>
            ))}
            {p.items
              .filter((i) => !healthTypes.some((t) => recordFor([i], t.id)))
              .map((i) => (
                <button
                  className="health-browse-row"
                  key={i.id}
                  onClick={() => p.onItem(i)}
                >
                  {i.title}
                  <ChevronRight />
                </button>
              ))}
          </>
        )}
      </div>
      {!detail && !profile && (
        <nav className="health-floating-tabs">
          {[
            [Heart, "摘要"],
            [Users, "共享"],
            [Grid2X2, "瀏覽"],
          ].map(([Icon, label]) => {
            const Glyph = Icon as typeof Heart;
            return (
              <button
                key={String(label)}
                className={tab === label ? "selected" : ""}
                onClick={() => setTab(String(label))}
              >
                <Glyph size={25} />
                <span>{String(label)}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
function listMeta(
  item: Item | undefined,
  key: string,
): {
  time?: string;
  temperature?: string;
  low?: string;
  high?: string;
  label?: string;
  code?: number;
  rain?: number;
  wind?: number;
}[] {
  try {
    const v = JSON.parse(meta(item, key, "[]"));
    return Array.isArray(v)
      ? v
          .filter(
            (x) =>
              x &&
              typeof x === "object" &&
              Object.values(x).every(
                (v) => typeof v === "string" || typeof v === "number",
              ),
          )
          .slice(0, 12)
      : [];
  } catch {
    return [];
  }
}
function skyIcon(code: number | undefined, night = false) {
  if (code === undefined) return night ? MoonStar : CloudSun;
  if (code >= 95) return CloudLightning;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return Snowflake;
  if (code === 3 || code === 45 || code === 48) return Cloud;
  if (code === 2) return night ? CloudMoon : CloudSun;
  return night ? MoonStar : Sun;
}
function hourIcon(h: { time?: string; code?: number } | undefined) {
  const label = h?.time ?? "";
  const hour = label.endsWith("時") ? parseInt(label) : new Date().getHours();
  const Icon = skyIcon(h?.code, hour >= 18 || hour < 6);
  return <Icon size={28} />;
}
function dayIcon(code: number | undefined) {
  const Icon = skyIcon(code);
  return <Icon size={23} />;
}
export function WeatherSkin(p: Props) {
  const [index] = useSkinState<number>(p, "city", 0),
    [mode, setMode] = useState("temperature"),
    [, setSheet] = useState("");
     const base = p.items[index] || p.items[0];
  const live = useLiveWeather(
    meta(base, "latitude", ""),
    meta(base, "longitude", ""),
    meta(base, "timezone", "auto"),
  );
  const item =
    live && base
      ? {
          ...base,
          meta: {
            ...base.meta,
            temperature: live.temperature,
            high: live.high,
            low: live.low,
            condition: live.condition,
            aqi: live.aqi,
            aqiLabel: live.aqiLabel,
            rain: live.rain,
            wind: live.wind,
            sunrise: live.sunrise,
            sunset: live.sunset,
            uv: live.uv,
            hourly: JSON.stringify(live.hourly),
            daily: JSON.stringify(live.daily),
          },
        }
      : base;
  const hourly = listMeta(item, "hourly"),
    daily = listMeta(item, "daily");
      const hourNow = new Date().getHours();
  const day = live ? live.isDay : hourNow >= 6 && hourNow < 18;
  const text = meta(item, "condition", "");
  const code = live?.code;
  const kind0 =
    code !== undefined
      ? code >= 95
        ? "storm"
        : (code >= 51 && code <= 67) || (code >= 80 && code <= 82)
          ? "rain"
          : (code >= 71 && code <= 77) || code === 85 || code === 86
            ? "snow"
            : code >= 2
              ? "cloud"
              : "clear"
      : text.includes("雷")
        ? "storm"
        : text.includes("雨")
          ? "rain"
          : text.includes("雪")
            ? "snow"
            : text.includes("陰") || text.includes("雲") || text.includes("霧")
              ? "cloud"
              : "clear";
                const waiting = !live && meta(base, "latitude", "") !== "";
  const kind = waiting ? "clear" : kind0;
  const sky = `${kind}-${day ? "day" : "night"}`;
  const SkyArt =
    kind === "clear"
      ? day
        ? Sun
        : MoonStar
      : kind === "cloud"
        ? Cloud
        : kind === "rain"
          ? CloudRain
          : kind === "snow"
            ? Snowflake
            : CloudLightning;
  const read = () => {
    if (item) {
      if (p.creator || item.password) p.onItem(item);
      else p.onRead(item.id);
    }
  };
    const lows = daily.map((d) => Number(d.low)).filter(Number.isFinite);
  const highs = daily.map((d) => Number(d.high)).filter(Number.isFinite);
  const lo = lows.length ? Math.min(...lows) : 0;
  const hi = highs.length ? Math.max(...highs) : 1;
  const span = Math.max(1, hi - lo);
  const uvNum = Number(meta(item, "uv", "—"));
  const uvText = !Number.isFinite(uvNum)
    ? "—"
    : uvNum <= 2
      ? "低"
      : uvNum <= 5
        ? "中等"
        : uvNum <= 7
          ? "高"
          : uvNum <= 10
            ? "很高"
            : "極高";
  return (
    <div
      className="catalog-skin native-weather calibrated-weather"
      data-empty={!item}
      data-sky={sky}
    >

      <div className="weather-stars" aria-hidden="true" />
      <div className="weather-native-scroll">
        <section className="weather-native-current">
          <small>{item ? meta(item, "locationLabel", "城市") : "天氣"}</small>
          <h1>{item?.title || "未新增城市"}</h1>
          <output>{meta(item, "temperature", "—")}°</output>
          <div className="weather-high-low">
            <span>最高 {meta(item, "high", "—")}°</span>
            <span>最低 {meta(item, "low", "—")}°</span>
          </div>
          <p>{meta(item, "condition", "暫無天氣資料")}</p>
          <SkyArt className="weather-moon-art" size={55} />
        </section>
        <button
          className="weather-native-card weather-air-quality"
          onClick={() => {
            read();
            setSheet("空氣品質");
          }}
        >
          <strong>
            {meta(item, "aqi", "—")} · {meta(item, "aqiLabel", "空氣品質")}
          </strong>
          <div className="weather-aqi-scale">
            <i
              style={{
                left: Number.isFinite(Number(meta(item, "aqi")))
                  ? Math.max(0, Math.min(95, Number(meta(item, "aqi")) / 5)) +
                    "%"
                  : "0%",
              }}
            />
          </div>
          <p>
            {item?.meta.aqi
              ? `目前 AQI (US) 為 ${item.meta.aqi}。`
              : "暫無空氣品質資料"}
          </p>
        </button>
        <section className="weather-native-card weather-hourly">
          <header>
            <div>
              <strong>天氣狀況</strong>
              <small>
                {mode === "temperature"
                  ? "氣溫 (°C)"
                  : mode === "rain"
                    ? "降雨機率"
                    : "風速 (公里/時)"}
              </small>
            </div>
            <div className="weather-mode-switch">
              {[
                [Cloud, "temperature"],
                [Droplet, "rain"],
                [Wind, "wind"],
              ].map(([Icon, key]) => {
                const Glyph = Icon as typeof Cloud;
                return (
                  <button
                    aria-label={String(key)}
                    aria-pressed={mode === key}
                    key={String(key)}
                    onClick={() => setMode(String(key))}
                  >
                    <Glyph size={18} />
                  </button>
                );
              })}
            </div>
          </header>
          <div className="weather-hour-grid">
            {Array.from({ length: 6 }, (_, n) => (
              <button
                key={n}
                onClick={() => {
                  read();
                  setSheet("逐小時天氣");
                }}
              >
                <strong>
                  {n === 5
                    ? day
                      ? "日落"
                      : "日出"
                    : hourly[n]?.time || ["現在", "—時", "—時", "—時", "—時"][n]}
                </strong>
                {n === 5 ? (
                  day ? (
                    <Sunset size={28} color="#ffb340" />
                  ) : (
                    <Sunrise size={28} color="#ffd60a" />
                  )
                ) : (
                  hourIcon(hourly[n])
                )}
                <span>
                  {n === 5
                    ? meta(item, day ? "sunset" : "sunrise", "—")
                    : mode === "temperature"
                      ? (hourly[n]?.temperature ?? "—") + "°"
                      : mode === "rain"
                        ? hourly[n]?.rain !== undefined
                          ? hourly[n].rain + "%"
                          : meta(item, "rain", "—")
                        : hourly[n]?.wind !== undefined
                          ? String(hourly[n].wind)
                          : meta(item, "wind", "—")}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="weather-native-card weather-days">
          {(daily.length
            ? daily
            : [
                {
                  label: "今天",
                  low: meta(item, "low", "—"),
                  high: meta(item, "high", "—"),
                },
              ]
          ).map((d, n) => (
            <button
              key={n}
              onClick={() => {
                read();
                setSheet("每日天氣");
              }}
            >
              <strong>{d.label || d.time || "—"}</strong>
              {dayIcon(n === 0 && live ? live.code : (d as { code?: number }).code)}
              <span>{d.low || "—"}°</span>
              <i className="wk-range">
                <u
                  style={{
                    left: ((Number(d.low) - lo) / span) * 100 + "%",
                    right: ((hi - Number(d.high)) / span) * 100 + "%",
                  }}
                />
              </i>
              <b>{d.high || "—"}°</b>
            </button>
          ))}
        </section>
        <div className="wk-pair">
          <section className="weather-native-card wk-card">
            <small>紫外線指數</small>
            <strong>{meta(item, "uv", "—")}</strong>
            <span>{uvText}</span>
          </section>
          <section className="weather-native-card wk-card">
            <small>日落</small>
            <strong>{meta(item, "sunset", "—")}</strong>
            <span>日出：{meta(item, "sunrise", "—")}</span>
          </section>
        </div>
      </div>
    </div>
  );
}