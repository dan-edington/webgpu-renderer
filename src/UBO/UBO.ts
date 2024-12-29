import type { IUBO, IUBOOptions, UniformsList, IRenderer } from "../types";

class UBO implements IUBO {
  #needsUpdate: boolean = false;
  #renderer: IRenderer;
  label: string;
  gpuBuffer: GPUBuffer;
  uniforms: UniformsList;
  bufferData: ArrayBuffer;

  constructor(options: IUBOOptions) {
    const { label, renderer, buffer, uniforms } = options;

    this.#renderer = renderer;
    this.label = label || "";

    if (this.#renderer.device) {
      this.gpuBuffer = this.#renderer.device.createBuffer({
        label: this.label,
        size: buffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    } else {
      throw new Error("Device is not available.");
    }

    this.bufferData = buffer;
    this.uniforms = uniforms;
  }

  updateUniforms(updatedUniforms: UniformsList) {
    for (const key in updatedUniforms) {
      if (this.uniforms.hasOwnProperty(key) && this.uniforms[key] instanceof Float32Array) {
        this.uniforms[key].set(updatedUniforms[key], 0);
      }
    }

    this.#needsUpdate = true;
  }

  writeUpdatedBufferData() {
    if (this.#needsUpdate && this.#renderer.device) {
      this.#renderer.device.queue.writeBuffer(this.gpuBuffer, 0, this.bufferData);
      this.#needsUpdate = false;
    }
  }
}

export { UBO };
export type { IUBO, IUBOOptions };
