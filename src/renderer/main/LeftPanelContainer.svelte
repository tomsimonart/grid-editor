<script>
  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";
  import DebugMonitor from "./panels/DebugMonitor/DebugMonitor.svelte";
  import WebsocketMonitor from "./panels/WebsocketMonitor/WebsocketMonitor.svelte";
  import ProfileCloud from "./panels/profileCloud/ProfileCloud.svelte";
  import Packages from "./panels/packages/Packages.svelte";
  import { appSettings } from "../runtime/app-helper.store";

  import { windowSize } from "../runtime/window-size";

  import { watchResize } from "svelte-watch-resize";

  function resize() {
    $windowSize.leftSidebarWidth = $windowSize.leftSidebarWidth + 1;
  }
</script>

<!-- {#if $appSettings.leftPanelVisible == true} -->
<div class="w-full h-full" use:watchResize={resize}>
  {#if $appSettings.leftPanel == "Debug"}
    <DebugMonitor />
  {/if}

  {#if $appSettings.leftPanel == "MIDI Monitor"}
    <MidiMonitor />
  {/if}

  {#if $appSettings.leftPanel == "Websocket"}
    <WebsocketMonitor />
  {/if}

  <div
    class="w-full h-full {$appSettings.leftPanel == 'ProfileCloud'
      ? 'visible'
      : 'hidden'}"
  >
    <ProfileCloud />
  </div>

  {#if $appSettings.leftPanel == "Packages"}
    <Packages />
  {/if}
</div>

<!-- {/if} -->
<style>
  .splitpanes.modern-theme .splitpanes__pane {
    overflow: visible;
  }
</style>
