import "./style.css";
import { createRenderer } from "./renderer/renderer";
import { simpleShaderPipeline } from "./simpleShaderPipeline";
import { initDebug } from "./debug";

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

initDebug(params, { color, scale });

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
