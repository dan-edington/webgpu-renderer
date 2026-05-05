import { errorMessages } from '../constants/errorMessages';
import { Renderer } from '../renderer/Renderer';
import { MaterialType, UniformValue, UniformValueInput, uuid } from '../types';
import { UniformBuffer } from '../UniformBuffer';

export const enum MaterialFlag {
  None = 0,
  Alpha = 1 << 0,
  Normal = 1 << 1,
  Albedo = 1 << 2,
}

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
  transparent: boolean;
  readonly usesAlphaPipeline: boolean;
  isInitialized: boolean;
  materialFlag: MaterialFlag;
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
  transparent?: boolean;
  initialFlags?: MaterialFlag;
};

abstract class Material implements IMaterial {
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
  transparent: boolean;
  protected rendererInstance: Renderer | null = null;
  materialFlag: MaterialFlag;

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
    this.transparent = options.transparent ?? false;
    this.materialFlag = options.initialFlags ?? MaterialFlag.None;

    // materialFlag must be first to match the WGSL struct memory layout!
    this.materialUniforms = {
      materialFlag: { type: 'u32', value: this.materialFlag },
      ...(options.uniforms ?? {}),
    };

    this.materialUniformsBuffer = new UniformBuffer(this.materialUniforms);
  }

  init(renderer: Renderer) {
    if (this.isInitialized) return;

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

  get usesAlphaPipeline(): boolean {
    return this.transparent;
  }

  updateUniforms(updatedUniforms: Record<string, UniformValueInput>) {
    if (!this.materialUniforms) return;

    this.materialUniformsBuffer?.updateUniform(updatedUniforms);
  }

  protected setMaterialFlag(flag: MaterialFlag, enabled: boolean) {
    const nextFlags = enabled ? this.materialFlag | flag : this.materialFlag & ~flag;

    if (nextFlags === this.materialFlag) return;

    this.materialFlag = nextFlags as MaterialFlag;
    this.updateUniforms({ materialFlag: this.materialFlag });
  }

  private createShaderModule(device: GPUDevice) {
    if (!this.rendererInstance?.shaderLibrary) throw new Error(errorMessages.missingShaderLibrary);

    const shaderCode = this.rendererInstance.shaderLibrary.getShader(this.shader);
    if (!shaderCode) throw new Error(errorMessages.missingShaderCode);

    this.shaderModule = device.createShaderModule({
      code: shaderCode,
    });
  }

  protected recreateMaterialBindGroup() {
    if (!this.rendererInstance || !this.isInitialized) return;

    this.createMaterialBindGroup(this.rendererInstance);
  }

  protected createMaterialBindGroup(renderer: Renderer) {
    if (!renderer.materialBindGroupLayouts) throw new Error(errorMessages.missingRendererMaterialBindGroupLayouts);

    const materialBindGroupLayout = renderer.materialBindGroupLayouts.get(this.type);

    if (!materialBindGroupLayout)
      throw new Error(`${errorMessages.missingMaterialTypeBindGroupLayout} Material type: '${this.type}'.`);

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

  static getMaterialLayoutDescriptor() {
    throw new Error('getMaterialLayoutDescriptor must be implemented by subclasses of Material.');
  }
}

export { Material };
