import {
  derived,
  get,
  type Writable,
  writable,
  type Readable,
} from "svelte/store";

import { runtime, user_input } from "../../../runtime/runtime.store";
import { GridAction, GridEvent } from "../../../runtime/runtime";

export let lastOpenedActionblocks = writable([]);

export function lastOpenedActionblocksInsert(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set([
    ...currentList.filter((e) => e !== short),
    short,
  ]);
}

export function lastOpenedActionblocksRemove(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set(currentList.filter((e) => e !== short));
}

// Derive a readable store from user_input
export const user_input_event: Readable<GridEvent | undefined> = derived(
  user_input,
  ($user_input, set) => {
    const event = runtime.findEvent(
      $user_input.dx,
      $user_input.dy,
      $user_input.pagenumber,
      $user_input.elementnumber,
      $user_input.eventtype
    );

    if (typeof event === "undefined") {
      return;
    }

    if (event.isLoaded()) {
      set(event);
      return;
    }

    // Load the event and set it
    event
      .load()
      .then(() => {
        set(event);
      })
      .catch((err) => {
        console.error("Failed to load event:", err);
        set(undefined); // Handle loading error by setting undefined
      });
    return;
  }
);

export const selected_actions: Writable<GridAction[]> =
  create_selected_actions_store();

function create_selected_actions_store() {
  const internal: Writable<GridAction[]> = writable([]);
  user_input_event.subscribe(() => {
    internal.set([]);
  });
  return internal;
}
