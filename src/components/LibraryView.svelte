<script lang="ts">
  import type { Word, ImportResult } from "../types";
  import type { WordService } from "../services/WordService";
  import type { TransferService } from "../services/TransferService";
  import type { AIService } from "../services/AIService";
  import { ParseError } from "../services/TransferService";
  import AiHomophonePanel from "./AiHomophonePanel.svelte";

  export let service: WordService;
  export let transfer: TransferService;
  export let ai: AIService;
  export let onChanged: () => void = () => {};

  let words: Word[] = [];
  let groups: string[] = [];
  let groupFilter = "";
  let result: ImportResult | null = null;
  let errorMsg = "";
  let loaded = false;

  $: shown =
    groupFilter === ""
      ? words
      : words.filter((w) => (w.group || "") === groupFilter);

  export async function reload() {
    words = await service.listWords();
    groups = await service.listGroups();
  }
  // service 就绪后自动加载一次
  $: if (service && !loaded) {
    loaded = true;
    reload();
  }

  async function remove(id: string) {
    await service.deleteWord(id);
    await reload();
    onChanged();
  }

  async function changeGroup(id: string, value: string) {
    await service.updateWord(id, { group: value });
    await reload();
    onChanged();
  }

  async function exportLib() {
    await transfer.exportLibrary();
  }

  async function onFile(e: Event) {
    errorMsg = "";
    result = null;
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      result = await transfer.importLibrary(file);
      await reload();
      onChanged();
    } catch (err) {
      if (err instanceof ParseError) {
        errorMsg = "文件格式不正确，请选择本应用导出的 JSON";
      } else {
        errorMsg = "导入失败";
      }
    } finally {
      input.value = "";
    }
  }
</script>

<section class="library">
  <h2>词库管理</h2>

  <AiHomophonePanel {service} {ai} onChanged={() => { reload(); onChanged(); }} />

  <div class="actions">
    <button data-testid="btn-export" on:click={exportLib}>导出词库</button>
    <label class="import">
      导入词库
      <input
        type="file"
        accept="application/json,.json"
        data-testid="in-file"
        on:change={onFile}
      />
    </label>
  </div>

  {#if errorMsg}<p class="err" data-testid="import-error">{errorMsg}</p>{/if}
  {#if result}
    <p class="ok" data-testid="import-result">
      新增 {result.added}，更新 {result.updated}，跳过 {result.skipped}，失败 {result.failed}
    </p>
  {/if}

  {#if groups.length > 0}
    <div class="filter">
      <label>按分组筛选：
        <select data-testid="lib-group-filter" bind:value={groupFilter}>
          <option value="">全部（{words.length}）</option>
          {#each groups as g}
            <option value={g}>{g}</option>
          {/each}
        </select>
      </label>
    </div>
  {/if}

  <ul data-testid="word-list">
    {#each shown as w (w.id)}
      <li>
        <span class="sp">{w.spelling}</span>
        <span class="trans">{w.translation || "—"}</span>
        <input
          class="group-edit"
          data-testid="group-edit-{w.id}"
          value={w.group || ""}
          list="lib-group-suggestions"
          placeholder="未分组"
          on:change={(e) => changeGroup(w.id, e.currentTarget.value)}
        />
        <button data-testid="btn-del-{w.id}" on:click={() => remove(w.id)}>删除</button>
      </li>
    {:else}
      <li class="empty" data-testid="list-empty">暂无单词</li>
    {/each}
  </ul>
  <datalist id="lib-group-suggestions">
    {#each groups as g}
      <option value={g}></option>
    {/each}
  </datalist>
</section>

<style>
  .actions {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  button,
  .import {
    padding: 0.5rem 0.9rem;
    border-radius: 0.4rem;
    border: 1px solid #4363d8;
    background: #eef1ff;
    color: #2030a0;
    cursor: pointer;
  }
  .import input {
    display: none;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid #eee;
  }
  .trans {
    color: #666;
    flex: 1;
  }
  .sp {
    font-weight: 600;
  }
  .group-edit {
    width: 7rem;
    font-size: 0.8rem;
    padding: 0.2rem 0.4rem;
    border: 1px solid #ddd;
    border-radius: 0.3rem;
    color: #2030a0;
    background: #f8f9ff;
  }
  .filter {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }
  .filter select {
    font-size: 0.95rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.4rem;
    margin-left: 0.4rem;
  }
  .err {
    color: #c62828;
  }
  .ok {
    color: #2e7d32;
  }
</style>
