import { useState } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Share,
  Heart,
  Phone,
  MessageCircle,
  Video,
  Folder,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { RichText } from "../RichText";
import { dialRequest } from "../phoneDial";
import { safeMedia, type Item } from "../schema";

// 有「詳細頁」的 App 清單，外部可用來判斷是否走 NativeDetail
export const nativeDetailApps = new Set([
  "notes",
  "photos",
  "contacts",
  "phone",
  "calendar",
  "files",
  "safari",
]);

// 通用詳細頁：依 app 類型切換照片／聯絡人／備忘錄／行事曆／Safari／檔案預覽
export function NativeDetail({
  app,
  item,
  back,
}: {
  app: string;
  item: Item;
  back: () => void;
}) {
  // 收藏狀態、是否顯示動作選單、是否在模擬通話
  const [favorite, setFavorite] = useState(item.favorite),
    [copied, setCopied] = useState(false),
    [call, setCall] = useState(false);

  const media = safeMedia(item.media),
    // 依 app 決定導覽列左側返回按鈕要顯示的名稱
    name =
      app === "notes"
        ? "備忘錄"
        : app === "contacts"
          ? "聯絡人"
          : app === "photos"
            ? "所有照片"
            : app === "phone"
              ? "通話紀錄"
              : app === "calendar"
                ? "行事曆"
                : app === "files"
                  ? "瀏覽"
                  : "書籤";

  // 複製內文到剪貼簿；成功後顯示「已複製」
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={"native-detail native-detail-" + app}>
      {/* 頂部導覽列：返回、標題（照片顯示日期）、更多動作 */}
      <header className="app-nav">
        <button aria-label="返回" onClick={back}>
          <ChevronLeft size={24} />
          {name}
        </button>
        <strong>{app === "photos" ? item.time.slice(0, 10) : ""}</strong>
        <button aria-label="更多動作" onClick={() => setCopied(!copied)}>
          <MoreHorizontal size={23} />
        </button>
      </header>

      {/* 動作選單：複製文字／取消 */}
      {copied && (
        <div className="native-action-sheet">
          <button onClick={copy}>
            <Copy size={18} />
            複製文字
          </button>
          <button onClick={() => setCopied(false)}>取消</button>
        </div>
      )}

      {app === "photos" ? (
        // ── 照片：黑底顯示圖片，無圖則顯示文字說明；底部工具列可分享／收藏 ──
        <>
          <div className="native-photo-stage">
            {media ? (
              <img src={media} alt={item.title} />
            ) : (
              <div className="native-photo-caption">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            )}
          </div>
          <footer className="native-detail-toolbar">
            <button aria-label="分享照片說明" onClick={copy}>
              <Share />
            </button>
            <button
              aria-label="收藏照片"
              onClick={() => setFavorite(!favorite)}
            >
              <Heart fill={favorite ? "#007aff" : "none"} />
            </button>
            <span>{copied ? "已複製" : item.title}</span>
          </footer>
        </>
      ) : app === "contacts" || app === "phone" ? (
        // ── 聯絡人／通話紀錄：大頭貼、名字、訊息／通話／視訊按鈕、手機與備註 ──
        <div className="native-detail-scroll">
          <div className="native-contact-hero">
            {/* 取名字第一個字當大頭貼 */}
            <span>{item.title.slice(0, 1)}</span>
            <h1>{item.title}</h1>
          </div>
          <div className="native-contact-actions">
            {[
              [MessageCircle, "訊息"],
              [Phone, "通話"],
              [Video, "視訊"],
            ].map(([Icon, label]) => {
              const Glyph = Icon as typeof Phone;
              return (
                <button
                  key={String(label)}
                  onClick={
                    label === "通話"
                      ? () => {
                          if (app === "phone") {
                            back();
                            dialRequest(item.title);
                          } else if (app === "contacts") {
                            dialRequest(item.title, true, "contacts");
                          } else {
                            setCall(true);
                          }
                        }
                      : undefined
                  }
                >
                  <Glyph size={23} />
                  {String(label)}
                </button>
              );
            })}
          </div>
          <div className="native-detail-group">
            <small>手機</small>
            <p className="native-blue">{item.meta.number || item.meta.phone || "未設定號碼"}</p>
          </div>
          <div className="native-detail-group">
            <small>備註</small>
            <p>{item.meta.note || ""}</p>
          </div>
          {/* 模擬通話中的提示區塊 */}
          {call && (
            <div className="native-detail-group">
              <p>作品內模擬 · {item.title}</p>
              <button onClick={() => setCall(false)}>結束</button>
            </div>
          )}
        </div>
      ) : app === "notes" ? (
        // ── 備忘錄：米白紙張、時間、標題、富文本；底部工具列可返回資料夾／複製 ──
        <>
          <div className="native-detail-scroll native-note-paper">
            <time>{item.time}</time>
            <h1>{item.title}</h1>
            <RichText value={item.richText} fallback={item.body} />
          </div>
          <footer className="native-detail-toolbar">
            <button aria-label="返回資料夾" onClick={back}>
              <Folder />
            </button>
            <span />
            <button aria-label="複製備忘錄" onClick={copy}>
              {copied ? <Check /> : <Share />}
            </button>
          </footer>
        </>
      ) : app === "calendar" ? (
        // ── 行事曆：標題、時間、行程內容，並列出所有 meta 欄位 ──
        <div className="native-detail-scroll native-event-paper">
          <h1>{item.title}</h1>
          <p>{item.time}</p>
          <div className="native-detail-group">
            <small>行程</small>
            <p>{item.body}</p>
          </div>
          {Object.entries(item.meta).map(([k, v]) => (
            <div className="native-detail-group" key={k}>
              <small>{k}</small>
              <p>{v}</p>
            </div>
          ))}
        </div>
      ) : app === "safari" ? (
        // ── Safari 閱讀器：襯線字體內容 + 底部網址列 ──
        <>
          <div className="native-detail-scroll native-reader">
            <h1>{item.title}</h1>
            <RichText value={item.richText} fallback={item.body} />
          </div>
          <footer className="native-reader-address">
            <Search size={16} />
            <span>{item.meta.url || item.title}</span>
            <Share size={18} />
          </footer>
        </>
      ) : (
        // ── 其他（檔案）：資料夾圖示、標題、內文、時間、複製按鈕 ──
        <div className="native-detail-scroll native-file-preview">
          <Folder size={64} color="#007aff" />
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          <small>{item.time}</small>
          <button onClick={copy}>複製內容</button>
        </div>
      )}
    </div>
  );
}