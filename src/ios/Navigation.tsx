import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { IOS_MOTION } from "./tokens";

// 導覽堆疊 Hook：以陣列模擬頁面堆疊，支援推入、返回與深度查詢
export function useNavigation() {
  const [stack, setStack] = useState<string[]>([]);
  return {
    // 目前頁面（取堆疊最上層，空堆疊時回傳空字串）
    page: stack.at(-1) || "",
    // 推入新頁面
    push: (page: string) => setStack((s) => [...s, page]),
    // 返回上一頁（移除堆疊最上層）
    pop: () => setStack((s) => s.slice(0, -1)),
    // 目前堆疊深度
    depth: stack.length,
  };
}

// 導覽頁面元件：含導覽列、轉場動畫與右滑返回手勢
export function NavigationPage({
  page,
  back,
  title,
  children,
}: {
  page: string;
  back: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      {/* 原生風格導覽列：有頁面時顯示返回按鈕，否則留空 */}
      <header className="settings-native-nav">
        {page ? (
          <button onClick={back}>
            <ChevronLeft size={26} />
            {title}
          </button>
        ) : (
          <span />
        )}
        <strong>{page}</strong>
      </header>

      {/* 頁面切換動畫：以 page 作為 key，切換時觸發進出場動畫 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page}
          className="settings-native-scroll"
          // 有頁面時從右側滑入，首頁則從左側淡入
          initial={{ x: page ? 35 : -15, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: IOS_MOTION.duration,
            ease: [...IOS_MOTION.ease],
          }}
          // 記錄按下的起始 X 座標（供滑動手勢判斷）
          onPointerDown={(e) => {
            e.currentTarget.dataset.startX = String(e.clientX);
          }}
          // 放開時判斷：從左緣附近起滑、且向右滑超過 80px，即觸發返回
          onPointerUp={(e) => {
            const start = Number(e.currentTarget.dataset.startX);
            if (
              page &&
              start < e.currentTarget.getBoundingClientRect().left + 30 &&
              e.clientX - start > 80
            )
              back();
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}