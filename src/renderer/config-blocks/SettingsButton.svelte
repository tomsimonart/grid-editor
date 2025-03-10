<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sbc",
    name: "SettingsButton",
    rendering: "standard",
    category: "element settings",
    displayName: "Button Mode",
    color: "#5F416D",
    defaultLua: "self:bmo(0)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators";
  import {
    MeltCheckbox,
    Block,
    BlockBody,
    MeltCombo,
  } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  const whatsInParenthesis = /\(([^)]+)\)/;
  let bmo = "";
  let bmi = "0";
  let bma = "127";

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    const arr = config.script.split("self:").slice(1);
    const parts = {
      bmo: null,
      bmi: null,
      bma: null,
    };

    for (const [key, value] of Object.entries(parts)) {
      const index = arr.findIndex((e) => e.includes(key));
      if (index !== -1) {
        parts[key] = whatsInParenthesis.exec(arr[index])[1];
      }
    }

    bmo = parts.bmo;

    minMaxEnabled = !!parts.bmi || !!parts.bma;
    if (minMaxEnabled) {
      bmi = parts.bmi;
      bma = parts.bma;
    }
  }

  $: handleMinMaxChange(minMaxEnabled);
  function handleMinMaxChange(value) {
    sendData(bmo, bmi, bma);
    syncWithGrid();
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData(p1, p2, p3) {
    const optional = [];
    if (minMaxEnabled) {
      optional.push(`self:bmi(${p2}) self:bma(${p3})`);
    }

    dispatch("update-action", {
      short: `sbc`,
      script:
        `self:bmo(${p1})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Momentary" },
      { value: "1", info: "Toggle" },
      { value: "2", info: "3-step" },
      { value: "3", info: "4-step" },
    ],
  ];

  let minMaxEnabled = false;

  function calculateStepValues(steps, min, max) {
    const stepValue = Math.floor(Math.abs(min - max) / (steps - 1));
    const res = Array.from(
      { length: steps },
      (_, index) => min + index * stepValue
    );
    return res;
  }

  let stepValues;
  $: stepValues = calculateStepValues(
    Number(bmo) + 1,
    minMaxEnabled ? Number(bmi) : 0,
    minMaxEnabled ? Number(bma) : 127
  );

  $: sendData(bmo, bmi, bma);
</script>

<encoder-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <MeltCombo
    title={"Button Mode"}
    bind:value={bmo}
    suggestions={suggestions[0]}
    validator={(e) => {
      return new Validator(e).NotEmpty().Result();
    }}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
    on:change={syncWithGrid}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <Block>
    <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />
    <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
      <MeltCombo
        title={"Min"}
        disabled={!minMaxEnabled}
        bind:value={bmi}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        disabled={!minMaxEnabled}
        bind:value={bma}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </div>

    <BlockBody>
      Note: When Min/Max values are disabled, any changes to the default values
      will only be reset after storing.
    </BlockBody>
  </Block>

  <div
    class="flex flex-row gap-2"
    class:invisible={!minMaxEnabled || Number(bmo) === 0}
  >
    <span class="text-gray-500 text-sm">Step values:</span>
    <div class="text-white text-sm">
      {#each stepValues as step, i}
        <span>{step}</span>
        <span class:hidden={i === stepValues.length - 1} class="mr-2">,</span>
      {/each}
    </div>
  </div>
</encoder-settings>
