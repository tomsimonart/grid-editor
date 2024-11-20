import { derived } from "svelte/store";
import { config_panel_blocks } from "../Configuration";
import { runtime } from "../../../../runtime/runtime.store";
import {
  appClipboard,
  ClipboardData,
  ClipboardKey,
} from "../../../../runtime/clipboard.store";
import { ElementData } from "../../../../runtime/runtime";

export const isCutActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export const isCopyElementEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return (
      !$config_panel_blocks.some((e) => e.selected) &&
      runtime.modules.length > 0
    );
  }
);

export const isCopyActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export const isMergeActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export const isPasteActionsEnabled = derived(appClipboard, ($appClipboard) => {
  return $appClipboard?.key === ClipboardKey.ACTION_BLOCKS;
});

export const isRemoveActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export function isClearElementEnabled(data: ElementData) {
  return typeof data !== "undefined";
}

export function isOverwriteElementEnabled(
  data: ElementData,
  clipboard: ClipboardData
) {
  if (typeof clipboard === "undefined" || typeof data === "undefined") {
    return false;
  }

  return (
    clipboard.key === ClipboardKey.ELEMENT &&
    data.isCompatible((clipboard.payload as ElementData).type)
  );
}

export function isDiscardElementEnabled(data: ElementData) {
  if (typeof data === "undefined") {
    return false;
  }

  return data.hasChanges();
}
