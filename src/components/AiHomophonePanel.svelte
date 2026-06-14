<script lang="ts">
  import type { WordService } from "../services/WordService";
  import type { AIService } from "../services/AIService";
  import {
    loadAISettings,
    saveAISettings,
    isAIConfigured,
    type AISettings,
  } from "../services/AISettings";

  export let service: WordService;
  export let ai: AIService;
  export let onChanged: () => void = () => {};

  let settings: AISettings = loadAISettings();
  let showSettings = false;
  let running = false;
  let progressText = "";
  let resultText = "";
  let errorText = "";

  $: configured = isAIConfigured(settings);

  function persist() {
    saveAISettings(settings);
    showSettings = false;
  }

  async function runAI() {
    errorText = "";
    resultText = "";
    if (!configured) {
      showSettings = true;
      errorText = "请先填写并保存 AI 接口设置。";
      return;
    }
    const words = await service.listWords();
    if (words.length === 0) {
      errorText = "词库为空，先去添加单词。";
      return;
    }
    running = true;
    progressText = `准备处理 ${words.length} 个单词…`;
    try {
      const spellings = words.map((w) => w.normalizedSpelling);
      const map = await ai.generateHomophonesFor(spellings, settings, (p) => {
        progressText = `已处理 ${p.done} / ${p.total}…`;
      });
      // 只更新谐音字段，音标与翻译保持不变
      let updated = 0;
      for (const w of words) {
        const h = map[w.normalizedSpelling];
        if (h && h !== w.homophone) {
          await service.updateWord(w.id, { homophone: h });
          updated++;
        }
      }
      resultText = `完成，已用 AI 更新 ${updated} 个单词的谐音。`;
      onChanged();
    } catch (e) {
      errorText = `AI 生成失败：${e instanceof Error ? e.message : String(e)}`;
    } finally {
      running = false;
      progressText = "";
    }
  }
</script>

<div class="ai-panel">
  <div class="row">
    <button data-testid="btn-ai-run" on:click={runAI} disabled={running}>
      {running ? "AI 生成中…" : "✨ 用 AI 优化全部谐音"}
    </button>
    <button class="link" data-testid="btn-ai-settings" on:click={() => (showSettings = !showSettings)}>
      {showSettings ? "收起设置" : "AI 接口设置"}
    </button>
  </div>

  {#if showSettings}
    <div class="settings" data-testid="ai-settings">
      <label>接口地址 Base URL
        <input data-testid="ai-baseurl" bind:value={settings.baseUrl} placeholder="https://api.openai.com/v1" />
      </label>
      <label>API Key
        <input data-testid="ai-apikey" type="password" bind:value={settings.apiKey} placeholder="sk-..." />
      </label>
      <label>模型
        <input data-testid="ai-model" bind:value={settings.model} placeholder="gpt-4o-mini" />
      </label>
      <button data-testid="ai-save" on:click={persist}>保存设置</button>
      <p class="tip">兼容 OpenAI / DeepSeek / Kimi / 通义 等服务。Key 只保存在本机浏览器。</p>
    </div>
  {/if}

  {#if progressText}<p class="progress" data-testid="ai-progress">{progressText}</p>{/if}
  {#if resultText}<p class="ok" data-testid="ai-result">{resultText}</p>{/if}
  {#if errorText}<p class="err" data-testid="ai-error">{errorText}</p>{/if}
</div>

<style>
  .ai-panel {
    border: 1px dashed #c9a227;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
    background: #fffdf5;
  }
  .row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .settings {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
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
  button {
    padding: 0.5rem 0.9rem;
    border-radius: 0.4rem;
    border: 1px solid #c9a227;
    background: #ffd54f;
    color: #5a4500;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .link {
    background: none;
    border: none;
    color: #4363d8;
    padding: 0;
  }
  .tip {
    font-size: 0.8rem;
    color: #888;
    margin: 0;
  }
  .progress {
    color: #555;
  }
  .ok {
    color: #2e7d32;
  }
  .err {
    color: #c62828;
  }
</style>
