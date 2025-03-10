<script>
  import { onMount } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Analytics } from "../../../runtime/analytics.js";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { logger } from "../../../runtime/runtime.store";

  onMount(async () => {
    refreshPackageList();
  });

  $: $appSettings.persistent.enabledPackages,
    $appSettings.packageList,
    refreshPackagePreferences();

  let packagePreferenceComponents = [];
  let packagePathInput = "";

  function refreshPackagePreferences() {
    const loadedPackages = $appSettings.persistent.enabledPackages;
    const packageList = $appSettings.packageList;
    const loadedPackageDetails = loadedPackages
      .map((id) => packageList.find((e) => e.id == id))
      .filter((e) => e);

    const newComponents = [];
    packagePreferenceComponents.forEach((preference) => {
      if (
        loadedPackageDetails
          .map((e) => e.preferenceComponent)
          .includes(preference.componentName)
      ) {
        newComponents.push(preference);
      }
    });
    loadedPackageDetails.forEach((_package) => {
      if (
        _package.preferenceComponent &&
        !newComponents
          .map((e) => e.componentName)
          .includes(_package.preferenceComponent)
      ) {
        newComponents.push({
          componentName: _package.preferenceComponent,
          packageId: _package.id,
        });
      }
    });
    packagePreferenceComponents = newComponents;
  }

  function changePackageStatus(packageId, enabled) {
    if (enabled) {
      window.packageManagerPort?.postMessage({
        type: "load-package",
        id: packageId,
        payload: $appSettings.persistent.packagesDataStorage[packageId],
      });
    } else {
      window.packageManagerPort?.postMessage({
        type: "unload-package",
        id: packageId,
      });
    }

    Analytics.track({
      event: "Package Manager",
      payload: {
        click: "Status Change",
        id: packageId,
        status: enabled ? "enabled" : "disabled",
      },
      mandatory: false,
    });
  }

  function refreshPackageList() {
    window.packageManagerPort?.postMessage({ type: "refresh-package-list" });
  }

  function downloadPackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "download-package",
      id: packageId,
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Download", id: packageId },
      mandatory: false,
    });
  }

  function uninstallPackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "uninstall-package",
      id: packageId,
    });
    appSettings.update((s) => {
      delete s.persistent.packagesDataStorage[packageId];
      return s;
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Uninstall", id: packageId },
      mandatory: false,
    });
  }

  function removePackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "remove-package",
      id: packageId,
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Remove", id: packageId },
      mandatory: false,
    });
  }

  function updatePackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "update-package",
      id: packageId,
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Update", id: packageId },
      mandatory: false,
    });
  }

  async function addPackageRepository() {
    Analytics.track({
      event: "Package Manager",
      payload: { click: "Add repository", url: packagePathInput },
      mandatory: false,
    });

    const regexPattern = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?.*/;
    let matches = packagePathInput.match(regexPattern);

    if (matches) {
      const owner = matches[1];
      const repositoryName = matches[2];

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repositoryName}/contents/package.json`,
          {
            method: "GET",
            headers: {
              Accept: "application/vnd.github.v3.raw",
              "User-Agent": "Grid Editor",
            },
          }
        );

        if (response.ok) {
          const packageJsonText = await response.text();
          const packageInfo = JSON.parse(packageJsonText);
          const packageName = packageInfo.description;
          const packageId = packageInfo.name;
          window.packageManagerPort?.postMessage({
            type: "add-github-repository",
            id: packageId,
            packageName,
            gitHubRepositoryOwner: owner,
            gitHubRepositoryName: repositoryName,
          });
        } else {
          logger.set({
            type: "fail",
            message: `Failed to fetch package.json!`,
          });
        }
      } catch (error) {
        logger.set({
          type: "fail",
          message: `Failed to fetch package.json: ${error.message}`,
        });
      }
      return;
      //packageRepositoryUrlInput = "";
    }
    //Try to match for local path
    const pathRegex =
      /^(\/[^./\0]+(\/[^./\0]*)*|[a-zA-Z]:(\\[^<>:"/\\|?*]+)+\\?|~(\/[^./\0]+)*)$/;
    matches = packagePathInput.match(pathRegex);
    if (matches) {
      window.packageManagerPort?.postMessage({
        type: "add-local-package",
        rootPath: packagePathInput,
      });
    } else {
      logger.set({
        type: "fail",
        message: "Couldn't detect valid Github repository or absolute path!",
      });
    }
  }

  function approveRequest(request) {
    window.packageManagerPort?.postMessage({
      type: "add-local-package",
      rootPath: request.rootPath,
    });
    removeRequest(request);
  }

  function removeRequest(request) {
    appSettings.update((s) => {
      let list = s.developerPackagesRequested ?? [];
      let newList = list.filter((e) => e.id != request.id);
      s.developerPackagesRequested = newList;
      return s;
    });
  }

  function restartPackageManager() {
    $appSettings.packageManagerRunning = false;
    window.electron.restartPackageManager();
  }
</script>

<preferences
  class="bg-primary flex flex-col h-full w-full text-white p-4 overflow-y-auto"
>
  <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
    <div class="flex py-2 text-white items-center">
      <div class="mx-2">Packages</div>
      <div class="mx-2">
        <MoltenPushButton click={restartPackageManager} text="Restart" />
      </div>
      <div class="mx-2">
        <MoltenPushButton click={refreshPackageList} text="Refresh" />
      </div>
    </div>
    {#each $appSettings.packageList as _package}
      <div class="flex py-2 text-white items-center">
        <input
          class="bg-primary my-1"
          type="checkbox"
          checked={_package.status === "Enabled"}
          style="visibility:{(_package.status === 'Downloaded' &&
            _package.loadable) ||
          _package.status === 'Enabled'
            ? 'visible'
            : 'hidden'}"
          on:change={async (e) =>
            changePackageStatus(_package.id, e.target.checked)}
        />
        <div class="mx-1">{_package.name}</div>
        {#if _package.packageVersion}
          <div class="mx-1">{_package.packageVersion}</div>
        {/if}
        {#if _package.status == "Downloading" || _package.status == "Uninstalled"}
          <div class="mx-1">
            <MoltenPushButton
              click={() => {
                downloadPackage(_package.id);
              }}
              disabled={_package.status == "Downloading"}
              text="Download"
            />
          </div>
          {#if _package.removable === true}
            <div class="mx-1">
              <MoltenPushButton
                click={() => {
                  removePackage(_package.id);
                }}
                text="Remove"
              />
            </div>
          {/if}
        {:else if _package.canUpdate}
          <div class="mx-1">
            <MoltenPushButton
              click={() => {
                updatePackage(_package.id);
              }}
              text="Update"
            />
          </div>
        {:else if _package.uninstallable}
          <div class="mx-1">
            <MoltenPushButton
              click={() => {
                uninstallPackage(_package.id);
              }}
              text="Uninstall"
            />
          </div>
        {:else if _package.removable}
          <div class="mx-1">
            <MoltenPushButton
              click={() => {
                removePackage(_package.id);
              }}
              text="Remove"
            />
          </div>
        {/if}
      </div>
    {/each}
    {#each $appSettings.developerPackagesRequested as request}
      <div class="flex py-2 text-white items-center">
        <div class="mx-1">{request.name}</div>
        <div class="mx-1">
          <MoltenPushButton
            click={() => {
              approveRequest(request);
            }}
            text="Approve"
          />
        </div>
        <div class="mx-1">
          <MoltenPushButton
            click={() => {
              removeRequest(request);
            }}
            text="Reject"
          />
        </div>
      </div>
    {/each}
  </div>

  <div class="bg-secondary p-2 mb-4 rounded-lg flex text-white items-center">
    <input
      class="bg-primary mr-2 w-full"
      type="text"
      bind:value={packagePathInput}
    />
    <MoltenPushButton click={addPackageRepository} text="Add repository" />
  </div>

  {#if !$appSettings.packageManagerRunning}
    <p class="loading">Restarting package manager</p>
  {/if}

  <div
    class="bg-secondary rounded-lg flex flex-col mb-4 {packagePreferenceComponents.length >
    0
      ? 'block'
      : 'none'}"
  >
    {#each packagePreferenceComponents as preference}
      {#key $appSettings.packageComponentKeys[preference.packageId]}
        <svelte:element this={preference.componentName} />
      {/key}
    {/each}
  </div>
</preferences>

<style>
  .loading:after {
    content: " .";
    animation: dots 1s steps(5, end) infinite;
  }
  @keyframes dots {
    0%,
    20% {
      color: rgba(0, 0, 0, 0);
      text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
    }
    40% {
      color: white;
      text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
    }
    60% {
      text-shadow: 0.25em 0 0 white, 0.5em 0 0 rgba(0, 0, 0, 0);
    }
    80%,
    100% {
      text-shadow: 0.25em 0 0 white, 0.5em 0 0 white;
    }
  }
</style>
