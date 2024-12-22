import { Renderer } from "../renderer/renderer";
import type { CBO } from "../types";

const buffer = new ArrayBuffer(32); // must be a multiple of 16
const uResolution = new Float32Array(buffer, 0, 2); // 2 * f32 = 2 * 4 = 8
const uCameraPosition = new Float32Array(buffer, 16, 3); // 3 * f32 = 3 * 4 = 12
let uniformsBuffer: GPUBuffer | null = null;

function CBO(renderer?: Renderer): CBO {
  if (renderer && !uniformsBuffer) {
    uniformsBuffer = renderer.device.createBuffer({
      label: "uniform buffer",
      size: buffer.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    uCameraPosition.set([0, 0, 0], 0);
    uResolution.set([renderer.canvasElement.width, renderer.canvasElement.height], 0);
  }

  return { buffer: uniformsBuffer, data: buffer, uniforms: { uResolution, uCameraPosition } };
}

export { CBO };
