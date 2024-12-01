import "./style.css";
import { createRenderer } from "./renderer/renderer";
import { simpleShaderPipeline } from "./simpleShaderPipeline";
import { Pane } from "tweakpane";

const renderer = await createRenderer({ canvasOptions: { className: "webgpu-canvas" } });

const params = {
  color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
  scale: 1.0,
};

const uniformsBufferValues = new ArrayBuffer(32);
const color = new Float32Array(uniformsBufferValues, 0, 4);
const scale = new Float32Array(uniformsBufferValues, 16, 1);
color.set([params.color.r, params.color.g, params.color.b, params.color.a], 0);
scale.set([params.scale], 0);

const debugPane = new Pane();
debugPane
  .addBinding(params, "color", {
    color: { type: "float" },
  })
  .on("change", (event) => {
    const { r, g, b, a } = event.value;
    color.set([r, g, b, a], 0);
  });

debugPane
  .addBinding(params, "scale", {
    min: -2.0,
    max: 2.0,
  })
  .on("change", (event) => {
    const s = event.value;
    scale.set([s], 0);
  });

if (renderer) {
  const uniformsBuffer = renderer.device.createBuffer({
    label: "uniform buffer",
    size: uniformsBufferValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  simpleShaderPipeline(renderer, uniformsBuffer);

  function renderLoop() {
    if (renderer) {
      renderer.device.queue.writeBuffer(uniformsBuffer, 0, uniformsBufferValues);

      renderer.render();

      requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}
