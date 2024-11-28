<script lang="ts">
  import { GridEvent } from "./../../../../runtime/runtime.ts";
  import { user_input } from "./../../../../runtime/runtime.store";
  import {
    appClipboard,
    ClipboardKey,
  } from "./../../../../runtime/clipboard.store";
  import { fade } from "svelte/transition";
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  export let text;
</script>

<container class="relativ flex w-full">
  <div
    class="text-white/50 w-full grid grid-cols-[1fr_auto] py-2 my-4 px-5 justify-between items-center gap-2 bg-white/5"
    in:fade={{ delay: 200 }}
  >
    <span class="text-start line-clamp-3 flex-grow">{text}</span>
  </div>
</container>
