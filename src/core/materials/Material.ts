import { errorMessages } from '../constants/errorMessages';
import { Renderer } from '../Renderer';
import { MaterialType, UniformValue, UniformValueInput, uuid } from '../types';
import { UniformBuffer } from '../UniformBuffer';

interface IMaterial {
  id: uuid;
  name?: string;
  type: MaterialType;
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
  getPipelineCacheKey(): string;
  updateUniforms(updatedUniforms: Record<string, UniformValueInput>): void;
}

type MaterialOptions = {
  shader: string;
  uniforms?: Record<string, UniformValue>;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
  name?: string;
  type: MaterialType;
};

class Material implements IMaterial {
  id: uuid;
  name?: string;
  type: MaterialType;
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
  protected rendererInstance: Renderer | null = null;

  constructor(options: MaterialOptions) {
    this.id = crypto.randomUUID();
    this.name = options.name;
    this.type = options.type;
    this.materialUniforms = options.uniforms;
    this.shader = options.shader;
    this.shaderEntryPoints = options.shaderEntryPoints ?? {
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

    this.rendererInstance = renderer;

    this.createShaderModule(renderer.device);

    if (this.materialUniformsBuffer) {
      this.materialUniformsBuffer.init(renderer);
    }

    this.createMaterialBindGroup(renderer);

    this.isInitialized = true;
  }

  getPipelineCacheKey(): string {
    return this.type;
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

  protected recreateMaterialBindGroup() {
    if (!this.rendererInstance || !this.isInitialized) return;

    this.createMaterialBindGroup(this.rendererInstance);
  }

  protected createMaterialBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    const materialBindGroupLayout = renderer.getMaterialBindGroupLayout(this.type);
    const entries = this.getBindGroupEntries(renderer);

    if (entries.length > 0) {
      this.materialUniformsBindGroup = renderer.device.createBindGroup({
        layout: materialBindGroupLayout,
        entries,
      });
    }
  }

  protected getBindGroupEntries(_renderer: Renderer): GPUBindGroupEntry[] {
    if (!this.materialUniformsBuffer?.buffer) return [];

    return [{ binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } }];
  }
}

export { Material };
