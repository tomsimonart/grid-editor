<script>
  import { tooltip } from "./../_actions/tooltip.ts";
  import { get } from "svelte/store";
  import { logger } from "./../../runtime/runtime.store";
  import { appSettings } from "../../runtime/app-helper.store";
  import { writeBuffer } from "../../runtime/engine.store.ts";
  import { runtime, user_input } from "../../runtime/runtime.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import { Analytics } from "../../runtime/analytics.js";
  import { fade, blur } from "svelte/transition";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { connection_manager } from "../../serialport/serialport";
  import PortSelector from "./PortSelector.svelte";

  let isChanges = false;
  let changes = 0;
  $: if ($runtime) {
    changes = runtime.unsavedChangesCount();
    isChanges = changes > 0;
  }

  function clearOverlays() {
    if (get(moduleOverlay) === "configuration-load-overlay") {
      moduleOverlay.close();
    }
    selectedConfigStore.set(undefined);
  }

  function handleStore() {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pagestore",
      message: `Store configurations on page...`,
    });
    Analytics.track({
      event: "Page Config",
      payload: {
        click: "Store",
      },
      mandatory: false,
    });

    const index = $user_input.pagenumber;
    runtime
      .storePage(index)
      .then((res) => {
        clearOverlays();
        selectedConfigStore.set(undefined);
        logger.set({
          type: "success",
          mode: 0,
          classname: "pagestore",
          message: `Store complete!`,
        });
      })
      .catch((e) => {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pagestore",
          message: `Unsuccessful page store! Please retry!`,
        });
      });
  }

  function handleClear() {
    const ui = get(user_input);
    runtime
      .clearPage(ui.pagenumber)
      .then(() => {
        clearOverlays();
        logger.set({
          type: "success",
          mode: 0,
          classname: "pageclear",
          message: `Page clear complete!`,
        });
      })
      .catch((e) => {
        console.warn(e);
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pageclear",
          message: `Unsuccessful page clear! Please retry!`,
        });
      });

    Analytics.track({
      event: "Page Config",
      payload: {
        click: "Clear",
      },
      mandatory: false,
    });
  }

  function handleDiscard() {
    if (isChanges) {
      const ui = get(user_input);
      runtime
        .discardPage(ui.pagenumber)
        .then(() => {
          clearOverlays();
          logger.set({
            type: "success",
            mode: 0,
            classname: "pagediscard",
            message: `Discard complete!`,
          });
        })
        .catch((e) => {
          console.warn(e);
          logger.set({
            type: "alert",
            mode: 0,
            classname: "pagediscard",
            message: `Unsuccessful page discard! Please retry!`,
          });
        });

      Analytics.track({
        event: "Page Config",
        payload: {
          click: "Discard",
        },
        mandatory: false,
      });
    }
  }

  const ports = connection_manager.ports;

  function handleConnectModules(e) {
    navigator.tryConnectGrid().catch((e) => {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "serialerror",
        message: `Serial connect failed, your browser is not supperted yet.`,
      });
    });
  }
</script>

<container
  in:fade={{ delay: 300, duration: 1000 }}
  out:blur={{ duration: 150 }}
  class={$$props.class}
>
  <div class="flex flex-row justify-center items-center gap-2">
    <PortSelector visible={$ports.length > 1} disabled={isChanges} />
    <div class="flex flex-col">
      <div class="mx-4 text-white font-medium">
        {changes} active changes
      </div>
      {#if $appSettings.persistent.writeBufferDebugEnabled}
        <div class="mx-4 text-white font-medium">
          writeBuffer: {$writeBuffer.length}
        </div>
      {/if}
    </div>

    <div
      use:tooltip={{
        key: "configuration_header_clear",
        placement: "top",
        class: "w-60 p-4 z-10",
      }}
    >
      <MoltenPushButton
        click={handleDiscard}
        disabled={!isChanges}
        text="Discard All"
      />
    </div>
    <div
      use:tooltip={{
        key: "configuration_header_store",
        placement: "top",
        class: "w-60 p-4",
      }}
    >
      <MoltenPushButton
        click={handleStore}
        disabled={!isChanges}
        text="Store"
        style="accept"
      />
    </div>

    <div
      use:tooltip={{
        key: "configuration_header_clear",
        placement: "top",
        class: "w-60 p-4",
        buttons: [
          {
            label: "Cancel",
            handler: undefined,
          },
          { label: "Confirm", handler: handleClear },
        ],
        triggerEvents: ["show-buttons", "hover"],
      }}
    >
      <MoltenPushButton text="Clear" />
    </div>
    {#if window.ctxProcess.buildVariables().BUILD_TARGET === "web"}
      <MoltenPushButton
        text="Connect"
        style={"outlined"}
        click={handleConnectModules}
      />
    {/if}
  </div>
</container>
