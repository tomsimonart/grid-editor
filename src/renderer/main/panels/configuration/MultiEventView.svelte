<script lang="ts">
  import ActionList from "./ActionList.svelte";
  import { GridElement } from "./../../../runtime/runtime.ts";
  import { user_input_event } from "./Configuration.ts";
  import MoltenModal from "./../../modals/MoltenModal.svelte";

  const element: GridElement = $user_input_event.parent;

  $: {
    $element.events.forEach((e) => {
      e.load();
    });
  }
</script>

<MoltenModal width={500}>
  <svelte:fragment slot="content">
    <div class="grid grid-flow-col auto-cols-fr">
      {#each $element.events as event}
        <ActionList {event} />
      {/each}
    </div>
  </svelte:fragment>
</MoltenModal>
