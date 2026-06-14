<script lang="ts">
  import type { SyllableUnit } from "../types";
  import {
    WordService,
    DuplicateWordError,
    EmptySpellingError,
  } from "../services/WordService";
  import type { DictionaryService } from "../services/DictionaryService";

  export let service: WordService;
  export let dictionary: DictionaryService;
  export let onChanged: () => void = () => {};

  let spelling = "";
  let group = "";
  let groups: string[] = [];
  // 可选手动覆盖字段
  let showAdvanced = false;
  let phonetic = "";
  let translation = "";
  let homophone = "";
  let syllablesText = ""; // 形如 "ba/na/na"

  let loading = false;
  let message = "";
  let messageType: "" | "ok" | "err" = "";
  let duplicateSpelling = "";
  let groupsLoaded = false;

  // 加载已有分组用于输入建议
  $: if (service && !groupsLoaded) {
    groupsLoaded = true;
    service.listGroups().then((g) => (groups = g));
  }
  async function refreshGroups() {
    groups = await service.listGroups();
  }

  function parseSyllables(text: string): SyllableUnit[] {
    return text
      .split(/[\/·\s]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((t) => ({ text: t, colorGroup: 0 }));
  }

  function reset() {
    spelling = "";
    phonetic = "";
    translation = "";
    homophone = "";
    syllablesText = "";
    // 保留 group，便于连续录入同一组的单词
  }

  async function submit() {
    message = "";
    messageType = "";
    duplicateSpelling = "";

    if (spelling.trim() === "") {
      messageType = "err";
      message = "拼写不能为空";
      return;
    }

    loading = true;
    try {
      // 联网自动补全（音标/翻译），本地生成拆分与谐音
      const auto = await dictionary.lookup(spelling);

      // 手动填写的字段优先覆盖自动结果
      const manualSyll = parseSyllables(syllablesText);
      const finalPhonetic = phonetic.trim() || auto.phonetic;
      const finalTranslation = translation.trim() || auto.translation;
      const finalHomophone = homophone.trim() || auto.homophone;
      const finalSyllables = manualSyll.length > 0 ? manualSyll : auto.syllables;

      const w = await service.addWord({
        spelling,
        phonetic: finalPhonetic,
        translation: finalTranslation,
        homophone: finalHomophone,
        syllables: finalSyllables,
        group,
      });

      messageType = "ok";
      const parts = [`已添加：${w.spelling}`];
      if (w.group) parts.push(`分组 ${w.group}`);
      if (w.phonetic) parts.push(`音标 ${w.phonetic}`);
      if (w.translation) parts.push(`翻译 ${w.translation}`);
      message = parts.join("，");
      if (auto.notice) message += `（${auto.notice}）`;

      reset();
      await refreshGroups();
      onChanged();
    } catch (e) {
      messageType = "err";
      if (e instanceof EmptySpellingError) {
        message = "拼写不能为空";
      } else if (e instanceof DuplicateWordError) {
        message = `单词已存在：${e.spelling}`;
        duplicateSpelling = e.spelling;
      } else {
        message = "添加失败，请重试";
      }
    } finally {
      loading = false;
    }
  }

  async function updateExisting() {
    const id = duplicateSpelling.trim().toLowerCase();
    loading = true;
    try {
      const auto = await dictionary.lookup(duplicateSpelling);
      const manualSyll = parseSyllables(syllablesText);
      await service.updateWord(id, {
        phonetic: phonetic.trim() || auto.phonetic,
        translation: translation.trim() || auto.translation,
        homophone: homophone.trim() || auto.homophone,
        syllables: manualSyll.length > 0 ? manualSyll : auto.syllables,
      });
      messageType = "ok";
      message = `已更新：${duplicateSpelling}`;
      duplicateSpelling = "";
      reset();
      onChanged();
    } catch {
      messageType = "err";
      message = "更新失败";
    } finally {
      loading = false;
    }
  }
</script>

<section class="entry">
  <h2>添加单词</h2>
  <p class="hint">只需输入单词，点击添加会自动获取音标、翻译，并生成拆分与谐音。</p>
  <form on:submit|preventDefault={submit}>
    <label>单词
      <input
        data-testid="in-spelling"
        bind:value={spelling}
        placeholder="例如 banana"
        autocapitalize="off"
        autocomplete="off"
      />
    </label>

    <label>分组（像课本单元，可选）
      <input
        data-testid="in-group"
        bind:value={group}
        list="group-suggestions"
        placeholder="例如 第一单元 / 四级核心词"
      />
      <datalist id="group-suggestions">
        {#each groups as g}
          <option value={g}></option>
        {/each}
      </datalist>
    </label>

    <button type="button" class="link" data-testid="toggle-advanced" on:click={() => (showAdvanced = !showAdvanced)}>
      {showAdvanced ? "收起手动填写" : "手动填写更多（可选）"}
    </button>

    {#if showAdvanced}
      <label>音标<input data-testid="in-phonetic" bind:value={phonetic} placeholder="留空则自动获取" /></label>
      <label>音节拆分<input data-testid="in-syllables" bind:value={syllablesText} placeholder="留空则自动拆分，如 ba/na/na" /></label>
      <label>谐音<input data-testid="in-homophone" bind:value={homophone} placeholder="留空则自动生成" /></label>
      <label>翻译<input data-testid="in-translation" bind:value={translation} placeholder="留空则自动获取" /></label>
    {/if}

    <button type="submit" data-testid="btn-add" disabled={loading}>
      {loading ? "获取中…" : "添加"}
    </button>
  </form>

  {#if message}
    <p class="msg {messageType}" data-testid="msg">{message}</p>
  {/if}
  {#if duplicateSpelling}
    <button data-testid="btn-update" on:click={updateExisting} disabled={loading}>改为更新该单词</button>
  {/if}
</section>

<style>
  .entry {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .hint {
    color: #666;
    font-size: 0.85rem;
    margin: 0;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
    color: #555;
  }
  input {
    font-size: 1rem;
    padding: 0.4rem;
    border: 1px solid #ccc;
    border-radius: 0.4rem;
  }
  button[type="submit"] {
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 0.4rem;
    border: 1px solid #4363d8;
    background: #4363d8;
    color: #fff;
    cursor: pointer;
  }
  button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .link {
    align-self: flex-start;
    background: none;
    border: none;
    color: #4363d8;
    cursor: pointer;
    padding: 0;
    font-size: 0.85rem;
  }
  .msg.ok {
    color: #2e7d32;
  }
  .msg.err {
    color: #c62828;
  }
</style>
