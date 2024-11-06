<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sec",
    name: "SettingsEncoder",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    displayName: "Encoder Mode",
    defaultLua: "self:emo(0) self:ev0(50)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";
  import MeltCombo from "./components/MeltCombo.svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let emo = ""; // local script part
  let ev0 = "";

  let emi = "0";
  let ema = "127";
  let ese = "100";

  const whatsInParenthesis = /\(([^)]+)\)/;

  $: handleScriptChange($config.script);

  function handleScriptChange(script) {
    const arr = script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    emo = extractParam(0);
    ev0 = extractParam(1);

    const param3 = extractParam(2);
    const param4 = extractParam(3);

    minMaxEnabled = !!param3 || !!param4;
    if (minMaxEnabled) {
      emi = param3;
      ema = param4;
    }

    const param5 = extractParam(4);
    sensitivityEnabled = !!param5;
    if (sensitivityEnabled) {
      ese = param5;
    }
  }

  $: sendData(
    emo,
    ev0,
    minMaxEnabled ? emi : undefined,
    minMaxEnabled ? ema : undefined,
    sensitivityEnabled ? ese : undefined
  );

  function sendData(p1, p2, p3, p4, p5) {
    const optional = [];

    if (minMaxEnabled) {
      optional.push(`self:emi(${p3}) self:ema(${p4})`);
    }

    if (sensitivityEnabled) {
      optional.push(`self:ese(${p5})`);
    }

    dispatch("update-action", {
      short: `sec`,
      script:
        `self:emo(${p1}) self:ev0(${p2})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Absolute" },
      { value: "1", info: "Relative BinOffset" },
      { value: "2", info: "Relative 2's Comp" },
    ],

    [
      { value: "0", info: "No velocity (0%)" },
      { value: "50", info: "Default (50%)" },
      { value: "100", info: "Maximum (100%)" },
    ],
  ];

  let suggestionElement = undefined;

  let minMaxEnabled = false;
  let sensitivityEnabled = false;
</script>

<encoder-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    <MeltCombo
      title={"Encoder Mode"}
      bind:value={emo}
      suggestions={suggestions[0]}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      on:input={(e) => {
        //emo = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Encoder Velocity"}
      bind:value={ev0}
      suggestions={suggestions[1]}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      on:input={(e) => {
        //ev0 = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </div>

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />

  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    <MeltCombo
      title={"Min"}
      disabled={!minMaxEnabled}
      bind:value={emi}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:input={(e) => {
        //emi = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Max"}
      disabled={!minMaxEnabled}
      bind:value={ema}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:input={(e) => {
        //ema = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </div>

  <MeltCheckbox bind:target={sensitivityEnabled} title={"Enable Sensitivity"} />
  <MeltCombo
    title={"Sensitivity"}
    disabled={!sensitivityEnabled}
    bind:value={ese}
    validator={(e) => {
      return minMaxEnabled
        ? new Validator(e).NotEmpty().Result()
        : new Validator(e).Result();
    }}
    on:input={(e) => {
      //ese = e.detail;
    }}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</encoder-settings>
