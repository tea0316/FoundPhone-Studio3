import type { Item } from "./schema";
import type { LineStory } from "./lineStory";


export type Contact = {
  name: string; // 好友名字；群組就是群組名稱
  avatar?: string; // 一對一好友的頭像
  avatars?: Record<string, string>; // 群組：成員名字 → 頭像
  pinned?: boolean; // 置頂
  history: string; // 舊訊息（寫法看上面）
  story?: LineStory; // 劇本播放（可不寫，寫法同 lineStory.ts）
};

// ==================== 在這裡加好友與群組 ====================
export const CONTACTS: Contact[] = [
  {
    name: "對方",
    history: `
      ## 2026-10-25
      12:00 對方：你好
    `,
    story: {
      timing: {
        firstMessageDelay: 1000,
        readDelay: 800,
        replyDelay: 1200,
      },
      opening: [
        "你在嗎？",
        { type: "image", src: "/chat/1.png" },
        { type: "voice", src: "/chat/hello.mp3", seconds: 7 },
        "我有事想跟你說",
      ],
      rounds: [
        {
          mine: ["在啊", "怎麼了？"],
          incoming: ["我今天看到一個東西", "有點嚇到"],
        },
        {
          mine: ["看到什麼？"],
          readDelay: 5000, // 這一輪對方很晚才已讀
          replyDelay: 4000,
          incoming: ["見面再說吧", "晚點聯絡你"],
        },
      ],
    },
  },
  {
    name: "小美",
    avatar: "/avater/xiaomei.jpg",
    history: `
      ## 2026-10-24
      20:00 小美：週末有空嗎？
      20:03 我：有，要去哪？
      20:05 小美：晚點再跟你說
    `,
  },
  {
    name: "週末小隊",
    pinned: true,
    avatars: {
      小明: "/avater/xiaoming.jpg",
      小華: "/avater/xiaohua.jpg",
    },
    history: `
      ## 2026-10-26
      18:30 小明：今天誰要來？
      18:31 小華：我我我
      18:33 我：我晚點到
      18:34 [系統] 小明邀請了小華加入群組
    `,
  },
];
// ============================================================

const MEDIA = /^\[(圖片|貼圖|語音)\s+(\S+?)(?:\s+(\d+))?\]$/;

function parse(c: Contact): Item[] {
  const out: Item[] = [];
  let day = "";
  let n = 0;
  for (const raw of c.history.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const head = line.match(/^##\s*(\d{4}-\d{2}-\d{2})$/);
    if (head) {
      day = head[1];
      continue;
    }
    const m = line.match(/^(\d{4}-\d{2}-\d{2}\s+)?(\d{1,2}:\d{2})\s+(.*)$/);
    if (!m) continue;
    if (m[1]) day = m[1].trim();
    const time = `${day} ${m[2].padStart(5, "0")}`;
    const rest = m[3];

    let sender = c.name;
    let body = "";
    let kind: Item["kind"] = "text";
    let media = "";
    let meta: Record<string, string> = {};
    let outgoing = false;

    if (rest.startsWith("[系統]")) {
      kind = "system";
      body = rest.slice(4).trim();
    } else {
      const s = rest.match(/^(.+?)[：:]\s*(.*)$/);
      if (!s) continue;
      sender = s[1].trim();
      outgoing = sender === "我";
      const content = s[2].trim();
      const mm = content.match(MEDIA);
      if (mm) {
        media = mm[2];
        if (mm[1] === "語音") {
          kind = "audio";
          meta = { voice: "1", seconds: mm[3] ?? "5" };
        } else {
          kind = "image";
          if (mm[1] === "貼圖") meta = { sticker: "1" };
        }
      } else {
        body = content;
      }
    }

    if (c.pinned && n === 0) meta = { ...meta, pinned: "1" };
    out.push({
      id: `h-${c.name}-${n++}`,
      title: c.name,
      body,
      richText: "",
      meta,
      time,
      sender,
      avatar: outgoing ? "" : (c.avatars?.[sender] ?? c.avatar ?? ""),
      kind,
      media,
      hidden: false,
      unlock: "",
      password: "",
      folder: "",
      favorite: false,
      outgoing,
      read: true,
      likes: 0,
      comments: [],
    });
  }
  return out;
}

// 所有舊訊息（給聊天室、聊天列表、好友列表用）
export const HISTORY_ITEMS: Item[] = CONTACTS.flatMap(parse);

// 通知用的頭像：聊天室名稱 → 圖片
export const CONTACT_AVATARS: Record<string, string> = Object.fromEntries(
  CONTACTS.flatMap((c) => {
    const a = c.avatar ?? Object.values(c.avatars ?? {})[0];
    return a ? [[c.name, a] as [string, string]] : [];
  }),
);
