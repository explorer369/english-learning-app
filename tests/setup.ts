// 全局测试环境初始化。
// 让 fake-indexeddb 在 Node/jsdom 环境下提供 IndexedDB API，供后续仓储层测试使用。
import "fake-indexeddb/auto";

// jsdom 未实现 Blob/File.text()，为导入功能测试提供 polyfill（真实浏览器原生支持）。
if (typeof Blob !== "undefined" && typeof Blob.prototype.text !== "function") {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
