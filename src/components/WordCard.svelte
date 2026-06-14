<script lang="ts">
  import type { Word } from "../types";
  import { SyllableService } from "../services/SyllableService";
  import SyllableBreakdown from "./SyllableBreakdown.svelte";
  import SpeakButton from "./SpeakButton.svelte";

  export let word: Word;
  export let speakEnabled = true;
  export let onSpeak: () => void = () => {};

  const svc = new SyllableService();
  const PLACEHOLDER = "—";

  $: units = svc.split(word);
  $: phonetic = word.phonetic?.trim() ? word.phonetic : PLACEHOLDER;
  $: homophone = word.homophone?.trim() ? word.homophone : PLACEHOLDER;
  $: translation = word.translation?.trim() ? word.translation : PLACEHOLDER;
</script>

<article class="card" data-testid="word-card">
  <!-- 1 单词（点击发音） -->
  <button
    class="word"
    data-testid="row-word"
    title="点击朗读"
    on:click={onSpeak}
  >
    {word.spelling}
  </button>
  <div class="speak"><SpeakButton enabled={speakEnabled} onClick={onSpeak} /></div>

  <!-- 2 颜色拆分 -->
  <div class="row" data-testid="row-breakdown"><SyllableBreakdown {units} /></div>

  <!-- 3 音标 -->
  <div class="row phonetic" data-testid="row-phonetic">{phonetic}</div>

  <!-- 4 谐音 -->
  <div class="row homophone" data-testid="row-homophone">{homophone}</div>

  <!-- 5 翻译 -->
  <div class="row translation" data-testid="row-translation">{translation}</div>
</article>

<style>
  .card {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem 1rem;
  }
  .word {
    font-size: 2.4rem;
    margin: 0 auto;
    cursor: pointer;
    user-select: none;
    background: none;
    border: none;
    font-weight: 700;
    color: #111;
    font-family: inherit;
  }
  .row {
    font-size: 1.2rem;
  }
  .phonetic {
    color: #555;
    font-family: "Segoe UI", system-ui, sans-serif;
  }
  .homophone {
    color: #b8860b;
  }
  .translation {
    color: #222;
    font-weight: 600;
  }
</style>
