import { CONTACTS } from "./lineContacts";
export type Timing = {
  firstMessageDelay: number;
  readDelay: number;
  replyDelay: number;
  typingMs: number;
  gapMs: number;
};

export const DEFAULT_TIMING: Timing = {
  firstMessageDelay: 1000,
  readDelay: 1200,
  replyDelay: 1500,
  typingMs: 900,
  gapMs: 700,
};
// 一句話可以是：文字、圖片、貼圖、語音
export type Line =
  | string
  | { type: "image" | "sticker"; src: string }
  | { type: "voice"; src?: string; seconds?: number };

export type LineRound = {
  mine: string[];
  incoming: Line[];
  readDelay?: number; // 這一輪單獨設定（可不寫）
  replyDelay?: number; // 這一輪單獨設定（可不寫）
};

export type LineStory = {
  opening: Line[];
  rounds: LineRound[];
  timing?: Partial<Timing>; // 這個對象的時間（沒寫的用預設）
};

export const LINE_STORIES: Record<string, LineStory> = {};

for (const c of CONTACTS) {
  if (c.story) LINE_STORIES[c.name] = c.story;
}