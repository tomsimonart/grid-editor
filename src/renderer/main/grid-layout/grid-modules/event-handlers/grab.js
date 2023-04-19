export function grab(node) {
  let x;
  let y;

  function handleMousedown(event) {
    x = event.clientX;
    y = event.clientY;

    node.dispatchEvent(
      new CustomEvent("grabstart", {
        detail: { x, y },
      })
    );

    window.addEventListener("mousemove", handleMousemove);
    window.addEventListener("mouseup", handleMouseup);
  }

  function handleMousemove(event) {
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    x = event.clientX;
    y = event.clientY;

    node.dispatchEvent(
      new CustomEvent("grabmove", {
        detail: { x, y, dx, dy },
      })
    );
  }

  function handleMouseup(event) {
    x = event.clientX;
    y = event.clientY;

    node.dispatchEvent(
      new CustomEvent("grabend", {
        detail: { x, y },
      })
    );

    window.removeEventListener("mousemove", handleMousemove);
    window.removeEventListener("mouseup", handleMouseup);
  }

  node.addEventListener("mousedown", handleMousedown);

  return {
    destroy() {
      node.removeEventListener("mousedown", handleMousedown);
    },
  };
}
