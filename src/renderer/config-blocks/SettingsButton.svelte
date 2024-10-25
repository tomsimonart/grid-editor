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
  import MeltCombo from "./components/MeltCombo.svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let bmo = ""; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let bmi = "0";
  let bma = "127";

  $: handleConfigChange(config);

  function handleConfigChange(config) {
    const arr = config.script.split("self:").slice(1);
    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : "";
    };

    bmo = extractParam(0);

    const param2 = extractParam(1);
    const param3 = extractParam(2);

    minMaxEnabled = !!param2 || !!param3;
    if (minMaxEnabled) {
      bmi = param2;
      bma = param3;
    }
  }

  function sendData() {
    const optional = [];
    if (minMaxEnabled) {
      optional.push(`self:bmi(${bmo}) self:bma(${bma})`);
    }

    dispatch("output", {
      short: `sbc`,
      script:
        `self:bmo(${bmo})` +
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

  let suggestionElement = undefined;
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

  $: {
    if (minMaxEnabled) {
      sendData();
    }
  }
</script>

<encoder-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <MeltCombo
    title={"Button Mode"}
    value={bmo}
    suggestions={suggestions[0]}
    on:change={(e) => {
      bmo = e.detail;
      sendData();
    }}
    validator={(e) => {
      return new Validator(e).NotEmpty().Result();
    }}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />
  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    <MeltCombo
      title={"Min"}
      disabled={!minMaxEnabled}
      value={bmi}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:change={(e) => {
        bmi = e.detail;
        sendData();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Max"}
      disabled={!minMaxEnabled}
      value={bma}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:change={(e) => {
        bma = e.detail;
        sendData();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </div>

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
