import "./style.css";
import { Renderer } from "./renderer/renderer";
import { simpleShaderPipeline } from "./pipelines/simpleShaderPipeline";
import { initCBO } from "./data/CBO";
import type { IUBO } from "./UBO/UBO";
import { IRenderer } from "./types";

const renderer = new Renderer({ canvasOptions: { className: "webgpu-canvas" } }) as IRenderer;
await renderer.init();

if (renderer) {
  const UBOList: IUBO[] = [];
  const CBO = initCBO(renderer);
  UBOList.push(CBO);

  renderer.canvas.onResize = (width, height) => {
    CBO.updateUniforms({ uResolution: [width, height] });
  };

  simpleShaderPipeline(renderer, CBO.gpuBuffer);

  function renderLoop() {
    if (renderer && CBO.gpuBuffer) {
      // Update UBOs
      for (let i = 0; i < UBOList.length; i++) {
        UBOList[i].writeUpdatedBufferData();
      }

      // Render pipelines
      renderer.render();

      requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}
