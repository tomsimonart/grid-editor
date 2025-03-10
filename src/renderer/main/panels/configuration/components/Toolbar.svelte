<script lang="ts">
  import {
    isClearElementEnabled,
    isCopyElementEnabled,
    isDiscardElementEnabled,
    isOverwriteElementEnabled,
    isCopyActionsEnabled,
    isCutActionsEnabled,
    isMergeActionsEnabled,
    isRemoveActionsEnabled,
    isPasteActionsEnabled,
  } from "./Toolbar";
  import { appClipboard } from "./../../../../runtime/clipboard.store";
  import { GridEvent, GridElement } from "./../../../../runtime/runtime";
  import {
    runtime,
    user_input,
    UserInputValue,
    selected_actions,
  } from "./../../../../runtime/runtime.store";
  import MoltenToolbarButton from "../../../user-interface/MoltenToolbarButton.svelte";
  import { get } from "svelte/store";
  import {
    mergeActionsToCode,
    copyActions,
    removeActions,
    cutActions,
    discardElement,
    overwriteElement,
    copyElement,
    clearElement,
    pasteActions,
  } from "../../../../runtime/operations";
  import { appSettings } from "../../../../runtime/app-helper.store";

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

  function handleConvertToCodeBlock() {
    const selected = get(selected_actions);
    if (!selected.every((e) => e.parent === selected[0].parent)) {
      throw "Clipboard error: Mismatched clipboard";
    }

    mergeActionsToCode(selected[0].parent as GridEvent, ...selected);
  }

  function handleRemove() {
    const selected = get(selected_actions);
    if (!selected.every((e) => e.parent === selected[0].parent)) {
      throw "Clipboard error: Mismatched clipboard";
    }

    removeActions(selected[0].parent as GridEvent, ...selected);
  }

  function handleCut() {
    const selected = get(selected_actions);
    if (!selected.every((e) => e.parent === selected[0].parent)) {
      throw "Clipboard error: Mismatched clipboard";
    }

    cutActions(selected[0].parent as GridEvent, ...selected);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(event, index);
  }

  let selectedAction = undefined;

  function setToolbarHoverText(buttonText, hotkeyText) {
    selectedAction = [buttonText, hotkeyText];
  }

  function handleToolbarButtonBlur() {
    selectedAction = undefined;
  }

  const modifier =
    ctxProcess.platform() == "darwin" ||
    window.navigator.platform.indexOf("Mac") != -1
      ? ["Cmd ⌘", "Alt ⌥"]
      : ["Ctrl", "Alt"];

  let event: GridEvent;
  let element: GridElement;

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui: UserInputValue) {
    element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    event = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
  }
</script>

<div class="flex flex-col">
  <div class="grid grid-cols-[1fr_auto_auto] items-center">
    <!-- When any of the array elements is true -->
    <div class="flex flex-col truncate">
      <span class="text-gray-500 text-sm truncate">Action: </span>
      <span
        class="text-white text-sm truncate"
        class:invisible={typeof selectedAction === "undefined"}
        >{selectedAction?.at(0)}</span
      >
      <span
        class="text-white text-sm truncate"
        class:invisible={typeof selectedAction === "undefined"}
        >{selectedAction?.at(1)}</span
      >
    </div>
    <div class="flex flex-col">
      <div class="flex flex-wrap justify-end">
        <div data-testid="copy_all">
          <MoltenToolbarButton
            on:click={handleCopyElement}
            on:mouseenter={() =>
              setToolbarHoverText("Copy Element", `(${modifier[0]} + C)`)}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{ control: true, code: "KeyC" }}
            iconPath={"copy_all"}
            disabled={$isCopyElementEnabled === false}
            color={"#03cb00"}
          />
        </div>

        <div data-testid="paste_all">
          <MoltenToolbarButton
            on:click={handleOverwriteElement}
            on:mouseenter={() =>
              setToolbarHoverText(`Overwrite Element`, `(${modifier[0]} + V)`)}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{ control: true, code: "KeyV" }}
            iconPath={"paste_all"}
            disabled={!isOverwriteElementEnabled($element, $appClipboard)}
            color={"#006cb7"}
          />
        </div>

        <div data-testid="discard_changes">
          <MoltenToolbarButton
            on:click={handleDiscardElement}
            on:mouseenter={() =>
              setToolbarHoverText(
                `Discard Element Changes`,
                `(${modifier[0]} + Shift + D)`
              )}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{
              control: true,
              shift: true,
              code: "KeyD",
            }}
            iconPath={"clear_from_device_01"}
            disabled={!isDiscardElementEnabled($element)}
            color={"#ff2323"}
          />
        </div>

        <div data-testid="clear_element">
          <MoltenToolbarButton
            on:click={handleClearElement}
            on:mouseenter={() =>
              setToolbarHoverText(`Clear Element`, `(Shift + Delete)`)}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{
              shift: true,
              code: "Delete",
            }}
            iconPath={"clear_element"}
            disabled={!isClearElementEnabled($element)}
            color={"#A020F0"}
          />
        </div>
      </div>
      <div class="flex flex-wrap justify-end">
        <div data-testid="copy_action">
          <MoltenToolbarButton
            on:click={handleCopy}
            on:mouseenter={() =>
              setToolbarHoverText(`Copy Action(s)`, `(${modifier[0]} + C)`)}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{ control: true, code: "KeyC" }}
            disabled={$isCopyActionsEnabled === false}
            iconPath={"copy"}
            color={"#03cb00"}
          />
        </div>

        {#if !$appSettings.isMultiView}
          <div data-testid="paste_action">
            <MoltenToolbarButton
              on:click={handlePaste}
              on:mouseenter={() =>
                setToolbarHoverText(`Paste Action(s)`, `(${modifier[0]} + V)`)}
              on:mouseleave={handleToolbarButtonBlur}
              shortcut={{ control: true, code: "KeyV" }}
              disabled={$isPasteActionsEnabled === false}
              iconPath={"paste"}
              color={"#006cb7"}
            />
          </div>
        {/if}

        <div data-testid="cut_action">
          <MoltenToolbarButton
            on:click={handleCut}
            on:mouseenter={() =>
              setToolbarHoverText(`Cut Action(s)`, `(${modifier[0]} + X)`)}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{ control: true, code: "KeyX" }}
            disabled={$isCutActionsEnabled === false}
            iconPath={"cut"}
            color={"#ff6100"}
          />
        </div>

        <div data-testid="merge_code">
          <MoltenToolbarButton
            on:click={handleConvertToCodeBlock}
            on:mouseenter={() =>
              setToolbarHoverText(
                `Merge Action(s) into Code`,
                `(${modifier[0]} + Shift + M)`
              )}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{
              control: true,
              shift: true,
              code: "KeyM",
            }}
            disabled={$isMergeActionsEnabled === false}
            iconPath={"merge_as_code"}
            color={"#ffcc33"}
          />
        </div>

        <div data-testid="remove_action">
          <MoltenToolbarButton
            on:click={handleRemove}
            on:mouseenter={() =>
              setToolbarHoverText(`Remove Action(s)`, `(Delete)`)}
            on:mouseleave={handleToolbarButtonBlur}
            shortcut={{
              code: "Delete",
            }}
            disabled={$isRemoveActionsEnabled === false}
            iconPath={"remove"}
            color={"#ff2323"}
          />
        </div>
      </div>
    </div>
  </div>
</div>
