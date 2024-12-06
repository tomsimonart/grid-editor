<script lang="ts">
  import DropZone from "./DropZone.svelte";
  import AddActionLine from "./AddActionLine.svelte";
  import { GridEvent } from "../../../../runtime/runtime";
  import { draggedActions } from "../../../_actions/move.action";
  import { addActions, pasteActions } from "../../../../runtime/operations";

  export let target: { index: number; event: GridEvent } = undefined;

  function handleNewConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    addActions(target.event, index, ...configs);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(target.event, index);
  }
</script>

<div class="flex items-center h-5">
  {#if $draggedActions.length === 0}
    <AddActionLine
      {target}
      on:paste={handlePaste}
      on:new-config={handleNewConfig}
    />
  {:else}
    <DropZone {target} />
  {/if}
</div>
