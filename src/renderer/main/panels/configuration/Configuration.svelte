<script lang="ts">
  import ActionList from "./ActionList.svelte";
  import { get } from "svelte/store";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";
  import { fly } from "svelte/transition";
  import EventPanel from "./EventPanel.svelte";
  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";
  import { logger, runtime, user_input } from "../../../runtime/runtime.store";
  import { selected_actions, user_input_event } from "./Configuration";
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
    mergeActionsToCode(target, ...get(selected_actions));
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
    removeActions(target, ...get(selected_actions));
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
    cutActions(target, ...get(selected_actions));
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
    copyActions(...get(selected_actions));
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
    const selected = get(selected_actions);
    const uie = get(user_input_event);

    if (uie.config.every((e) => selected.includes(e))) {
      selected_actions.set([]);
    } else {
      selected_actions.set(uie.config);
    }
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

        {#if $user_input_event}
          <div
            class="w-full flex flex-row"
            class:invisible={$runtime.modules.length === 0}
          >
            <AddActionButton
              index={$user_input_event?.config.length ?? 0}
              on:paste={handlePaste}
              on:new-config={handleAddConfig}
            />
            <ExportConfigs />
          </div>
        {/if}
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
