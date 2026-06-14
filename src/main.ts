import App from "./App.svelte";

const target = document.getElementById("app");
if (!target) {
  throw new Error("找不到挂载节点 #app");
}

const app = new App({ target });

// 注册 Service Worker（仅在支持且非测试环境时）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* 注册失败不影响应用使用 */
    });
  });
}

export default app;
