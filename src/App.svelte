<script lang="ts">
  import { createWordRepository, isIndexedDbAvailable } from "./services/WordRepository";
  import { WordService } from "./services/WordService";
  import { WebSpeechService } from "./services/SpeechService";
  import { TransferService } from "./services/TransferService";
  import { DictionaryService } from "./services/DictionaryService";
  import { AIService } from "./services/AIService";
  import EntryView from "./components/EntryView.svelte";
  import StudyView from "./components/StudyView.svelte";
  import LibraryView from "./components/LibraryView.svelte";

  type Tab = "study" | "entry" | "library";
  let tab: Tab = "study";

  let service: WordService;
  let transfer: TransferService;
  const speech = new WebSpeechService();
  const dictionary = new DictionaryService();
  const ai = new AIService();

  let warning = "";

  let studyRef: StudyView;
  let libraryRef: LibraryView;

  // 顶层启动初始化（组件创建即开始），用 {#await} 渲染加载态，避免依赖 onMount 时机
  const initPromise = (async () => {
    if (!isIndexedDbAvailable()) {
      warning = "当前浏览器存储不可用，数据可能无法持久化，请尽快导出备份。";
    }
    const repo = await createWordRepository();
    service = new WordService(repo);
    transfer = new TransferService(repo);
    if (!speech.isSupported()) {
      warning = (warning ? warning + " " : "") + "当前浏览器不支持朗读功能。";
    }
  })();

  function refreshViews() {
    studyRef?.reload?.();
    libraryRef?.reload?.();
  }
</script>

<header>
  <h1>英语单词学习</h1>
  <nav class="tabs">
    <button class:active={tab === "study"} on:click={() => (tab = "study")} data-testid="tab-study">学习</button>
    <button class:active={tab === "entry"} on:click={() => (tab = "entry")} data-testid="tab-entry">添加单词</button>
    <button class:active={tab === "library"} on:click={() => (tab = "library")} data-testid="tab-library">词库</button>
  </nav>
</header>

{#if warning}
  <p class="warning" data-testid="global-warning">{warning}</p>
{/if}

<main>
  {#await initPromise}
    <p>加载中…</p>
  {:then}
    {#if tab === "study"}
      <StudyView bind:this={studyRef} {service} {speech} />
    {:else if tab === "entry"}
      <EntryView {service} {dictionary} onChanged={refreshViews} />
    {:else}
      <LibraryView bind:this={libraryRef} {service} {transfer} {ai} onChanged={refreshViews} />
    {/if}
  {:catch}
    <p data-testid="init-error">初始化失败，请刷新页面重试。</p>
  {/await}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #fafafa;
  }
  header {
    text-align: center;
    padding: 0.5rem 1rem 0;
  }
  h1 {
    font-size: 1.3rem;
    margin: 0.5rem 0;
  }
  .tabs {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .tabs button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    background: #fff;
    cursor: pointer;
  }
  .tabs button.active {
    border-color: #4363d8;
    background: #4363d8;
    color: #fff;
  }
  main {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 640px;
    margin: 0 auto;
    padding: 1rem;
  }
  .warning {
    max-width: 640px;
    margin: 0.5rem auto;
    padding: 0.5rem 1rem;
    background: #fff3cd;
    color: #8a6d00;
    border-radius: 0.4rem;
    font-size: 0.9rem;
  }
</style>
