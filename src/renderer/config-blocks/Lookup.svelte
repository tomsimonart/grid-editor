<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "glut",
    name: "Lookup",
    rendering: "standard",
    category: "variables",
    displayName: "Lookup",
    color: "#78BC61",
    defaultLua: "glut(param1,36,0,37,1)",
    icon: `<svg width="100%" height="100%" viewBox="0 0 163 212" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M67.294 15.526L123.027 0.207275L108.651 56.1951L93.2051 41.1528L43.769 90.5889L33.8695 80.6894L83.3056 31.2533L67.294 15.526Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M67.294 196.307L123.027 211.626L108.651 155.638L93.2051 170.68L43.769 121.244L33.8695 131.144L83.3056 180.58L67.294 196.307Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M112.712 76.9999L162.954 105.577L113.199 135.001L112.913 113.443L43 113.443L43 99.4427L112.913 99.4427L112.712 76.9999Z" fill="black"/>
        <path d="M35 105.5C35 115.165 27.165 123 17.5 123C7.83502 123 0 115.165 0 105.5C0 95.835 7.83502 88 17.5 88C27.165 88 35 95.835 35 105.5Z" fill="black"/>
      </svg>
    `,
    blockIcon: `<svg width="100%" height="100%" viewBox="0 0 163 212" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M67.294 15.526L123.027 0.207275L108.651 56.1951L93.2051 41.1528L43.769 90.5889L33.8695 80.6894L83.3056 31.2533L67.294 15.526Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M67.294 196.307L123.027 211.626L108.651 155.638L93.2051 170.68L43.769 121.244L33.8695 131.144L83.3056 180.58L67.294 196.307Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M112.712 76.9999L162.954 105.577L113.199 135.001L112.913 113.443L43 113.443L43 99.4427L112.913 99.4427L112.712 76.9999Z" fill="black"/>
        <path d="M35 105.5C35 115.165 27.165 123 17.5 123C7.83502 123 0 115.165 0 105.5C0 95.835 7.83502 88 17.5 88C27.165 88 35 95.835 35 105.5Z" fill="black"/>
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
  import { createEventDispatcher, onDestroy } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { GridEvent } from "./../runtime/runtime";

  import { Validator } from "./_validators";
  import { Script } from "./_script_parsers.js";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let event = config.parent as GridEvent;

  let lookupTable = {};

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    lookupTable = createLookupTable(config.script);
  }

  let suggestions = [];
  $: {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === config.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = localDefinitions;
  }

  function sendData() {
    let array = [];

    lookupTable.pairs.forEach((pair) => {
      array.push(pair.input);
      array.push(pair.output);
    });

    array = [lookupTable.source, ...array];

    const script = Script.toScript({
      short: config.short,
      array: array,
    }); // important to set the function name

    dispatch("update-action", {
      short: config.short,
      script: `${lookupTable.destination}=${script}`,
    });
  }

  function createLookupTable(script) {
    let split_script = script.split("glut");

    const destination_part = split_script[0].trim().slice(0, -1);
    let function_part = split_script[1].trim().slice(1, -1).split(",");

    const source = function_part[0];
    const pairs = function_part.slice(1);

    let pairObjects = [];
    for (let i = 0; i < pairs.length; i += 2) {
      pairObjects.push({ input: pairs[i], output: pairs[i + 1] });
    }

    return {
      destination: destination_part,
      source: source,
      pairs: pairObjects,
    };
  }

  function addNewLine() {
    lookupTable.pairs = [...lookupTable.pairs, ["", ""]];
    sendData();
    dispatch("sync");
  }

  function removeLine(i) {
    lookupTable.pairs.splice(i, 1);
    lookupTable.pairs = [...lookupTable.pairs];
    sendData();
    dispatch("sync");
  }
</script>

<config-lookup
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <MeltCombo
    title={"Source"}
    {suggestions}
    placeholder={"Incoming value to match"}
    bind:value={lookupTable.source}
    validator={(e) => {
      return new Validator(e).NotEmpty().Result();
    }}
    on:input={(e) => {
      sendData();
    }}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <div class="w-full p-2 flex flex-col">
    <div class="flex text-gray-500 text-sm">
      <div class="w-1/2">Input</div>
      <div class="w-1/2 -ml-2">Output</div>
    </div>

    {#each lookupTable.pairs as pair, i (i)}
      <div class="w-full flex local-defs py-2">
        <div class="w-1/2 pr-1">
          <input
            class="py-0.5 pl-1 w-full bg-secondary text-white"
            placeholder="input"
            bind:value={pair.input}
            on:input={(e) => {
              sendData();
            }}
            on:change={() => dispatch("sync")}
          />
        </div>
        <div class="w-1/2 pl-1">
          <input
            class="py-0.5 pl-1 w-full bg-secondary text-white"
            placeholder="output"
            bind:value={pair.output}
            on:input={(e) => {
              sendData();
            }}
            on:change={() => dispatch("sync")}
          />
        </div>
        {#if i !== 0}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            on:click={() => {
              removeLine(i);
            }}
            class="flex items-center group cursor-pointer pl-1"
          >
            <svg
              class="w-5 h-5 p-1 fill-current group-hover:text-white text-gray-500"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
              />
              <path
                d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
              />
            </svg>
          </div>
        {:else}
          <div class="flex invisible items-center group cursor-pointer pl-1">
            <div class="w-5 h-5 p-1">x</div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <MeltCombo
    title={"Destination"}
    placeholder={"Variable name to load the lookup result"}
    {suggestions}
    bind:value={lookupTable.destination}
    on:input={(e) => {
      //lookupTable.destination = e.detail;
      sendData();
    }}
    validator={(e) => {
      return new Validator(e).NotEmpty().Result();
    }}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <div class="w-full flex group p-2">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      on:click={() => {
        addNewLine();
      }}
      class="group-hover:border-pick cursor-pointer group-hover:bg-select-saturate-10 border-secondary transition-colors duration-300 w-full border-l-4 text-white pl-4 py-0.5"
    >
      Add new pair...
    </div>
  </div>
</config-lookup>

<style>
  .local-defs:first-child {
    padding-top: 0;
  }
</style>
