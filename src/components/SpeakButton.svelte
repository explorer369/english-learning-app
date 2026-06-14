<script lang="ts">
  export let enabled = true;
  export let onClick: () => void = () => {};
  export let label = "🔊 朗读";
</script>

<button
  class="speak-btn"
  data-testid="speak-button"
  disabled={!enabled}
  title={enabled ? "朗读单词" : "当前浏览器不支持朗读"}
  on:click={() => enabled && onClick()}
>
  {enabled ? label : "🔇 不支持朗读"}
</button>

<style>
  .speak-btn {
    font-size: 1rem;
    padding: 0.4rem 0.9rem;
    border: 1px solid #4363d8;
    border-radius: 0.5rem;
    background: #eef1ff;
    color: #2030a0;
    cursor: pointer;
  }
  .speak-btn:disabled {
    border-color: #ccc;
    background: #f2f2f2;
    color: #999;
    cursor: not-allowed;
  }
</style>
