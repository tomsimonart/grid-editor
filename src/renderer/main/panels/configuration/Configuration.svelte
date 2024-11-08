<script lang="ts">
  import ActionList from "./ActionList.svelte";
  import { get } from "svelte/store";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";
  import { fly } from "svelte/transition";
  import EventPanel from "./EventPanel.svelte";
  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";
  import { logger, runtime, user_input } from "../../../runtime/runtime.store";
  import { config_panel_blocks, user_input_event } from "./Configuration";
  import Toolbar from "./components/Toolbar.svelte";
  import ExportConfigs from "./components/ExportConfigs.svelte";
  import AddActionButton from "./components/AddActionButton.svelte";
  import {
    mergeActionsToCode,
    copyActions,
    pasteActions,
    removeActions,
    cutActions,
    discardElement,
    overwriteElement,
    copyElement,
    clearElement,
    addActions,
  } from "../../../runtime/operations";

  let isSystemEventSelected = false;

  $: {
    const les = $lua_error_store;
    const error = les.slice(-1).pop();
    if (typeof error !== "undefined") {
      handleError(error);
    }
  }

  $: isSystemEventSelected = $user_input.elementnumber == 255;

  function handleError(e) {
    switch (e.type) {
      case "luanotok":
        logger.set({
          type: "alert",
          mode: 0,
          classname: "luanotok",
          message: `${e.device}: Error on Element ${e.element.no} ${e.event.type} event.`,
        });
        break;
      case "kbisdisabled":
        logger.set({
          type: "alert",
          mode: 0,
          classname: "kbisdisabled",
          message: `${e.device}: Keyboard events are disabled until storing.`,
        });
        break;
    }
  }

  function handleConvertToCodeBlock() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    mergeActionsToCode(target, ...selected);
  }

  function handleRemove() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    removeActions(target, ...selected);
  }

  function handleCut() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    cutActions(target, ...selected);
  }

  function handleAddConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    addActions(target, index, ...configs);
  }

  function handleOverwriteElement() {
    const ui = get(user_input);
    const target = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    overwriteElement(target);
  }

  function handleCopyElement() {
    const ui = get(user_input);
    const target = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    copyElement(target);
  }

  function handleCopy() {
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    copyActions(...selected);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );

    pasteActions(target, index);
  }

  function handleClearElement() {
    const ui = get(user_input);
    const target = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );

    clearElement(target);
  }

  function handleDiscardElement() {
    const ui = get(user_input);
    const element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    discardElement(element);
  }

  function handleSelectAll() {
    config_panel_blocks.update((s) => {
      if (s.every((e) => e.selected)) {
        s.forEach((e) => (e.selected = false));
        return s;
      }

      s.forEach((e) => (e.selected = true));
      return s;
    });
  }
</script>

<configuration class="w-full h-full flex flex-col bg-primary">
  {#key !isSystemEventSelected}
    <container
      class="flex flex-col h-full"
      in:fly|global={{
        x: !isSystemEventSelected ? -5 : 5,
        opacity: 0.5,
        duration: 200,
        delay: 0,
      }}
    >
      <configs
        class="w-full h-full grid grid-rows-[auto_1fr_auto] px-8 pt-4 pb-2"
      >
        <div>
          <ElementSelectionPanel />
          <EventPanel />
          <Toolbar
            on:convert-to-code-block={handleConvertToCodeBlock}
            on:copy={handleCopy}
            on:cut={handleCut}
            on:paste={handlePaste}
            on:remove={handleRemove}
            on:copy-all={handleCopyElement}
            on:overwrite-all={handleOverwriteElement}
            on:discard={handleDiscardElement}
            on:clear-element={handleClearElement}
            on:select-all={handleSelectAll}
          />
        </div>

        <ActionList event={$user_input_event} />

        <div
          class="w-full flex flex-row"
          class:invisible={$runtime.modules.length === 0}
        >
          <AddActionButton
            index={$config_panel_blocks.length}
            on:paste={handlePaste}
            on:new-config={handleAddConfig}
          />
          <ExportConfigs />
        </div>
      </configs>
    </container>
  {/key}
</configuration>

<style global>
  /*   .grabbed {
    cursor: grab !important;
  }
 */
  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    /*     cursor: default; */
  }

  ::-webkit-scrollbar {
    height: 6px;
    width: 6px;
    background: #1e2628;
  }

  ::-webkit-scrollbar-thumb {
    background: #286787;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
    background: #1e2628;
  }
</style>
