<script>
  import { ConfigTarget } from "./../configuration/Configuration.store.js";
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { moduleOverlay } from "../../../runtime/moduleOverlay";

  import { Analytics } from "../../../runtime/analytics.js";

  import { get } from "svelte/store";

  import { logger, runtime, user_input } from "../../../runtime/runtime.store";

  import { authStore, AuthEnvironment } from "$lib/auth.store"; // this only changes if login, logout happens
  import { userStore } from "$lib/user.store";
  import { configLinkStore } from "$lib/configlink.store";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";
  import { modal } from "../../modals/modal.store";
  import UserLogin from "../../modals/UserLogin.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import "@intechstudio/profile-cloud-webcomponent";

  const configuration = window.ctxProcess.configuration();
  const buildVariables = window.ctxProcess.buildVariables();

  $: profileCloudIsMounted && sendAuthEventToProfileCloud($authStore);

  $: sendConfigLinkToProfileCloud($configLinkStore);

  $: handleRuntimeChange($runtime);

  function handleRuntimeChange(rt) {
    const compatible = new Set([]);
    for (const device of rt) {
      const module = device.type;
      const elements = device.pages[0].control_elements.map((e) => e.type);
      compatible.add(module);
      elements.forEach((item) => compatible.add(item));
    }
    sendCompatibleTypes(Array.from(compatible));
  }

  function sendCompatibleTypes(types) {
    sendMessageToProfileCloud({
      messageType: "compatibleTypes",
      compatibleTypes: types,
    });
  }

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui) {
    const target = ConfigTarget.createFrom({ userInput: ui });
    if (typeof target === "undefined") {
      return;
    }

    selectedModuleType = get(runtime).find(
      (device) => device.dx == ui.dx && device.dy == ui.dy
    ).type;
    selectedControlElementType = target.elementType;
    sendSelectedComponentInfos(selectedModuleType, selectedControlElementType);
  }

  let selectedModuleType = undefined;
  let selectedControlElementType = undefined;

  function channelMessageWrapper(event, func) {
    const channel = event.ports[0];
    if (channel) {
      channel.onmessage = (event) =>
        func(event)
          .then((res) => {
            console.log(func.name);
            channel.postMessage({ ok: true, data: res });
          })
          .catch((err) => {
            channel.postMessage({ ok: false, data: err });
          })
          .finally(() => {
            channel.close();
          });
    }
  }

  function sendConfigLinkToProfileCloud(storeValue) {
    sendMessageToProfileCloud({
      messageType: "configLink",
      configLinkId: storeValue.id,
    });
  }

  function sendSelectedComponentInfos(
    selectedModuleType,
    selectedControlElementType
  ) {
    sendMessageToProfileCloud({
      messageType: "selectedComponentTypes",
      selectedComponentTypes: [selectedModuleType, selectedControlElementType],
    });
  }

  function sendAuthEventToProfileCloud(authEvent) {
    if (!authEvent) return;

    // the authStore should contain an event!
    if (!authEvent.event) return;

    sendMessageToProfileCloud({
      messageType: "userAuthentication",
      authEvent: authEvent,
    });
  }

  function sendLocalConfigs(configs) {
    sendMessageToProfileCloud({
      messageType: "localConfigs",
      configs,
    });
  }

  async function handleLoginToProfileCloud(event) {
    modal.show({ component: UserLogin });
  }

  async function handleCreateCloudConfigLink(event) {
    return await window.electron.clipboard.writeText(event.data.configLinkUrl);
  }

  async function handleLogoutFromProfileCloud(event) {
    return await authStore.logout();
  }

  async function handleSubmitAnalytics(event) {
    const { payload, eventName } = event.data;
    Analytics.track({
      event: eventName,
      payload: payload,
      mandatory: false,
    });
    return;
  }

  async function handleProvideSelectedConfigForEditor(event) {
    selectedConfigStore.set(event.data.config);
    if (typeof get(selectedConfigStore) !== "undefined") {
      moduleOverlay.show("configuration-load-overlay");
    } else {
      if (get(moduleOverlay) === "configuration-load-overlay") {
        moduleOverlay.close();
      }
    }
  }

  async function handleDeleteLocalConfig(event) {
    const path = $appSettings.persistent.profileFolder;
    const config = event.data?.config;

    return await window.electron.configs.deleteConfig(path, "configs", config);
  }

  async function handleGetCurrentConfigurationFromEditor(event) {
    return new Promise((resolve) => {
      const configType = event.data.configType;

      const ui = get(user_input);
      runtime
        .fetch_page_configuration_from_grid({
          dx: ui.dx,
          dy: ui.dy,
          page: ui.pagenumber,
        })
        .then((desc) => {
          const ui = get(user_input);

          const configs = get(runtime);

          let name = undefined;
          let description = "Click here to add description";
          let id = uuidv4();

          let config = {
            name: name,
            id: id,
            description: description,
            configType: configType, // differentiator from different JSON files!
            version: {
              major: $appSettings.version.major,
              minor: $appSettings.version.minor,
              patch: $appSettings.version.patch,
            },
            localId: id,
          };

          configs.forEach((d) => {
            if (d.dx == ui.dx && d.dy == ui.dy) {
              const page = d.pages.find((x) => x.pageNumber == ui.pagenumber);

              if (configType === "profile") {
                config.type = selectedModuleType;
                config.configs = page.control_elements.map((element) => {
                  return {
                    controlElementNumber: element.elementIndex,
                    events: element.events.map((ev) => {
                      return {
                        event: ev.type,
                        config: ev.config,
                      };
                    }),
                  };
                });
              } else if (configType === "preset") {
                const element = page.control_elements.find(
                  (elemet) => elemet.elementIndex === ui.elementnumber
                );

                const current = ConfigTarget.createFrom({ userInput: ui });
                const type = current.getElement().type;

                config.type = type;
                config.configs = {
                  events: element.events.map((ev) => {
                    return {
                      event: ev.type,
                      config: ev.config,
                    };
                  }),
                };
              }
            }
          });
          config.name = `New ${config.type} config`;
          resolve(config);
        })
        .catch((e) => {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "profileclouderror",
            message: e,
          });
        });
    });
  }

  let profileCloudIsMounted = false;
  async function handleProfileCloudMounted(event) {
    console.log("profile cloud is mounted received");
    profileCloudIsMounted = true;
    let authEnvironment = AuthEnvironment.PRODUCTION;
    if (event.data.environment && event.data.environment !== "production") {
      authEnvironment = AuthEnvironment.DEVELOPMENT;
    }
    authStore.setCurrentAuthEnvironment(authEnvironment);
    if (
      selectedModuleType !== undefined ||
      selectedControlElementType !== undefined
    ) {
      sendSelectedComponentInfos(
        selectedModuleType,
        selectedControlElementType
      );
    }
    const path = $appSettings.persistent.profileFolder;
    window.electron.configs.onSendConfigsToRenderer((_event, configs) => {
      sendLocalConfigs(configs);
    });
    window.electron.configs.startConfigsWatch(path, "configs");
    return configuration.EDITOR_VERSION;
  }

  async function handleImportConfig(event) {
    const path = $appSettings.persistent.profileFolder;
    const config = event.data;
    const importName = config.name;

    return window.electron.configs.saveConfig(path, "configs", config);
  }

  async function handleSendLogMessage(event) {
    const logData = event.data;
    logger.set(logData);
  }

  async function handleOpenExternalLink(event) {
    const { link } = event.data;
    if (window.ctxProcess.buildVariables().BUILD_TARGET === "web") {
      window.open(link);
    } else {
      window.electron.openInBrowser(link);
    }
  }

  function initChannelCommunication(event) {
    if (event.ports && event.ports.length) {
      switch (event.data) {
        case "profileCloudMounted":
          channelMessageWrapper(event, handleProfileCloudMounted);
          break;
        case "configImportCommunication":
          channelMessageWrapper(event, handleImportConfig);
          break;
        case "deleteLocalConfig":
          channelMessageWrapper(event, handleDeleteLocalConfig);
          break;
        case "getCurrenConfigurationFromEditor":
          channelMessageWrapper(event, handleGetCurrentConfigurationFromEditor);
          break;
        case "loginToProfileCloud":
          channelMessageWrapper(event, handleLoginToProfileCloud);
          break;
        case "logoutFromProfileCloud":
          channelMessageWrapper(event, handleLogoutFromProfileCloud);
          break;
        case "createCloudConfigLink":
          channelMessageWrapper(event, handleCreateCloudConfigLink);
          break;
        case "submitAnalytics":
          channelMessageWrapper(event, handleSubmitAnalytics);
          break;
        case "provideSelectedConfigForEditor":
          channelMessageWrapper(event, handleProvideSelectedConfigForEditor);
          break;
        case "sendLogMessage":
          channelMessageWrapper(event, handleSendLogMessage);
          break;
        case "openExternalLink":
          channelMessageWrapper(event, handleOpenExternalLink);
          break;
      }
    }
  }

  let listenerRegistered = false;
  let profileCloudUrl = "";
  let offlineMode = false;
  let profileCloudWebComponentName = undefined;

  $: if (
    listenerRegistered === true &&
    (profileCloudUrl !== $appSettings.persistent.profileCloudUrl || offlineMode)
  ) {
    // listenerRegistered variable makes sure that the webcomponent loading is after registering the listener.
    // otherwise handleProfileCloudMounted might be missed and offline fallback is displayed
    console.log("INSIDE EVENT HANDLER");
    if (profileCloudUrl !== $appSettings.persistent.profileCloudUrl) {
      offlineMode = false;
      profileCloudUrl = $appSettings.persistent.profileCloudUrl;
      profileCloudIsMounted = false;
      profileCloudWebComponentName = undefined;
    }

    let fixedUrl = profileCloudUrl;
    if (!fixedUrl.endsWith(".js")) {
      if (fixedUrl.endsWith("/")) {
        fixedUrl = `${fixedUrl}wc/components.js`;
      } else {
        fixedUrl = `${fixedUrl}/wc/components.js`;
      }
    }
    if (offlineMode) {
      profileCloudWebComponentName = "profile-cloud-offline";
    } else {
      import(fixedUrl)
        .then(() => {
          if (profileCloudUrl === configuration.PROFILE_CLOUD_URL_DEV) {
            profileCloudWebComponentName = "profile-cloud-nightly";
          } else if (profileCloudUrl === configuration.PROFILE_CLOUD_URL_PROD) {
            profileCloudWebComponentName = "profile-cloud-prod";
          } else if (profileCloudUrl.includes("profile-cloud-dev--pr")) {
            profileCloudWebComponentName = "profile-cloud-pr";
          } else {
            profileCloudWebComponentName = "profile-cloud-dev";
          }
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }

  onMount(async () => {
    // get to know the user
    await userStore.known;
    console.log("profile cloud is mounted status", profileCloudIsMounted);
    console.log("Profile Cloud url", $appSettings.persistent.profileCloudUrl);
    window.addEventListener("message", initChannelCommunication);
    listenerRegistered = true;
  });

  onDestroy(() => {
    console.log("De-initialize Profile Cloud");
    window.removeEventListener("message", initChannelCommunication);
    if (get(moduleOverlay) === "configuration-load-overlay") {
      moduleOverlay.close();
    }
    selectedConfigStore.set(undefined);
    window.electron.configs.stopConfigsWatch();
  });

  let error = {
    type: "default",
    title: "Sorry, can't load Profile Cloud",
    text: "You need internet access to load it. You can load the offline version as well.",
  };

  function sendMessageToProfileCloud(message) {
    let messageTarget = window;

    if (!messageTarget?.postMessage) return;

    messageTarget.postMessage(message, "*");
  }

  function handleMouseOut(e) {
    //Removed due to textArea losing focus when in edit mode
    //window.focus();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="flex flex-col bg-primary w-full h-full relative">
  {#if !profileCloudIsMounted}
    <div class="flex items-center justify-center h-full absolute">
      <div class="p-4">
        <h1 class="text-white text-xl">{error.title}</h1>
        <div class="text-white text-opacity-80 mb-2">
          {error.text}
        </div>
        {#if error.type === "default"}
          <MoltenPushButton
            click={() => {
              offlineMode = true;
            }}
            text="Load Offline"
          />
        {/if}
      </div>
    </div>
  {/if}
  {#if profileCloudWebComponentName}
    <svelte:element this={profileCloudWebComponentName} class="w-full h-full" />
  {/if}
</div>
