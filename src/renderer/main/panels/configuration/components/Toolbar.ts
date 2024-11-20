import { derived } from "svelte/store";
import { runtime } from "../../../../runtime/runtime.store";
import {
  appClipboard,
  ClipboardData,
  ClipboardKey,
} from "../../../../runtime/clipboard.store";
import { ElementData } from "../../../../runtime/runtime";
import { selected_actions } from "../Configuration";

export const isCutActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return $selected_actions.length > 0;
  }
);

export const isCopyElementEnabled = derived(
  [selected_actions],
  ([$selected_actions]) => {
    return $selected_actions.length === 0 && runtime.modules.length > 0;
  }
);

export const isCopyActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return $selected_actions.length > 0;
  }
);

export const isMergeActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return $selected_actions.length > 0;
  }
);

export const isPasteActionsEnabled = derived(appClipboard, ($appClipboard) => {
  return $appClipboard?.key === ClipboardKey.ACTION_BLOCKS;
});

export const isRemoveActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return $selected_actions.length > 0;
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
