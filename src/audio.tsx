import { type CSSProperties } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import {
  fmtTime,
  playerMute,
  playerSeek,
  playerToggle,
  usePlayer,
} from "./player";

export function AudioPlayer() {
  const { playing, pos, dur, muted } = usePlayer();
  return (
    <div className="audio-pill">
      <button aria-label={playing ? "暫停" : "播放"} onClick={playerToggle}>
        {playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </button>
      <span className="audio-time">
        {fmtTime(pos)} / {fmtTime(dur)}
      </span>
      <input
        className="audio-seek"
        type="range"
        aria-label="播放進度"
        min={0}
        max={dur || 0}
        step={0.1}
        value={pos}
        style={{ "--pct": dur ? (pos / dur) * 100 + "%" : "0%" } as CSSProperties}
        onChange={(e) => playerSeek(Number(e.target.value))}
      />
      <button aria-label={muted ? "取消靜音" : "靜音"} onClick={playerMute}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}