<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  // Props
  export let value = "";
  export let placeholder = "Enter text...";
  export let disabled = false;
  export let validator = (text: string) => true; // A default validator

  let isError = false; // Error state
  let input: HTMLInputElement;

  // Handle input change
  function handleInput() {
    const display = input.value;
    isError = !validator(display);
    console.log(display);
    //dispatch("input", display);
  }

  function handleBlur() {
    const display = input.value;
    if (!isError) {
      //dispatch("change", display); // Finalize change on blur
    }
  }

  $: {
    console.log(value);
  }
</script>

<!-- Template -->
<div class="input-wrapper">
  <input
    bind:this={input}
    id="text-input"
    type="text"
    bind:value
    {placeholder}
    {disabled}
    class="w-full border
    focus:neumorph focus:rounded-lg
    {isError
      ? 'border-error focus:outline-error'
      : 'focus:border-select border-secondary'}
    bg-secondary text-white py-0.5 pl-2 rounded-none"
    class:text-opacity-50={disabled}
    on:input={handleInput}
    on:blur={handleBlur}
  />
</div>
