<script lang="ts">
  import { GridEvent } from "./../../../../runtime/runtime";
  import {
    dropEventTarget,
    dropzone,
    draggedActions,
  } from "../../../_actions/move.action";

  export let index: number;
  export let event: GridEvent;
  export let threshold = 15;

  let disabled = false;

  $: {
    if (
      $dropEventTarget?.event === event &&
      $dropEventTarget?.index === index
    ) {
      let targetIndexes = $draggedActions.map((action) =>
        event.config.findIndex((e) => e.id === action.id)
      );
      const targetMinIndex = Math.min(...targetIndexes);
      const targetMaxIndex = Math.max(...targetIndexes);

      if (index >= targetMinIndex && index <= targetMaxIndex + 1) {
        disabled = true;
      } else {
        disabled = false;
      }
    }
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
