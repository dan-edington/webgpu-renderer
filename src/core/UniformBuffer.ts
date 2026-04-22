import { errorMessages } from './constants/errorMessages';
import { Renderer } from './Renderer';
import { uuid } from './types';
import {
  computeBufferLayout,
  writeUniformValuesToBuffer,
  type UniformEntryMeta,
  type UniformValue,
  type UniformValueInput,
} from './utilities/computeBufferLayout';

interface IUniformBuffer {
  id: uuid;
  type: string;
  buffer: GPUBuffer | null;
  uniforms: Record<string, UniformValue>;
  bufferData: ArrayBuffer | null;
  init(renderer: Renderer): void;
  updateUniform(updatedUniforms: Record<string, UniformValueInput>): void;
  writeUpdatedBufferData(): void;
  computeBufferLayout(): void;
}

class UniformBuffer implements IUniformBuffer {
  id: uuid;
  type: string;
  buffer: GPUBuffer | null = null;
  uniforms: Record<string, UniformValue>;
  bufferData: ArrayBuffer | null = null;
  needsUpdate: boolean;
  rendererInstance: Renderer | null = null;
  layoutEntries: UniformEntryMeta[] = [];

  constructor(uniforms: Record<string, UniformValue>) {
    this.id = crypto.randomUUID();
    this.type = 'UniformBuffer';
    this.uniforms = uniforms;
    this.needsUpdate = true;
    this.computeBufferLayout();
  }

  init(renderer: Renderer) {
    this.rendererInstance = renderer;

    if (!this.rendererInstance.device) throw new Error(errorMessages.missingDevice);

    if (!this.bufferData) throw new Error('Buffer data not computed');

    this.buffer = this.rendererInstance.device.createBuffer({
      size: this.bufferData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.writeUpdatedBufferData();
  }

  updateUniform(updatedUniforms: Record<string, UniformValueInput>) {
    for (const key in updatedUniforms) {
      const currentUniform = this.uniforms[key];
      if (!currentUniform) {
        continue;
      }

      const nextValue = updatedUniforms[key];

      if (typeof currentUniform.value === 'number') {
        if (typeof nextValue !== 'number') throw new Error(`Uniform '${key}' expects a number value.`);

        currentUniform.value = nextValue;
        continue;
      }

      if (typeof nextValue === 'number') {
        if (currentUniform.value.length !== 1)
          throw new Error(`Uniform '${key}' expects ${currentUniform.value.length} values, got scalar.`);

        currentUniform.value[0] = nextValue;
        continue;
      }

      if (nextValue.length !== currentUniform.value.length)
        throw new Error(`Uniform '${key}' expects ${currentUniform.value.length} values, got ${nextValue.length}.`);

      currentUniform.value.set(nextValue);
    }

    this.writeAllUniformValuesToBuffer();
    this.needsUpdate = true;
  }

  writeUpdatedBufferData() {
    if (this.needsUpdate) {
      if (!this.rendererInstance || !this.rendererInstance.device) throw new Error(errorMessages.missingDevice);

      if (!this.buffer || !this.bufferData) throw new Error('Uniform buffer not initialized');

      this.rendererInstance.device.queue.writeBuffer(this.buffer, 0, this.bufferData);
      this.needsUpdate = false;
    }
  }

  computeBufferLayout() {
    const { bufferData, layoutEntries } = computeBufferLayout(this.uniforms);
    this.bufferData = bufferData;
    this.layoutEntries = layoutEntries;
  }

  private writeAllUniformValuesToBuffer() {
    if (!this.bufferData) throw new Error('Buffer data not computed');

    writeUniformValuesToBuffer(this.uniforms, this.bufferData, this.layoutEntries);
  }
}

export { UniformBuffer };
