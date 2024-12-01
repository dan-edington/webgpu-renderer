import { Pane } from "tweakpane";

function initDebug(params: Record<string, any>, dependencies: Record<string, any>) {
  const debugPane = new Pane();

  debugPane
    .addBinding(params, "color", {
      color: { type: "float" },
    })
    .on("change", (event) => {
      const { r, g, b, a } = event.value;
      dependencies.color.set([r, g, b, a], 0);
    });

  debugPane
    .addBinding(params, "scale", {
      min: -2.0,
      max: 2.0,
    })
    .on("change", (event) => {
      const s = event.value;
      dependencies.scale.set([s], 0);
    });
}

export { initDebug };
