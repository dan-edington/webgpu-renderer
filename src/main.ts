import "./style.css";
import { createRenderer } from "./renderer/renderer";
import { simpleShaderPipeline } from "./simpleShaderPipeline";
import { initDebug } from "./debug";
import { createCamera } from "./camera/camera";
import { mat4, vec3 } from "gl-matrix";

const renderer = await createRenderer({ canvasOptions: { className: "webgpu-canvas" } });

const _modelMatrix = mat4.create();
// mat4.rotate(_modelMatrix, _modelMatrix, Math.PI, [0, 0, 1]);

const params = {
  color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
  scale: 1.0,
};

const uniformsBufferValues = new ArrayBuffer(224);
const color = new Float32Array(uniformsBufferValues, 0, 4); // 4 * f32 = 4 * 4 = 16
const scale = new Float32Array(uniformsBufferValues, 16, 1); // 1 * f32 = 1 * 4 = 4
const projectionMatrix = new Float32Array(uniformsBufferValues, 32, 16); // 16 * f32 = 16 * 4 = 64
const viewMatrix = new Float32Array(uniformsBufferValues, 96, 16); // 16 * f32 = 16 * 4 = 64
const modelMatrix = new Float32Array(uniformsBufferValues, 160, 16); // 16 * f32 = 16 * 4 = 64

color.set([params.color.r, params.color.g, params.color.b, params.color.a], 0);
scale.set([params.scale], 0);
modelMatrix.set(_modelMatrix, 0);

initDebug(params, { color, scale });

const camera = createCamera(projectionMatrix, viewMatrix);

window.addEventListener("resize", () => {
  camera.calculateProjectionMatrix();
});

if (renderer) {
  const uniformsBuffer = renderer.device.createBuffer({
    label: "uniform buffer",
    size: uniformsBufferValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  simpleShaderPipeline(renderer, uniformsBuffer);

  let t = 0;

  function renderLoop() {
    if (renderer) {
      t = performance.now() / 1000;

      renderer.device.queue.writeBuffer(uniformsBuffer, 0, uniformsBufferValues);

      renderer.render();

      requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}
