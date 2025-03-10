<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  import { Analytics } from "../runtime/analytics.js";
  import buildVariables from "../../../buildVariables.json";

  const ipcRenderer = window.sketchyAPI;
  const configuration = window.ctxProcess.configuration();

  enum UpdateState {
    UPTODATE = "update to date",
    AVAILABLE = "available",
    DOWNLOADING = "downloading",
    SUCCESS = "success",
    ERROR = "error",
  }

  let state = UpdateState.UPTODATE;
  let progress = 0;
  let error = "";
  let version = "";
  let updateFromStableToNightly = false;

  function restartApp() {
    window.electron.updater.restartAfterUpdate();
  }

  window.electron.updater.onAppUpdate((_event, value) => {
    switch (value.code) {
      case "update-available": {
        version = value.version;
        state = UpdateState.AVAILABLE;
        updateFromStableToNightly =
          buildVariables.BUILD_ENV == "production" &&
          version.includes("nightly");
        break;
      }

      case "update-downloaded": {
        state = UpdateState.SUCCESS;
        break;
      }

      case "update-progress": {
        state = UpdateState.DOWNLOADING;
        progress = Math.floor(value.percent);
        break;
      }

      case "update-error": {
        Analytics.track({
          event: "AppUpdate",
          payload: {
            message: "Update Error",
          },
          mandatory: false,
        });
        state = UpdateState.ERROR;
        error = value.error;
        break;
      }
    }
  });

  function handleInstallUpdate() {
    Analytics.track({
      event: "AppUpdate",
      payload: {
        message: "Start Update",
      },
      mandatory: false,
    });
    window.electron.installUpdate();
  }

  function handleCloseClicked(e) {
    Analytics.track({
      event: "AppUpdate",
      payload: {
        message: "Skip Update",
      },
      mandatory: false,
    });
    state = UpdateState.UPTODATE;
  }

  function handleDownloadClicked(e) {
    Analytics.track({
      event: "AppUpdate",
      payload: {
        message: "Manual Download",
      },
      mandatory: false,
    });
    window.electron.openInBrowser(configuration.EDITOR_DOWNLOAD_URL);
  }
</script>

<container class:hidden={state === UpdateState.UPTODATE} class="relative">
  <div
    class="flex flex-row gap-5 items-center justify-center w-full bg-blue-600 p-2"
  >
    {#if state === UpdateState.AVAILABLE}
      <div class="flex flex-col">
        <div class="font-bold text-white">
          New {version.includes("nightly") ? "Nightly " : ""}version is
          available!
        </div>
        <div class="text-white">
          Grid Editor version {version} is ready to be downloaded.
        </div>
      </div>
      <div class={updateFromStableToNightly ? "bg-red-600 rounded" : ""}>
        <MoltenPushButton
          click={handleInstallUpdate}
          text={updateFromStableToNightly ? "Update to Nightly" : "Download"}
        />
      </div>
      <MoltenPushButton click={handleCloseClicked} text="Close" />
    {/if}
    {#if state === UpdateState.DOWNLOADING}
      <div class="flex flex-col">
        <p class="text-white font-bold">Downloading update...</p>
        <p class="text-white">
          {`Downloading in the background ${progress}%`}
        </p>
      </div>
    {/if}

    {#if state === UpdateState.SUCCESS}
      <div class="flex flex-col">
        <p class="text-white font-bold">Update Successful!</p>
        <p class="text-white">It will be installed on restart. Restart now?</p>
      </div>
      <MoltenPushButton click={restartApp} text="Restart" />
      <MoltenPushButton click={handleCloseClicked} text="Close" />
    {/if}

    {#if state === UpdateState.ERROR}
      <div class="flex flex-col">
        <p class="font-bold text-white">Error during update!</p>
        <p class="text-white">
          Please visit the website and pick the download for your operating
          system!
        </p>
      </div>
      <MoltenPushButton click={handleDownloadClicked} text="Download" />
      <MoltenPushButton click={handleCloseClicked} text="Close" />
    {/if}
  </div>
</container>
