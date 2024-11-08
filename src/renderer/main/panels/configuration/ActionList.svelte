<script lang="ts" context="module">
  export type ActionBlock = {
    action: GridAction;
    selected: boolean;
  };
</script>

<script lang="ts">
  import AddAction from "./components/AddAction.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import DropZone from "./components/DropZone.svelte";
  import AddActionLine from "./components/AddActionLine.svelte";
  import { GridEvent } from "./../../../runtime/runtime";
  import { fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import * as eases from "svelte/easing";
  import { addActions, pasteActions } from "../../../runtime/operations";
  import { GridAction } from "./../../../runtime/runtime";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { draggedActions } from "./../../_actions/move.action";

  export let event: GridEvent;

  let autoScroll;
  let configList: HTMLElement;

  function handleAddConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    addActions(event, index, ...configs);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(event, index);
  }

  /*
  function handleDrag(e) {
    if (typeof $config_drag !== "undefined") {
      const mouseY = e.clientY - configList.getBoundingClientRect().top;
      const configListHeight = configList.offsetHeight;
      const treshold = 60;
      const lowerThreshold = configListHeight - mouseY <= treshold;
      const upperThreshold =
        configListHeight - mouseY > configListHeight - treshold;
      clearInterval(autoScroll);
      if (lowerThreshold) {
        autoScroll = setInterval(() => {
          configList.scrollTop += 5;
        }, 10);
      } else if (upperThreshold) {
        autoScroll = setInterval(() => {
          configList.scrollTop -= 5;
        }, 10);
      }
    }
  }
    */
</script>

{#if $event}
  <ul
    bind:this={configList}
    on:mouseleave={() => {
      clearInterval(autoScroll);
    }}
    class="flex flex-col w-full flex-grow overflow-y-scroll scroll justify-start"
  >
    {#if $draggedActions.length === 0}
      <AddActionLine
        index={0}
        on:paste={handlePaste}
        on:new-config={handleAddConfig}
      />
    {:else}
      <DropZone index={0} {event} />
    {/if}
    {#each $event.config as action, index (action.id)}
      {@const showHelper =
        typeof action.information.helperText !== "undefined" &&
        ["composite_part", "composite_open"].includes(
          action.information.type
        ) &&
        $event.config[index + 1]?.indentation === action.indentation &&
        $appSettings.persistent.actionHelperText}
      <anim-block
        animate:flip={{ duration: 300, easing: eases.backOut }}
        in:fade|global={{ delay: 0 }}
      >
        <DynamicWrapper {index} data={{ action: action, selected: false }} />
        {#if $draggedActions.length === 0}
          {#if showHelper}
            <div class="mr-6">
              <AddAction
                text={action.information.helperText}
                index={index + 1}
                on:paste={handlePaste}
                on:new-config={handleAddConfig}
              />
            </div>
          {:else}
            <AddActionLine
              index={index + 1}
              on:paste={handlePaste}
              on:new-config={handleAddConfig}
            />
          {/if}
        {:else}
          <DropZone index={index + 1} {event} />
        {/if}
      </anim-block>
    {/each}
  </ul>
{/if}
