import { Material, MaterialFlag } from './Material';
import { Renderer } from '../renderer/Renderer';
import { Texture } from '../Texture';
import { colorToLinear } from '../utilities/colorUtilities';

type UnlitMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  albedoTexture?: Texture | null;
  alphaTexture?: Texture | null;
  transparent?: boolean;
};

class UnlitMaterial extends Material {
  private _color: Float32Array;
  private _albedoTexture: Texture | null;
  private _alphaTexture: Texture | null;

  constructor(options: UnlitMaterialOptions = {}) {
    const color = new Float32Array(options.color ?? [1, 1, 1, 1]);

    super({
      name: options.name,
      type: 'unlit',
      shader: 'unlit',
      uniforms: {
        uColor: { type: 'vec4<f32>', value: colorToLinear(color) },
      },
      transparent: options.transparent ?? false,
    });

    this._color = color;
    this._albedoTexture = options.albedoTexture ?? null;
    this._alphaTexture = options.alphaTexture ?? null;

    if (this._albedoTexture) this.materialFlag |= MaterialFlag.Albedo;
    if (this._alphaTexture) this.materialFlag |= MaterialFlag.Alpha;
  }

  get color(): Float32Array {
    return this._color;
  }

  set color(value: ArrayLike<number>) {
    this._color = new Float32Array(value);
    this.updateUniforms({ uColor: colorToLinear(this._color) });
  }

  get albedoTexture(): Texture | null {
    return this._albedoTexture;
  }

  set albedoTexture(value: Texture | null) {
    this._albedoTexture = value;
    this.recreateMaterialBindGroup();
  }

  get alphaTexture(): Texture | null {
    return this._alphaTexture;
  }

  set alphaTexture(value: Texture | null) {
    this._alphaTexture = value;
    this.setMaterialFlag(MaterialFlag.Alpha, value !== null);
    this.recreateMaterialBindGroup();
  }

  protected override getBindGroupEntries(renderer: Renderer): GPUBindGroupEntry[] {
    const albedoTexture = this._albedoTexture ?? renderer.textureLibrary?.getFallback('white');
    const alphaTexture = this._alphaTexture ?? renderer.textureLibrary?.getFallback('white');
    const sampler = renderer.samplerLibrary?.getSampler('linearRepeat');

    if (!albedoTexture || !alphaTexture || !sampler) {
      throw new Error('Unlit material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: alphaTexture.getView() },
      { binding: 2, resource: albedoTexture.getView() },
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
        // binding 1: alpha texture
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 2: albedo texture
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

export { UnlitMaterial };
