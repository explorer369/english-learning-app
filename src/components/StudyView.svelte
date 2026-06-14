<script lang="ts">
  import type { Word } from "../types";
  import type { WordService } from "../services/WordService";
  import type { SpeechService } from "../services/SpeechService";
  import WordCard from "./WordCard.svelte";

  export let service: WordService;
  export let speech: SpeechService;
  /** 侧栏显示的单词数量 */
  export let listLimit = 10;

  let allWords: Word[] = [];
  let groups: string[] = [];
  let groupFilter = ""; // "" 表示全部
  let currentIndex = 0;
  let loaded = false;

  // 按分组筛选后的单词列表
  $: words = groupFilter === ""
    ? allWords
    : allWords.filter((w) => (w.group || "") === groupFilter);
  $: current = words[currentIndex];
  $: speakEnabled = speech.isSupported();
  // 侧栏展示最近的若干个词（按创建时间倒序取前 listLimit，再正序展示）
  $: recent = [...words].slice(-listLimit).reverse();

  $: if (service && !loaded) {
    loaded = true;
    reload();
  }

  export async function reload() {
    allWords = await service.listWords();
    groups = await service.listGroups();
    if (currentIndex >= words.length) currentIndex = Math.max(0, words.length - 1);
  }

  function onFilterChange() {
    currentIndex = 0;
  }

  function selectWord(id: string) {
    const idx = words.findIndex((w) => w.id === id);
    if (idx >= 0) currentIndex = idx;
  }

  function prev() {
    if (currentIndex > 0) currentIndex -= 1;
  }
  function next() {
    if (currentIndex < words.length - 1) currentIndex += 1;
  }
  function speakCurrent() {
    if (current) speech.speak(current.spelling);
  }
</script>

<section class="study">
  {#if allWords.length === 0}
    <p data-testid="empty">词库为空，请先到"添加单词"页录入。</p>
  {:else}
    <div class="toolbar">
      <label class="group-label">分组学习：
        <select data-testid="group-filter" bind:value={groupFilter} on:change={onFilterChange}>
          <option value="">全部（{allWords.length}）</option>
          {#each groups as g}
            <option value={g}>{g}</option>
          {/each}
        </select>
      </label>
    </div>
    {#if words.length === 0}
      <p data-testid="group-empty">该分组暂无单词。</p>
    {:else}
    <div class="layout">
      <!-- 侧栏：单词列表 -->
      <aside class="sidebar" data-testid="word-sidebar">
        <h3>最近的词（{recent.length}）</h3>
        <ul>
          {#each recent as w (w.id)}
            <li>
              <button
                class:active={w.id === current?.id}
                data-testid="list-item-{w.id}"
                on:click={() => selectWord(w.id)}
              >
                <span class="sp">{w.spelling}</span>
                <span class="tr">{w.translation || "—"}</span>
              </button>
            </li>
          {/each}
        </ul>
      </aside>

      <!-- 主区：当前单词详情 -->
      <div class="detail">
        {#if current}
          <WordCard word={current} {speakEnabled} onSpeak={speakCurrent} />
          <nav class="nav">
            <button data-testid="btn-prev" on:click={prev} disabled={currentIndex === 0}>◀ 上一词</button>
            <span data-testid="progress">{currentIndex + 1} / {words.length}</span>
            <button data-testid="btn-next" on:click={next} disabled={currentIndex >= words.length - 1}>下一词 ▶</button>
          </nav>
        {/if}
      </div>
    </div>
    {/if}
  {/if}
</section>

<style>
  .toolbar {
    margin-bottom: 0.75rem;
  }
  .group-label {
    font-size: 0.9rem;
    color: #555;
  }
  .group-label select {
    font-size: 0.95rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.4rem;
    margin-left: 0.4rem;
  }
  .layout {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  .sidebar {
    flex: 0 0 38%;
    max-width: 240px;
    border: 1px solid #eee;
    border-radius: 0.5rem;
    padding: 0.5rem;
    background: #fff;
  }
  .sidebar h3 {
    font-size: 0.85rem;
    color: #888;
    margin: 0.25rem 0 0.5rem;
  }
  .sidebar ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 60vh;
    overflow-y: auto;
  }
  .sidebar li {
    margin-bottom: 0.25rem;
  }
  .sidebar button {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    background: #f6f7fb;
    cursor: pointer;
  }
  .sidebar button.active {
    border-color: #4363d8;
    background: #eef1ff;
  }
  .sidebar .sp {
    font-weight: 600;
  }
  .sidebar .tr {
    font-size: 0.8rem;
    color: #777;
  }
  .detail {
    flex: 1;
    min-width: 0;
  }
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .nav button {
    padding: 0.5rem 1rem;
    border-radius: 0.4rem;
    border: 1px solid #4363d8;
    background: #eef1ff;
    color: #2030a0;
    cursor: pointer;
  }
  .nav button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  /* 移动端：列表移到上方，纵向堆叠 */
  @media (max-width: 560px) {
    .layout {
      flex-direction: column;
    }
    .sidebar {
      flex: none;
      max-width: none;
      width: 100%;
    }
    .sidebar ul {
      max-height: 30vh;
    }
  }
</style>
