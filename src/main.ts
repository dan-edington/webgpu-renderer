import "./style.css";
import { createRenderer } from "./renderer/renderer";
import { simpleShaderPipeline } from "./pipelines/simpleShaderPipeline";
import { CBO } from "./data/CBO";

const renderer = await createRenderer({ canvasOptions: { className: "webgpu-canvas" } });

if (!renderer) {
  throw new Error("Failed to create renderer");
}

const { buffer: CBOBuffer, data: CBOData, uniforms: CBOUniforms } = CBO(renderer);

if (renderer && CBOBuffer) {
  simpleShaderPipeline(renderer, CBOBuffer);

  let t = 0;

  function renderLoop() {
    if (renderer && CBOBuffer) {
      t = performance.now() / 1000;

      renderer.device.queue.writeBuffer(CBOBuffer, 0, CBOData);

      renderer.render();

      requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}
