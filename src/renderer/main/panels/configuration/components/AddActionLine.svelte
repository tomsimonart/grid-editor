<script lang="ts">
  import { GridEvent } from "./../../../../runtime/runtime";
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  export let target: { index: number; event: GridEvent } = undefined;

  let showActionPicker = false;
  let referenceElement = undefined;

  const dispatch = createEventDispatcher();

  function handleNewConfig(e) {
    console.log("yay", e.detail);
    dispatch("new-config", e.detail);
  }

  function handlePaste(e) {
    dispatch("paste", e.detail);
  }

  function handleShowActionPicker(e) {
    showActionPicker = true;
  }

  function handleCloseActionPicker(e) {
    showActionPicker = false;
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<add-line
  bind:this={referenceElement}
  on:click={handleShowActionPicker}
  on:new-config={handleNewConfig}
  on:paste={handlePaste}
  class="hover:opacity-100 opacity-0 h-2 w-full relative mr-0.5 rounded-full bg-pick transition-opacity delay-100 duration-300 cursor-pointer flex items-center"
>
  <div
    class="h-5 w-5 absolute right-0 rounded-full text-center flex items-center justify-center bg-pick"
  >
    <svg
      class="w-5 h-5 p-1"
      viewBox="0 0 7 7"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z"
        fill="white"
      />
    </svg>
  </div>
</add-line>

{#if showActionPicker}
  <ActionPicker
    event={target.event}
    index={target.index}
    {referenceElement}
    on:close={handleCloseActionPicker}
  />
{/if}
