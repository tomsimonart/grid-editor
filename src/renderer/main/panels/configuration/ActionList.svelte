<script lang="ts" context="module">
  import { user_input } from "./../../../runtime/runtime.store";
  import { GridAction } from "./../../../runtime/runtime";
  import { appSettings } from "./../../../runtime/app-helper.store.js";
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

  export let event: GridEvent;
  let list: ActionBlock[] = [];

  //$: handleEventChange(event);

  function handleEventChange(event: GridEvent) {
    list = event.config.map(
      (e) =>
        ({
          action: e,
          selected: false,
        } as ActionBlock)
    );
  }

  let draggedIndexes: number[] = [];
  let dropIndex = undefined;
  let autoScroll;

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

    const offset = Math.min(...draggedIndexes) > dropIndex ? 0 : -1;

    //Check for incorrect dropzones
    const firstIndex = draggedIndexes.at(0);
    const lastIndex = draggedIndexes.at(-1);
    if (dropIndex >= firstIndex && dropIndex <= lastIndex + 1) {
      return;
    }

    const blocks = list
      .map((e) => e.action)
      .filter((e, n) => draggedIndexes.includes(n));

    const trueDropIndex =
      dropIndex - (offset === -1 ? blocks.length - 1 : 0) + offset;

    event.remove(...blocks);
    event.insert(trueDropIndex, ...blocks);
  }

  function handleDragStart(e) {
    config_drag.set(new DragEvent());
  }

  function handleDragEnd(e) {
    config_drag.set(undefined);
    dropIndex = undefined;
    draggedIndexes = [];
    clearInterval(autoScroll);
  }

  function handleDragTargetChange(e) {
    draggedIndexes = e.detail.id;
  }

  function handleDropTargetChange(e) {
    const { index } = e.detail;
    dropIndex = index;
  }

  function handleDrag(e) {
    if (typeof $config_drag !== "undefined") {
      const configList = document.getElementById("cfg-list");
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

<ul
  use:changeOrder={(this, { configs: list.map((e) => e.action) })}
  on:drag-start={handleDragStart}
  on:drag-target={handleDragTargetChange}
  on:drop={handleDrop}
  on:drag-end={handleDragEnd}
  on:mousemove={handleDrag}
  on:mouseleave={() => {
    clearInterval(autoScroll);
  }}
  class="flex flex-col w-full h-auto overflow-y-auto justify-start"
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
      drag_target={draggedIndexes}
      thresholdTop={10}
      thresholdBottom={0}
      on:drop-target-change={handleDropTargetChange}
    />
  {/if}
  {#each list as block, index (block.action.id)}
    <anim-block
      animate:flip={{ duration: 300, easing: eases.backOut }}
      in:fade|global={{ delay: 0 }}
    >
      <DynamicWrapper {index} data={block} />
      {#if typeof $config_drag === "undefined"}
        {#if typeof block.action.information.helperText !== "undefined" && ["composite_part", "composite_open"].includes(block.action.information.type) && list[index + 1]?.action.indentation === block.action.indentation && $appSettings.persistent.actionHelperText}
          <div class="mr-6">
            <AddAction
              text={block.action.information.helperText}
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
          class={index + 1 == list.length ? "h-full" : ""}
          drag_target={draggedIndexes}
          on:drop-target-change={handleDropTargetChange}
        />
      {/if}
    </anim-block>
  {/each}
</ul>
