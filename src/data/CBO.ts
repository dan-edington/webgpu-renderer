import { Renderer } from "../renderer/renderer";
import { UBO } from "../UBO/UBO";

const buffer = new ArrayBuffer(32); // must be a multiple of 16
const uResolution = new Float32Array(buffer, 0, 2); // 2 * f32 = 2 * 4 = 8
const uCameraPosition = new Float32Array(buffer, 16, 3); // 3 * f32 = 3 * 4 = 12

function initCBO(renderer: Renderer) {
  const CBO = new UBO({
    renderer,
    buffer,
    uniforms: {
      uResolution,
      uCameraPosition,
    },
    label: "Camera Buffer Object",
  });

  CBO.updateUniforms({
    uResolution: [renderer.canvasElement.width, renderer.canvasElement.height],
    uCameraPosition: [0, 0, 0],
  });

  return CBO;
}

export { initCBO };
