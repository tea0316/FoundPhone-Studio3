import "./native-apps.css";
import { useState } from "react";
import { Clock, Calculator, Delete, ChevronLeft } from "lucide-react";
import { calculate } from "./calculatorMath";
import { useSkinState } from "../skinState";
import type { Item, UiValue } from "../schema";

// 仿 iOS 計算機 App：四則運算、連按 = 重複運算、歷史紀錄、模式面板
export function NativeCalculator(p: {
  items: Item[];                   // 外部傳入的條目（顯示在歷史面板）
  onRead: (i: Item) => void;       // 點擊條目的回呼
  ui?: Record<string, UiValue>;
  onUi?: (key: string, value: UiValue) => void;
}) {
  // 持久化狀態：顯示值、歷史（保留最近 50 筆）
  const [value, set] = useSkinState<string>(p, "display", "0"),
    [history, setHistory] = useSkinState<string[]>(p, "history", []);

  // 臨時狀態：左運算元、運算子、是否剛結算、連按 = 的重複運算、面板
  const [left, setLeft] = useState<number | null>(null),
    [op, setOp] = useState(""),
    [fresh, setFresh] = useState(false),
    [repeat, setRepeat] = useState<{ op: string; n: number } | null>(null),
    [panel, setPanel] = useState("");

  const press = (k: string) => {
    // AC：全部清除
    if (k === "AC") {
      set("0");
      setLeft(null);
      setOp("");
      setFresh(false);
      setRepeat(null);
      return;
    }
    // ⌫：退格（錯誤或長度 < 2 時歸 0）
    if (k === "⌫") {
      set(value === "錯誤" || value.length < 2 ? "0" : value.slice(0, -1));
      return;
    }
    // ±：正負切換
    if (k === "±") {
      set(String(-Number(value)));
      return;
    }
    // %：除以 100
    if (k === "%") {
      set(String(Number(value) / 100));
      return;
    }
    // 運算子：先結算前一步，結果作為新 left（!fresh 避免重複觸發）
    if (["+", "−", "×", "÷"].includes(k)) {
      const n = Number(value);
      if (!Number.isFinite(n)) return;
      const next =
        left !== null && op && !fresh ? calculate(left, n, op) : value;
      set(next);
      setLeft(Number(next));
      setOp(k);
      setFresh(true);
      return;
    }
    // =：結算並寫入歷史；無 op 時用 repeat 支援連按 =
    if (k === "=") {
      const operation = op || repeat?.op,
        b = left !== null ? Number(value) : repeat?.n,
        a = left ?? Number(value);
      if (operation && b !== undefined) {
        const result = calculate(a, b, operation);
        set(result);
        setHistory(
          [...history, `${a} ${operation} ${b} = ${result}`].slice(-50),
        );
        setRepeat({ op: operation, n: b });
        setLeft(null);
        setOp("");
        setFresh(true);
      }
      return;
    }
    // 數字／小數點：fresh 時覆蓋，否則追加（防重複小數點、上限 15 字）
    if (fresh || value === "錯誤") {
      set(k === "." ? "0." : k);
      setFresh(false);
    } else if (!(k === "." && value.includes(".")))
      set(value === "0" && k !== "." ? k : (value + k).slice(0, 15));
  };

  return (
    <div className="calculator native-calculator">
      {/* 工具列：歷史 / 模式 */}
      <header className="calc-toolbar">
        <button aria-label="計算歷史" onClick={() => setPanel("history")}>
          <Clock size={26} />
        </button>
        <button aria-label="計算機模式" onClick={() => setPanel("mode")}>
          <Calculator size={25} />
        </button>
      </header>

      {/* 顯示區：字級隨長度縮小 */}
      <output
        aria-live="polite"
        style={{ fontSize: value.length > 9 ? 42 : value.length > 6 ? 54 : 68 }}
      >
        {value}
      </output>

      {/* 4×5 鍵盤 */}
      <div className="calc-keypad">
        {[
          "⌫",
          "AC",
          "%",
          "÷",
          "7",
          "8",
          "9",
          "×",
          "4",
          "5",
          "6",
          "−",
          "1",
          "2",
          "3",
          "+",
          "±",
          "0",
          ".",
          "=",
        ].map((k, i) => (
          <button
            key={k}
            className={
              (i < 3 ? "calc-function " : "") +        // 前 3 個為功能鍵
              (i % 4 === 3 ? "calc-operator " : "") +  // 每列第 4 個為運算子
              (op === k ? "calc-selected" : "")        // 目前運算子高亮
            }
            aria-label={k === "⌫" ? "退格" : k === "±" ? "正負切換" : k}
            onClick={() => press(k)}
          >
            {k === "⌫" ? <Delete size={32} /> : k}
          </button>
        ))}
      </div>

      {/* 覆蓋面板：歷史 / 模式 */}
      {panel && (
        <div className="calc-history">
          <header>
            <button onClick={() => setPanel("")}>
              <ChevronLeft />
              返回
            </button>
            <strong>{panel === "history" ? "歷史紀錄" : "計算機"}</strong>
            {panel === "history" && (
              <button onClick={() => setHistory([])}>清除</button>
            )}
          </header>

          {panel === "history" ? (
            <>
              <div className="calc-history-list">
                {/* 歷史倒序，點擊回填結果 */}
                {history
                  .slice()
                  .reverse()
                  .map((v, i) => (
                    <button
                      key={i}
                      className="calc-history-item"
                      onClick={() => {
                        set(v.split(" = ").at(-1) || "0");
                        setPanel("");
                      }}
                    >
                      {v}
                    </button>
                  ))}
                {p.items.map((i) => (
                 <button
                  key={i.id}
                  className="calc-history-item"
                  onClick={() => p.onRead(i)}
                 >
                  {i.title}
                 </button>
                ))}
                {!history.length && !p.items.length && <p>暫無計算紀錄</p>}
              </div>
            </>
          ) : (
            // 模式面板：目前僅「基本」
            <button className="calc-mode-option" onClick={() => setPanel("")}>
              基本 ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}