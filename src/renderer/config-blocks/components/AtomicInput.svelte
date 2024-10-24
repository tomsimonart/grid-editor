<script lang="ts">
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let inputValue = "";
  export let suggestions: { value: string; info: string }[] = ["asd", "test"];
  export let customClasses = "";
  export let placeholder = "";
  export let suggestionTarget: Element | undefined = undefined;
  export let validator = (text: string) => {
    return true;
  };
  export let disabled = false;

  let isError = false;
  let infoValue = "";
  let displayText: any;

  let focus: any;

  function handleValueChange(value: any) {
    //const newValue = GridScript.humanize(String(value));
    if (value !== displayText) {
      displayText = value;
    }
    infoValue =
      suggestions.find((s) => String(s.value).trim() == String(value).trim())
        ?.info ?? "";

    isError = !validator(displayText);
    dispatch("validator", { isError: isError });
  }

  $: {
    handleValueChange(inputValue);
  }

  function handleBlur(e) {
    if (inputValue !== displayText) {
      sendData(displayText);
    }
  }

  function sendData(value: any) {
    dispatch("change", value);
  }

  function handleFocus(e: any) {
    dispatch("focus");
    updateSuggestions();
  }

  function updateSuggestions() {
    if (typeof suggestionTarget !== "undefined") {
      const event = new CustomEvent("display", {
        detail: {
          data: suggestions,
          sender: inputComponent!,
        },
      });

      suggestionTarget.dispatchEvent(event);
    }
  }

  function handleSuggestionSelected(e: any) {
    const { value } = e.detail;
    displayText = value;
    sendData(displayText);
  }

  let inputComponent;

  let temp = suggestions[0];
</script>

<div class="{$$props.class} w-full relative">
  <input
    bind:this={inputComponent}
    {disabled}
    bind:value={displayText}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:suggestion-select={handleSuggestionSelected}
    type="text"
    {placeholder}
    class="{customClasses} w-full border
        focus:neumorph focus:rounded-lg
        {isError
      ? 'border-error focus:outline-error'
      : 'focus:border-select border-secondary'} bg-secondary text-white py-0.5 pl-2 rounded-none"
    class:text-opacity-50={disabled}
  />

  <div class=" py-1">
    {#if !focus && infoValue !== undefined}
      <div class="{infoValue ? 'text-gray-500' : 'text-gray-600'} text-sm">
        {infoValue}
      </div>
    {/if}
  </div>

  <MeltSelect
    bind:target={temp}
    options={suggestions.map((e) => {
      return { title: e, value: e };
    })}
  />
</div>
