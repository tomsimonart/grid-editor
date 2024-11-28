<script lang="ts">
  import { isPasteActionsEnabled } from "./components/Toolbar";
  import { GridEvent } from "./../../../runtime/runtime";
  import ActionPicker from "./components/ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  export let target: { event: GridEvent; index: number };

  let showActionPicker = false;
  let referenceElement = undefined;
  let isAddDisabled = typeof target.event === "undefined";

  const dispatch = createEventDispatcher();

  function handleShowActionPicker(e) {
    showActionPicker = true;
  }

  function handleCloseActionPicker(e) {
    showActionPicker = false;
  }

  function handlePaste(index: number) {
    dispatch("paste", { index: index });
  }

  function handleNewConfig(e) {
    dispatch("new-config", e.detail);
  }
</script>

<div>
  <div class="w-full flex flex-col gap-2">
    <button
      class="flex rounded px-3 py-1 bg-commit items-center justify-center"
      class:opacity-50={!$isPasteActionsEnabled}
      on:click={() => handlePaste(target.index)}
      disabled={!$isPasteActionsEnabled}
    >
      <span class="text-white"> Paste </span>
    </button>
    <button
      bind:this={referenceElement}
      class="rounded px-3 py-1 border border-pick group-hover:bg-pick/40 items-center justify-center flex"
      class:opacity-50={isAddDisabled}
      on:click={handleShowActionPicker}
      disabled={isAddDisabled}
      on:new-config={handleNewConfig}
    >
      <span class="text-white">Add +</span>
    </button>
  </div>

  {#if showActionPicker}
    <ActionPicker
      event={target.event}
      index={target.index}
      {referenceElement}
      on:close={handleCloseActionPicker}
    />
  {/if}
</div>
