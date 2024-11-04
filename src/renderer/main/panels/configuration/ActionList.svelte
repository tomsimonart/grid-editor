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
  import {
    changeOrder,
    config_drag,
    DragEvent,
  } from "../../_actions/move.action.js";
  import { addActions, pasteActions } from "../../../runtime/operations";
  import { user_input } from "./../../../runtime/runtime.store";
  import { GridAction } from "./../../../runtime/runtime";
  import { appSettings } from "./../../../runtime/app-helper.store";

  export let event: GridEvent;

  let dragged: number[] = [];
  let dropIndex = undefined;
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

  function handleDrop(e) {
    if (typeof dropIndex === "undefined") {
      return;
    }

    const offset = Math.min(...dragged) > dropIndex ? 0 : -1;

    //Check for incorrect dropzones
    const firstIndex = dragged.at(0);
    const lastIndex = dragged.at(-1);
    if (dropIndex >= firstIndex && dropIndex <= lastIndex + 1) {
      return;
    }

    const actions = event.config.filter((e) => dragged.includes(e.id));

    const trueDropIndex =
      dropIndex - (offset === -1 ? actions.length - 1 : 0) + offset;
    console.log(trueDropIndex);

    event.remove(...actions);
    event.insert(trueDropIndex, ...actions);
  }

  function handleDragStart(e) {
    config_drag.set(new DragEvent());
  }

  function handleDragEnd(e) {
    config_drag.set(undefined);
    dropIndex = undefined;
    dragged = [];
    clearInterval(autoScroll);
  }

  function handleDragTargetChange(e) {
    dragged = e.detail.id;
  }

  function handleDropTargetChange(e) {
    const { index } = e.detail;
    dropIndex = index;
  }

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
</script>

{#if $event}
  <ul
    bind:this={configList}
    use:changeOrder={(this, { configs: $event.config })}
    on:drag-start={handleDragStart}
    on:drag-target={handleDragTargetChange}
    on:drop={handleDrop}
    on:drag-end={handleDragEnd}
    on:mousemove={handleDrag}
    on:mouseleave={() => {
      clearInterval(autoScroll);
    }}
    class="flex flex-col w-full flex-grow overflow-y-scroll scroll justify-start"
  >
    {#if typeof $config_drag === "undefined"}
      <AddActionLine
        index={0}
        on:paste={handlePaste}
        on:new-config={handleAddConfig}
      />
    {:else}
      <DropZone
        index={0}
        drag_target={dragged}
        thresholdTop={10}
        thresholdBottom={0}
        on:drop-target-change={handleDropTargetChange}
      />
    {/if}
    {#each $event.config as action, index (action.id)}
      {@const showHelper =
        typeof action.information.helperText !== "undefined" &&
        ["composite_part", "composite_open"].includes(
          action.information.type
        ) &&
        $event.config[index + 1]?.action.indentation === action.indentation &&
        $appSettings.persistent.actionHelperText}
      <anim-block
        animate:flip={{ duration: 300, easing: eases.backOut }}
        in:fade|global={{ delay: 0 }}
      >
        <DynamicWrapper {index} data={{ action: action, selected: false }} />
        {#if typeof $config_drag === "undefined"}
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
          <DropZone
            index={index + 1}
            thresholdTop={10}
            thresholdBottom={10}
            class={index + 1 == event.config.length ? "h-full" : ""}
            drag_target={dragged}
            on:drop-target-change={handleDropTargetChange}
          />
        {/if}
      </anim-block>
    {/each}
  </ul>
{/if}
