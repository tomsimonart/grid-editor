<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "gtt",
    name: "TimerStart",
    category: "timer",
    rendering: "standard",
    displayName: "Start",
    color: "#95638D",
    defaultLua: "gtt(self:ind(),1000)",
    icon: `
    <svg height="100%" width="100%" viewBox="0 0 384 384" xmlns="http://www.w3.org/2000/svg">
      <path d="m343.59375 101.039062c-7.953125 3.847657-11.28125 13.417969-7.433594 21.367188 10.511719 21.714844 15.839844 45.121094 15.839844 69.59375 0 88.222656-71.777344 160-160 160s-160-71.777344-160-160 71.777344-160 160-160c36.558594 0 70.902344 11.9375 99.328125 34.519531 6.894531 5.503907 16.976563 4.351563 22.480469-2.566406 5.503906-6.914063 4.351562-16.984375-2.570313-22.480469-33.652343-26.746094-76-41.472656-119.238281-41.472656-105.863281 0-192 86.136719-192 192s86.136719 192 192 192 192-86.136719 192-192c0-29.335938-6.40625-57.449219-19.039062-83.527344-3.839844-7.96875-13.441407-11.289062-21.367188-7.433594zm0 0"/><path d="m192 64c-8.832031 0-16 7.167969-16 16v112c0 8.832031 7.167969 16 16 16h80c8.832031 0 16-7.167969 16-16s-7.167969-16-16-16h-64v-96c0-8.832031-7.167969-16-16-16zm0 0"/>
    </svg>
    `,
    blockIcon: `
    <svg height="100%" width="100%" viewBox="0 0 384 384" xmlns="http://www.w3.org/2000/svg">
      <path d="m343.59375 101.039062c-7.953125 3.847657-11.28125 13.417969-7.433594 21.367188 10.511719 21.714844 15.839844 45.121094 15.839844 69.59375 0 88.222656-71.777344 160-160 160s-160-71.777344-160-160 71.777344-160 160-160c36.558594 0 70.902344 11.9375 99.328125 34.519531 6.894531 5.503907 16.976563 4.351563 22.480469-2.566406 5.503906-6.914063 4.351562-16.984375-2.570313-22.480469-33.652343-26.746094-76-41.472656-119.238281-41.472656-105.863281 0-192 86.136719-192 192s86.136719 192 192 192 192-86.136719 192-192c0-29.335938-6.40625-57.449219-19.039062-83.527344-3.839844-7.96875-13.441407-11.289062-21.367188-7.433594zm0 0"/><path d="m192 64c-8.832031 0-16 7.167969-16 16v112c0 8.832031 7.167969 16 16 16h80c8.832031 0 16-7.167969 16-16s-7.167969-16-16-16h-64v-96c0-8.832031-7.167969-16-16-16zm0 0"/>
    </svg>
    `,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { Validator } from "./_validators";
  import { GridEvent } from "./../runtime/runtime";

  export let config;

  const dispatch = createEventDispatcher();
  let event = config.parent as GridEvent;

  const parameterNames = ["Element Number", "Time"];
  const validators = [
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
  ];

  let scriptSegments = [];

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    scriptSegments = Script.toSegments({
      short: config.short,
      script: config.script,
    });
  }

  function sendData(e, index) {
    scriptSegments[index] = e;
    const script = Script.toScript({
      short: config.short,
      array: scriptSegments,
    });
    dispatch("update-action", { short: config.short, script: script });
  }

  let suggestions = [];

  const _suggestions = [[], []];

  $: {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === config.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = _suggestions.map((s, i) => {
      // SKIP LAYER
      return [...s, ...localDefinitions];
    });
  }
</script>

<timer-start
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    {#each scriptSegments as script, i}
      <MeltCombo
        title={parameterNames[i]}
        bind:value={script}
        suggestions={suggestions[i]}
        validator={validators[i]}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:input={(e) => {
          sendData(e.detail, i);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </div>
</timer-start>
