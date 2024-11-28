<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import DropZone from "./DropZone.svelte";
  import AddActionLine from "./AddActionLine.svelte";
  import { GridEvent } from "../../../../runtime/runtime";
  import { draggedActions } from "../../../_actions/move.action";
  import { addActions, pasteActions } from "../../../../runtime/operations";

  const dispatch = createEventDispatcher();
  export let target: { index: number; event: GridEvent } = undefined;

  function handleNewConfig(e) {
    dispatch("new-config", e.detail);
  }

  function handlePaste(e) {
    dispatch("paste", e.detail);
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
