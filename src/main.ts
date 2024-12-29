import "./style.css";
import { createRenderer } from "./renderer/renderer";
import { simpleShaderPipeline } from "./pipelines/simpleShaderPipeline";
import { initCBO } from "./data/CBO";

const renderer = await createRenderer({ canvasOptions: { className: "webgpu-canvas" } });

if (!renderer) {
  throw new Error("Failed to create renderer");
}

if (renderer) {
  const CBO = initCBO(renderer);

  renderer.setOnResize((width, height) => {
    CBO.updateUniforms({ uResolution: [width, height] });
  });

  simpleShaderPipeline(renderer, CBO.bufferObject);

  let t = 0;

  function renderLoop() {
    if (renderer && CBO.bufferObject) {
      t = performance.now() / 1000;

      CBO.writeUpdatedBufferData();

      renderer.render();

      requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}
