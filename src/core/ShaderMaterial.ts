import { errorMessages } from './constants/errorMessages';
import { Renderer } from './Renderer';
import type { UniformValueInput, uuid } from './types';
import { UniformBuffer } from './UniformBuffer';
import { UniformValue } from './utilities/computeBufferLayout';

interface IShaderMaterial {
  id: uuid;
  name?: string;
  type: string;
  shader: string;
  shaderModule: GPUShaderModule | null;
  materialUniforms?: Record<string, UniformValue>;
  materialUniformsBuffer: UniformBuffer | null;
  materialUniformsBindGroup: GPUBindGroup | null;
  pipelineDescriptor: GPURenderPipelineDescriptor | null;
  shaderEntryPoints: {
    vertex: string;
    fragment: string;
  };
  isInitialized: boolean;
  init(renderer: Renderer): void;
  updateUniforms(updatedUniforms: Record<string, UniformValueInput>): void;
}

type ShaderMaterialOptions = {
  shader: string;
  uniforms?: Record<string, UniformValue>;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
  name?: string;
};

class ShaderMaterial implements IShaderMaterial {
  id: uuid;
  name?: string;
  type: string;
  shader: string;
  shaderModule: GPUShaderModule | null = null;
  materialUniforms?: Record<string, UniformValue>;
  materialUniformsBuffer: UniformBuffer | null = null;
  materialUniformsBindGroup: GPUBindGroup | null = null;
  pipelineDescriptor: GPURenderPipelineDescriptor | null = null;
  shaderEntryPoints: {
    vertex: string;
    fragment: string;
  };
  isInitialized: boolean = false;

  constructor(options: ShaderMaterialOptions) {
    this.id = crypto.randomUUID();
    this.name = options.name;
    this.type = 'ShaderMaterial';
    this.materialUniforms = options.uniforms;
    this.shader = options.shader;
    this.shaderEntryPoints = options.shaderEntryPoints || {
      vertex: 'vertex_shader',
      fragment: 'fragment_shader',
    };

    if (this.materialUniforms) {
      this.materialUniformsBuffer = new UniformBuffer(this.materialUniforms);
    }
  }

  init(renderer: Renderer) {
    if (this.isInitialized) return;

    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    this.createShaderModule(renderer.device);

    if (this.materialUniformsBuffer) {
      this.materialUniformsBuffer.init(renderer);
      this.createMaterialUniformsBindGroup(renderer);
    }

    this.isInitialized = true;
  }

  updateUniforms(updatedUniforms: Record<string, UniformValueInput>) {
    if (!this.materialUniforms) return;

    this.materialUniformsBuffer?.updateUniform(updatedUniforms);
  }

  private createShaderModule(device: GPUDevice) {
    this.shaderModule = device.createShaderModule({
      code: this.shader,
    });
  }

  private createMaterialUniformsBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);
    if (!renderer.materialBindGroupLayout) throw new Error(errorMessages.missingMaterialBindGroupLayout);

    if (this.materialUniformsBuffer?.buffer) {
      this.materialUniformsBindGroup = renderer.device.createBindGroup({
        layout: renderer.materialBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } }],
      });
    }
  }
}

export { ShaderMaterial };
