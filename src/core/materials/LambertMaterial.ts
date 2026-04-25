import { Material } from './Material';
import { Renderer } from '../renderer/Renderer';
import { Texture } from '../Texture';

type LambertMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  albedoTexture?: Texture | null;
  normalTexture?: Texture | null;
};

class LambertMaterial extends Material {
  private _color: Float32Array;
  private _albedoTexture: Texture | null;
  private _normalTexture: Texture | null;

  constructor(options: LambertMaterialOptions = {}) {
    const color = new Float32Array(options.color ?? [1, 1, 1, 1]);

    super({
      name: options.name,
      type: 'lambert',
      shader: 'lambert',
      uniforms: {
        uColor: { type: 'vec4<f32>', value: color },
      },
    });

    this._color = color;
    this._albedoTexture = options.albedoTexture ?? null;
    this._normalTexture = options.normalTexture ?? null;
  }

  get color(): Float32Array {
    return this._color;
  }

  set color(value: ArrayLike<number>) {
    this._color = new Float32Array(value);
    this.updateUniforms({ uColor: this._color });
  }

  get albedoTexture(): Texture | null {
    return this._albedoTexture;
  }

  set albedoTexture(value: Texture | null) {
    this._albedoTexture = value;
    this.recreateMaterialBindGroup();
  }

  get normalTexture(): Texture | null {
    return this._normalTexture;
  }

  set normalTexture(value: Texture | null) {
    this._normalTexture = value;
    this.recreateMaterialBindGroup();
  }

  protected override getBindGroupEntries(renderer: Renderer): GPUBindGroupEntry[] {
    const albedoTexture = this._albedoTexture ?? renderer.textureLibrary?.getFallback('white');
    const normalTexture = this._normalTexture ?? renderer.textureLibrary?.getFallback('normal');
    const sampler = renderer.samplerLibrary?.getSampler('linearRepeat');

    if (!albedoTexture || !normalTexture || !sampler) {
      throw new Error('Lambert material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: albedoTexture.getView() },
      { binding: 2, resource: normalTexture.getView() },
      { binding: 3, resource: sampler },
    ];
  }

  static override getMaterialLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
    return {
      entries: [
        // binding 0: material uniforms (color, etc.)
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        // binding 1: albedo/color texture
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 2: normal map texture
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 3: sampler for color textures
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    };
  }
}

export { LambertMaterial };
