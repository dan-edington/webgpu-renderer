import { Renderer } from './Renderer';

class UniformBuffer {
  buffer: GPUBuffer;
  uniforms: Record<string, any>;
  bufferData: ArrayBuffer;
  needsUpdate: boolean;
  rendererInstance: Renderer;

  constructor(uniforms: Record<string, any>, bufferData: ArrayBuffer) {
    this.uniforms = uniforms;
    this.bufferData = bufferData;
    this.needsUpdate = true;
  }

  init(renderer: Renderer) {
    this.rendererInstance = renderer;

    this.buffer = this.rendererInstance.device.createBuffer({
      size: this.bufferData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.writeUpdatedBufferData();
  }

  updateUniform(updatedUniforms: Record<string, any>) {
    for (const key in updatedUniforms) {
      if (this.uniforms.hasOwnProperty(key)) {
        this.uniforms[key].set(updatedUniforms[key], 0);
      }
    }

    this.needsUpdate = true;
  }

  writeUpdatedBufferData() {
    if (this.needsUpdate) {
      this.rendererInstance.device.queue.writeBuffer(this.buffer, 0, this.bufferData);
      this.needsUpdate = false;
    }
  }
}

export { UniformBuffer };
