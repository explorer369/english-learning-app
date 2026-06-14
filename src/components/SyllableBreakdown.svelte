<script lang="ts">
  import type { SyllableUnit } from "../types";
  import { SyllableService } from "../services/SyllableService";

  export let units: SyllableUnit[] = [];
  export let separator = "·";

  const svc = new SyllableService();
</script>

<div class="breakdown" data-testid="syllable-breakdown">
  {#each units as unit, i}
    {#if i > 0}<span class="sep" aria-hidden="true">{separator}</span>{/if}
    <span class="unit" style="color: {svc.colorOf(unit.colorGroup)}"
      >{unit.text}</span
    >
  {/each}
</div>

<style>
  .breakdown {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .sep {
    color: #bbb;
    margin: 0 0.1em;
  }
</style>
