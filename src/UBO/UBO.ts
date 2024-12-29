import { Renderer } from "../renderer/renderer";

type UniformsList = Record<string, Float32Array | number[]>;

interface IUBOOptions {
  renderer: Renderer;
  buffer: ArrayBuffer;
  uniforms: UniformsList;
  label?: string;
}

interface IUBO {
  label: string;
  bufferObject?: GPUBuffer;
  bufferData?: ArrayBuffer;
  uniforms?: UniformsList;
  updateUniforms(updatedUniforms: UniformsList): void;
  writeUpdatedBufferData(): void;
}

class UBO implements IUBO {
  #needsUpdate: boolean = false;
  #renderer: Renderer;
  label: string;
  bufferObject: GPUBuffer;
  uniforms: UniformsList;
  bufferData: ArrayBuffer;

  constructor(options: IUBOOptions) {
    const { label, renderer, buffer, uniforms } = options;

    this.#renderer = renderer;
    this.label = label || "";

    this.bufferObject = renderer.device.createBuffer({
      label: this.label,
      size: buffer.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

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
    if (this.#needsUpdate) {
      this.#renderer.device.queue.writeBuffer(this.bufferObject, 0, this.bufferData);
      this.#needsUpdate = false;
    }
  }
}

export { UBO };
export type { IUBO, IUBOOptions };
