<script>
  import { get } from "svelte/store";
  /*
STATE 0 | No notification (Init state)
STATE 1 | Mismatch notofic.   | Event   -> STATE 2
STATE 2 | Waiting for bootl.  | Event   -> STATE 3
STATE 3 | Bootloader detected | Button  -> STATE 4 (starts automated upload process)
STATE 4 | Update in progress  | Event   -> STATE 5 (Success) or STATE 6 (Error)
STATE 5 | Success             | Timeout -> STATE 0 (Close notification)
STATE 6 | Error               | Button  -> STATE 0 (Close notification)
*/

  import { onMount } from "svelte";

  import { appSettings } from "../runtime/app-helper.store";
  import { runtime } from "../runtime/runtime.store";

  import { fade } from "svelte/transition";
  import { escape } from "svelte/internal";

  import { Analytics } from "../runtime/analytics.js";

  const configuration = window.ctxProcess.configuration();

  let fwMismatch = false;

  let dotdotdot = "";

  let flagBootloaderCheck = 0;
  let booloaderConnectionCheck = undefined;

  let bootloader_path = undefined;

  const startBootloaderCheck = () => {
    if (flagBootloaderCheck === 1) {
      return;
    }

    booloaderConnectionCheck = setInterval(() => find_bootloader_path(), 750);
    flagBootloaderCheck = 1;
  };

  const stopBootloaderCheck = () => {
    ////console.log("Stop Trying")
    clearInterval(booloaderConnectionCheck);
    flagBootloaderCheck = 0;
  };

  // check for parsed modules
  $: {
    let firmwareMismatchFound = false;

    if ($runtime.modules.length === 0) {
      startBootloaderCheck();
      if ($appSettings.firmwareNotificationState == 1) {
        $appSettings.firmwareNotificationState = 2;
      }
    } else {
      stopBootloaderCheck();
    }

    // check modules for firmware mismatch
    runtime.modules.forEach((device) => {
      if ($appSettings.firmwareNotificationState == 6) {
        $appSettings.firmwareNotificationState = 0;
        uploadProgressText = "";
        bootloader_path = undefined;
      }

      if (device.fwMismatch === true) {
        firmwareMismatchFound = true;
      }
    });

    // if mismatch is found, show notification
    if (firmwareMismatchFound === true) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 1;
        return s;
      });

      // only if mismatch is not already detected
      if (fwMismatch === false) {
        Analytics.track({
          event: "FirmwareCheck",
          payload: {
            message: "Mismatch Detected",
          },
          mandatory: false,
        });
        fwMismatch = true;
      }
    } else {
      fwMismatch = false;
    }
  }

  let text = "";
  let uploadProgressText = "";

  window.electron.firmware.onFirmwareUpdate((_event, value) => {
    if (value.code !== undefined) {
      if (value.code == 3 && $appSettings.firmwareNotificationState == 4) {
        return;
      }

      if ($appSettings.firmwareNotificationState == 5) {
        return; // already in success state
      }

      //console.log("Set state from ", $appSettings.firmwareNotificationState, " to ",  value.code)
      $appSettings.firmwareNotificationState = value.code;

      if (value.message !== undefined) {
        uploadProgressText = value.message;
      }

      // when the firmware update is successful, reset the notification state
      if (value.code == 5) {
        setTimeout(() => {
          $appSettings.firmwareNotificationState = 0;
        }, 2000);
      }
    }
  });

  onMount(() => {
    startBootloaderCheck();

    if (ctxProcess.platform() == "darwin") {
      text = "Command + Shift + R";
    } else {
      text = "Ctrl + Shift + R";
    }
  });

  async function find_bootloader_path() {
    //console.log("Try Detect Bootloader")

    const value = await window.electron.firmware.findBootloaderPath();

    if (value !== undefined) {
      if (
        $appSettings.firmwareNotificationState == 1 ||
        $appSettings.firmwareNotificationState == 2 ||
        $appSettings.firmwareNotificationState == 6
      ) {
        //console.log("Successfuly detection", value.path)

        bootloader_path = value.path;
      } else {
        //console.log("Dont care detection", value.path)
        bootloader_path = value.path;
      }

      //stopBootloaderCheck();
    } else {
      if (
        $appSettings.firmwareNotificationState == 4 ||
        $appSettings.firmwareNotificationState == 5 ||
        $appSettings.firmwareNotificationState == 6
      ) {
        bootloader_path = undefined;
        //console.log("Disconnect but no problem")
      } else {
        //console.log("Disconnect from state", $appSettings.firmwareNotificationState)

        if (typeof bootloader_path !== "undefined") {
          ////console.log("Disconnect because lost", $appSettings.firmwareNotificationState)

          bootloader_path = undefined;
          uploadProgressText = "Bootloader connection lost!";
          $appSettings.firmwareNotificationState = 6;
        }
      }
    }
  }

  async function firmwareDownload(nightly) {
    const folder = $appSettings.persistent.profileFolder;
    const { product, architecture } =
      await window.electron.firmware.findBootloaderPath();

    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        message: "Firmware Download Start",
      },
      mandatory: false,
    });

    let link = undefined;
    switch (product) {
      case "grid":
        if (nightly) {
          switch (architecture) {
            case "esp32":
              link = configuration.FIRMWARE_GRID_NIGHTLY_ESP32_URL;
              break;
            case "d51":
              link = configuration.FIRMWARE_GRID_NIGHTLY_D51_URL;
              break;
          }
        } else {
          const as = get(appSettings);
          let version = undefined;
          switch (architecture) {
            case "esp32":
              version = `v${Object.values(as.firmware_esp32_required).join(
                "."
              )}`;
              break;
            case "d51":
              version = `v${Object.values(as.firmware_d51_required).join(".")}`;
              break;
          }
          if (typeof version !== "undefined") {
            link =
              configuration.FIRMWARE_GRID_URL_BEGINING +
              version +
              configuration.FIRMWARE_GRID_URL_END;
          }
        }
        break;
      case "knot":
        link =
          configuration.FIRMWARE_KNOT_URL_BEGINING +
          configuration.FIRMWARE_KNOT_URL_END;
        break;
    }

    console.log("URL", link);

    await window.electron.firmware.firmwareDownload(
      folder,
      product,
      architecture,
      link
    );

    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        message: "Firmware Download Finished",
      },
      mandatory: false,
    });
  }

  async function firmwareTroubleshooting() {
    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        click: "Troubleshooting",
      },
      mandatory: false,
    });

    const url = configuration.DOCUMENTATION_TROUBLESHOOTING_URL;
    window.electron.openInBrowser(url);
  }
