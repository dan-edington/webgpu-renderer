import { errorMessages } from '../constants/errorMessages';
import { Renderer } from '../renderer/Renderer';
import { MaterialType, UniformValue, UniformValueInput, uuid } from '../types';
import { UniformBuffer } from '../renderer/UniformBuffer';

export const enum MaterialFlags {
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
  shaderEntryPoints: {
    vertex: string;
    fragment: string;
  };
  readonly usesAlphaPipeline: boolean;
  isInitialized: boolean;
  materialFlags: MaterialFlags;
  doubleSided: boolean;
  transparent: boolean;
  depthWrite: boolean;
  init(rendererInstance: Renderer): void;
  getPipelineCacheKey(): string;
  updateUniforms(updatedUniforms: Record<string, UniformValueInput>): void;
}

export type MaterialOptions = {
  shader: string;
  uniforms?: Record<string, UniformValue>;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
  name?: string;
  type: MaterialType;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
  initialFlags?: MaterialFlags;
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
  shaderEntryPoints: {
    vertex: string;
    fragment: string;
  };
  protected rendererInstance: Renderer | null = null;
  isInitialized: boolean = false;
  materialFlags: MaterialFlags;
  doubleSided: boolean = false;
  transparent: boolean;
  depthWrite: boolean = true;

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
    this.materialFlags = options.initialFlags ?? MaterialFlags.None;
    this.doubleSided = options.doubleSided ?? false;
    this.depthWrite = options.depthWrite ?? true;

    // materialFlag must be first to match the WGSL struct memory layout!
    this.materialUniforms = {
      materialFlags: { type: 'u32', value: this.materialFlags },
      ...(options.uniforms ?? {}),
    };

    if (this.type === 'custom') {
      delete this.materialUniforms.materialFlags;
    }

    this.materialUniformsBuffer = new UniformBuffer(this.materialUniforms);
  }

  init(rendererInstance: Renderer) {
    if (this.isInitialized || !rendererInstance.shaderLibrary) return;

    this.rendererInstance = rendererInstance;

    if (this.type === 'custom') {
      this.shader = rendererInstance.shaderLibrary.buildCustomShader({
        shader: this.shader,
        id: this.id,
        label: this.name,
      });
    }

    this.cacheShaderModule();

    if (this.materialUniformsBuffer) {
      this.materialUniformsBuffer.init(rendererInstance);
    }

    this.createMaterialBindGroup(rendererInstance);

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

  protected setMaterialFlags(flag: MaterialFlags, enabled: boolean) {
    const nextFlags = enabled ? this.materialFlags | flag : this.materialFlags & ~flag;

    if (nextFlags === this.materialFlags) return;

    this.materialFlags = nextFlags as MaterialFlags;
    this.updateUniforms({ materialFlags: this.materialFlags });
  }

  private cacheShaderModule() {
    if (!this.rendererInstance?.shaderLibrary) throw new Error(errorMessages.missingShaderLibrary);

    const shader = this.rendererInstance.shaderLibrary.getShader(this.shader);

    if (!shader) throw new Error(errorMessages.missingShaderCode);

    this.shaderModule = shader.shaderModule;
  }

  protected recreateMaterialBindGroup() {
    if (!this.rendererInstance || !this.isInitialized) return;

    this.createMaterialBindGroup(this.rendererInstance);
  }

  protected createMaterialBindGroup(rendererInstance: Renderer) {
    if (!rendererInstance.materialBindGroupLayouts)
      throw new Error(errorMessages.missingRendererMaterialBindGroupLayouts);

    const materialBindGroupLayout = rendererInstance.materialBindGroupLayouts.get(this.type);

    if (!materialBindGroupLayout)
      throw new Error(`${errorMessages.missingMaterialTypeBindGroupLayout} Material type: '${this.type}'.`);

    const entries = this.getBindGroupEntries(rendererInstance);

    if (entries.length > 0) {
      this.materialUniformsBindGroup = rendererInstance.device.createBindGroup({
        layout: materialBindGroupLayout,
        entries,
      });
    }
  }

  protected getBindGroupEntries(_rendererInstance: Renderer): GPUBindGroupEntry[] {
    if (!this.materialUniformsBuffer?.buffer) return [];

    return [{ binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } }];
  }

  static getMaterialLayoutDescriptor() {
    throw new Error('getMaterialLayoutDescriptor must be implemented by subclasses of Material.');
  }

  destroy() {
    this.materialUniformsBuffer?.destroy();
  }
}

export { Material };
