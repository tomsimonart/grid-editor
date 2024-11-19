<script lang="ts">
  import { selected_actions, user_input_event } from "./Configuration";
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
  import Option from "./components/Options.svelte";

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

  function handleSelectionChange(action: GridAction, value: boolean) {
    const parent = action.parent as GridEvent;
    const stack: GridAction[] = [];
    selected_actions.update((s) => {
      let n = parent.config.findIndex((e) => e.id === action.id);
      do {
        const current = parent.config[n];
        if (current.information.type === "composite_open") {
          stack.push(current);
        } else if (current.information.type === "composite_close") {
          stack.pop();
        }

        if (value) {
          s.push(current);
        } else {
          s = s.filter((item) => item !== current);
        }
        ++n;
      } while (stack.length > 0);
      return s;
    });
  }
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
      {#if $event.config.length === 0}
        <div class="mt-2">
          <AddAction
            index={0}
            text={"There are no actions configured on this event."}
            on:paste={handlePaste}
            on:new-config={handleAddConfig}
          />
        </div>
      {:else}
        <AddActionLine
          index={0}
          on:paste={handlePaste}
          on:new-config={handleAddConfig}
        />
      {/if}
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
        <div class="flex flex-row gap-2">
          <DynamicWrapper
            {index}
            {action}
            selected={typeof $selected_actions.find(
              (e) => e.id === action.id
            ) !== "undefined"}
            on:select={(e) => handleSelectionChange(action, e.detail.value)}
          />
          <div class="flex items-center">
            <Option
              selected={typeof $selected_actions.find(
                (e) => e.id === action.id
              ) !== "undefined"}
              disabled={!action.information.selectable}
              on:select={(e) => handleSelectionChange(action, e.detail.value)}
            />
          </div>
        </div>

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
