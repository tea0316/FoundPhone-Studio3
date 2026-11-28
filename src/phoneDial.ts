let pending = "";
let backTo = "";

// 請手機最外層打開某個 App
export const openApp = (id: string) =>
  window.dispatchEvent(new CustomEvent("app-open", { detail: id }));

// 詳情頁呼叫：請電話 App 撥給某人
// openPhone：電話 App 目前沒開，先打開它再撥
// returnTo：掛斷後要回到哪個 App
export const dialRequest = (name: string, openPhone = false, returnTo = "") => {
  pending = name;
  backTo = returnTo;
  if (openPhone) openApp("phone");
  else window.dispatchEvent(new Event("phone-dial"));
};

// 電話 App 取走待撥的名字
export const takeDial = () => {
  const n = pending;
  pending = "";
  return n;
};

// 通話結束：如果是從別的 App 來的，就回到那個 App
export const endCallReturn = () => {
  const r = backTo;
  backTo = "";
  if (r) openApp(r);
};