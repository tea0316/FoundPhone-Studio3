import { useEffect, useState } from "react";

export type LiveWeather = {
  temperature: string;
  high: string;
  low: string;
  condition: string;
  aqi: string;
  aqiLabel: string;
  rain: string;
  wind: string;
  sunrise: string;
  sunset: string;
  uv: string;
  code: number;
  isDay: boolean;
    hourly: {
    time: string;
    temperature: number;
    code: number;
    rain: number;
    wind: number;
  }[];
  daily: { label: string; low: number; high: number; code: number }[];
};

export function conditionText(code: number) {
  if (code === 0) return "晴";
  if (code === 1) return "大致晴朗";
  if (code === 2) return "晴時多雲";
  if (code === 3) return "陰";
  if (code === 45 || code === 48) return "霧";
  if (code >= 51 && code <= 57) return "毛毛雨";
  if (code >= 61 && code <= 67) return "雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "陣雨";
  if (code === 85 || code === 86) return "陣雪";
  if (code >= 95) return "雷雨";
  return "—";
}

function aqiLabel(n: number) {
  if (n <= 50) return "良好";
  if (n <= 100) return "普通";
  if (n <= 150) return "對敏感族群不健康";
  if (n <= 200) return "不健康";
  if (n <= 300) return "非常不健康";
  return "危險";
}

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

async function load(lat: string, lon: string, tz: string): Promise<LiveWeather> {
  const z = encodeURIComponent(tz);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,is_day` +
    `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max` +
    `&timezone=${z}&forecast_days=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather " + res.status);
  const w = await res.json();

  let aqi = "—";
  let label = "空氣品質";
  try {
    const r = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=${z}`,
    );
    const a = await r.json();
    const n = Math.round(a.current.us_aqi);
    if (Number.isFinite(n)) {
      aqi = String(n);
      label = aqiLabel(n);
    }
  } catch {
    /* 空氣品質失敗就維持 — */
  }

  const nowHour = String(w.current.time).slice(0, 13) + ":00";
  const start = Math.max(0, w.hourly.time.findIndex((t: string) => t >= nowHour));
  const hourly = Array.from({ length: 6 }, (_, i) => {
    const k = start + i;
    return {
      time: i === 0 ? "現在" : Number(String(w.hourly.time[k]).slice(11, 13)) + "時",
      temperature: Math.round(w.hourly.temperature_2m[k]),
      code: w.hourly.weather_code[k] as number,
      rain: Math.round(w.hourly.precipitation_probability[k] ?? 0),
      wind: Math.round(w.hourly.wind_speed_10m[k] ?? 0),
    };
 });
  const daily = (w.daily.time as string[]).slice(0, 7).map((d, i) => ({
    label: i === 0 ? "今日" : WEEK[new Date(d + "T12:00:00").getDay()],
    low: Math.round(w.daily.temperature_2m_min[i]),
    high: Math.round(w.daily.temperature_2m_max[i]),
    code: w.daily.weather_code[i] as number,
  }));

  return {
    temperature: String(Math.round(w.current.temperature_2m)),
    high: String(daily[0].high),
    low: String(daily[0].low),
    condition: conditionText(w.current.weather_code),
    aqi,
    aqiLabel: label,
    rain: Math.round(w.hourly.precipitation_probability[start] ?? 0) + "%",
    wind: Math.round(w.current.wind_speed_10m) + " Km/時",
    sunrise: String(w.daily.sunrise[0]).slice(11, 16),
    sunset: String(w.daily.sunset[0]).slice(11, 16),
    uv: String(Math.round(w.daily.uv_index_max[0] ?? 0)),
    code: w.current.weather_code,
    isDay: w.current.is_day === 1,
    hourly,
    daily,
  };
}

const cache = new Map<string, { at: number; data: LiveWeather }>();

function fromCache(lat?: string, lon?: string, tz = "auto") {
  if (!lat || !lon) return null;
  const hit = cache.get(`${lat},${lon},${tz}`);
  return hit && Date.now() - hit.at < 10 * 60 * 1000 ? hit.data : null;
}

export function useLiveWeather(lat?: string, lon?: string, tz = "auto") {
  const [data, setData] = useState<LiveWeather | null>(() =>
    fromCache(lat, lon, tz),
  );
  useEffect(() => {
    if (!lat || !lon) {
      setData(null);
      return;
    }
    const key = `${lat},${lon},${tz}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
      setData(hit.data);
      return;
    }
    let alive = true;
    load(lat, lon, tz)
      .then((d) => {
        cache.set(key, { at: Date.now(), data: d });
        if (alive) setData(d);
      })
      .catch(() => {
        /* 失敗就用 story.json 的備用數字 */
      });
    return () => {
      alive = false;
    };
  }, [lat, lon, tz]);
  return data;
}