import { get, writable, type Writable } from "svelte/store";
import { GridAction, GridEvent } from "../../runtime/runtime";
import { dropActions, removeActions } from "../../runtime/operations";

export const draggedActions: Writable<GridAction[]> = writable([]);
export type DropTarget = { event: GridEvent; index: number };
export const dropEventTarget: Writable<DropTarget> = writable();

function getDraggedActions(action: GridAction): GridAction[] {
  const actions: GridAction[] = [];
  const event = action.parent as GridEvent;
  let index = event.config.findIndex((e) => e.id === action.id);
  let depth = 0;

  while (index < event.config.length) {
    const current = event.config[index];
    switch (current.information.type) {
      case "composite_open": {
        depth += 1;
        break;
      }
      case "composite_close": {
        depth -= 1;
        break;
      }
    }
    actions.push(current);
    ++index;
    if (depth <= 0) break;
  }

  return actions;
}

function getDraggedBlocks(actions: GridAction[]): HTMLElement[] {
  const dragged = actions
    .map((action) => document.querySelector(`[drag-id="${action.id}"]`))
    .filter((el): el is HTMLElement => el !== null);

  return dragged as HTMLElement[];
}

function createDragCursor(dragged: HTMLElement[]): HTMLElement {
  const cursor = document.createElement("div");
  cursor.id = "drag-n-drop-cursor";
  cursor.style.opacity = "0";
  cursor.style.position = "absolute";
  cursor.style.pointerEvents = "none";
  cursor.style.width = `${Math.max(...dragged.map((e) => e.clientWidth))}px`;
  cursor.style.zIndex = "9999";

  dragged.forEach((item) => {
    const copy = item.cloneNode(true) as HTMLElement;
    cursor.append(copy);
  });

  return cursor;
}

export type DragParameters = {
  action: GridAction;
  movable?: boolean;
  treshold?: number;
};

export function draggable(node: HTMLElement, params: DragParameters) {
  let cursor: HTMLElement = null;
  let threshold = params.treshold ?? 15;
  let initPos: { x: number; y: number };
  let isDragged = false;
  let dragged: HTMLElement[] = [];
  let movable = params.movable ?? true;
  node.setAttribute("drag-id", params.action.id);

  node.addEventListener("mousedown", handleMouseDown);

  function handleDragStart(x: number, y: number) {
    isDragged = true;
    initPos = { x, y };
    //for (const block of dragged) {
    //  block.style.opacity = `0.5`;
    //}
    const actions = getDraggedActions(params.action);
    draggedActions.set(actions);
    dragged = getDraggedBlocks(actions);
    cursor = createDragCursor(dragged);
    document.body.append(cursor);
  }

  function handleDragEnd(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const dropZone = target.closest(".drop-zone");

    if (dropZone) {
      dropZone.dispatchEvent(
        new DropActionEvent({ dropped: get(draggedActions) })
      );
    }

    //for (const block of dragged) {
    //  block.style.opacity = `1.0`;
    //}

    isDragged = false;
    dragged = [];
    draggedActions.set([]);
    cursor.remove();
  }

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (movable) {
      handleDragStart(e.clientX, e.clientY);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  }

  function handleMouseUp(e: MouseEvent) {
    handleDragEnd(e);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDragged) {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.opacity = `1`;

      //const distance = Math.abs(e.clientY - initPos.y);
      //const normalized = Math.min(distance, threshold) / threshold;
      //for (const block of dragged) {
      //  block.style.opacity = `${0.5 - normalized * 0.3}`;
      //}
      //cursor.style.opacity = `${normalized === 1 ? "0.8" : "0"}`;
    }
  }
}

export type DropParameters = {
  event: GridEvent;
  index: number;
  disabled?: boolean;
};

interface DropActionEventDetail {
  dropped: GridAction[];
}

// Create a custom DropActionEvent class that extends CustomEvent.
export class DropActionEvent extends CustomEvent<DropActionEventDetail> {
  constructor(detail: DropActionEventDetail) {
    super("drop-action", {
      detail,
      bubbles: true,
      cancelable: true,
    });
  }
}

export function dropzone(node: HTMLElement, params: DropParameters) {
  let disabled = params?.disabled ?? false;
  node.addEventListener("mouseover", handleMouseOver);
  node.addEventListener("mouseout", handleMouseOut);
  node.addEventListener("drop-action", handleDropAction);
  node.classList.add("drop-zone");

  function handleDropAction(e: DropActionEvent) {
    const { dropped } = e.detail;
    const { event, index } = params;
    dropActions(event, index, dropped);
  }

  function handleMouseOver() {
    if (disabled) {
      return;
    }
    dropEventTarget.set({ event: params.event, index: params.index });
  }

  function handleMouseOut() {
    if (disabled) {
      return;
    }
    dropEventTarget.set(undefined);
  }
}