</script>

{#if $appSettings.firmwareNotificationState === 1}
  <div
    class="w-full bg-red-600 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2"><b>Oops, firmware mismatch is detected! </b></div>
      <div class="mx-2">
        Reconnect your module in bootloader mode by holding the utility button
        while plugging in the USB cable!
      </div>
    </div>
  </div>
{/if}

{#if $appSettings.firmwareNotificationState === 2}
  <div
    class="w-full bg-blue-600 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2">
        <b>Waiting for the bootloader to enumerate {dotdotdot} </b>
      </div>
      <div class="mx-2">Connect the module in bootloader mode!</div>
    </div>
    <div in:fade|global={{ delay: 8000 }}>
      <button
        on:click={firmwareTroubleshooting}
        class="bg-blue-700 hover:bg-red-800 ml-2 py-1 px-2 border-none font-medium text-white focus:outline-none rounded"
      >
        <div>Troubleshooting Options</div>
      </button>
    </div>
  </div>
{/if}

{#if $appSettings.firmwareNotificationState === 3}
  <div
    class="w-full bg-blue-500 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2">
        <b>{uploadProgressText}</b>
        {bootloader_path}
      </div>
      <div class="mx-2">
        Click Update to start the automatic update process!
      </div>
    </div>

    <button
      on:click={() => firmwareDownload(false)}
      class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
    >
      Update Firmware
    </button>

    <button
      on:click={() => firmwareDownload(true)}
      class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
      class:hidden={!$appSettings.persistent.nightlyFirmware}
    >
      Update (Nightly)
    </button>
  </div>
{/if}

{#if $appSettings.firmwareNotificationState === 4}
  <div
    class="w-full bg-blue-500 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2">
        <b>Update is in progress... </b>
      </div>
      <div class="mx-2">{uploadProgressText}</div>
    </div>
  </div>
{/if}

{#if $appSettings.firmwareNotificationState === 5}
  <div
    class="w-full bg-green-500 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2"><b>{uploadProgressText}</b></div>
      <div class="mx-2">Have fun!</div>
    </div>
  </div>
{/if}

{#if $appSettings.firmwareNotificationState === 6}
  <div
    class="w-full bg-red-500 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2">
        <b>{uploadProgressText}</b>
      </div>
      <div class="mx-2">Click close message</div>
    </div>

    <button
      on:click={() => {
        $appSettings.firmwareNotificationState = 0;
      }}
      class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
    >
      Dismiss
    </button>
  </div>
{/if}
