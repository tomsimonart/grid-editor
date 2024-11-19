<script lang="ts">
  import { GridEvent } from "./../../../../runtime/runtime";
  import {
    dropEventTarget,
    dropzone,
    draggedActions,
    type DropTarget,
  } from "../../../_actions/move.action";

  export let index: number;
  export let event: GridEvent;
  export let threshold = 15;

  let disabled = false;

  $: handleDropEventTargetChange($dropEventTarget);

  function handleDropEventTargetChange(target: DropTarget) {
    if (target?.index !== index) {
      return;
    }

    // Always droppable
    const crossDrop = $draggedActions.every(
      (e) => (e.parent as GridEvent) !== event
    );
    if (crossDrop) {
      disabled = false;
      return;
    }

    const targetIndexes = $draggedActions.map((action) =>
      event.config.findIndex((e) => e.id === action.id)
    );

    const [targetMinIndex, targetMaxIndex] = [
      Math.min(...targetIndexes),
      Math.max(...targetIndexes),
    ];

    disabled = index >= targetMinIndex && index <= targetMaxIndex + 1;
  }
</script>

<div
  class="block select-none focus:outline-none border-none outline-none relative h-5"
>
  <div
    class="opacity-0 hover:opacity-75 w-full transition-opacity duration-300 flex items-center absolute top-1/2 -translate-y-1/2"
    style="height: calc(100% + {threshold}px)"
    use:dropzone={(this, { event: event, disabled: disabled, index: index })}
  >
    <div
      class="h-2 w-full rounded-full {disabled ? 'bg-error' : 'bg-commit'}"
    />
  </div>
</div>
