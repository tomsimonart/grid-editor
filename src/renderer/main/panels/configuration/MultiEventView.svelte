<script lang="ts">
  import {
    user_input,
    type UserInputValue,
  } from "./../../../runtime/runtime.store.ts";
  import ActionList from "./ActionList.svelte";
  import { GridElement } from "./../../../runtime/runtime.ts";
  import MoltenModal from "./../../modals/MoltenModal.svelte";

  let element: GridElement;

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui: UserInputValue) {
    element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
  }

  $: {
    $element?.events.forEach((e) => {
      e.load();
    });
  }
</script>

<MoltenModal width={500}>
  <svelte:fragment slot="content">
    <div class="grid grid-flow-col auto-cols-fr">
      {#each $element?.events as event}
        <ActionList {event} />
      {/each}
    </div>
  </svelte:fragment>
</MoltenModal>
