import { Material, MaterialFlags } from './Material';
import { Renderer } from '../renderer/Renderer';
import { Texture } from '../textures/Texture';
import { colorToLinear } from '../utilities/colorUtilities';
import { MaterialTexture } from './MaterialTexture';
import { MaterialTextureSlot } from '../types';

type UnlitMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  albedoTexture?: Texture | null;
  alphaTexture?: Texture | null;
  transparent?: boolean;
};

class UnlitMaterial extends Material {
  private _color: Float32Array;
  private _albedoTexture: MaterialTexture;
  private _alphaTexture: MaterialTexture;
  private textureRepeatBySlot: Record<'albedo' | 'alpha', Float32Array>;
  private readonly repeatUniformBySlot: Record<'albedo' | 'alpha', string> = {
    albedo: 'textureRepeatAlbedo',
    alpha: 'textureRepeatAlpha',
  };

  constructor(options: UnlitMaterialOptions = {}) {
    const color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    const textureRepeatAlbedo = new Float32Array([1, 1]);
    const textureRepeatAlpha = new Float32Array([1, 1]);

    let initialFlags = MaterialFlags.None;
    if (options.alphaTexture) initialFlags |= MaterialFlags.Alpha;
    if (options.albedoTexture) initialFlags |= MaterialFlags.Albedo;

    super({
      name: options.name,
      type: 'unlit',
      shader: 'unlit',
      uniforms: {
        color: { type: 'vec4<f32>', value: colorToLinear(color) },
        textureRepeatAlbedo: { type: 'vec2<f32>', value: textureRepeatAlbedo },
        textureRepeatAlpha: { type: 'vec2<f32>', value: textureRepeatAlpha },
      },
      transparent: options.transparent ?? false,
      initialFlags,
    });

    this._color = color;

    this._albedoTexture = new MaterialTexture({
      material: this,
      slot: 'albedo',
      texture: options.albedoTexture || null,
    });

    this._alphaTexture = new MaterialTexture({
      material: this,
      slot: 'alpha',
      texture: options.alphaTexture || null,
    });

    this.textureRepeatBySlot = {
      albedo: textureRepeatAlbedo,
      alpha: textureRepeatAlpha,
    };

    this.materialTextures.push(this._albedoTexture, this._alphaTexture);
  }

  get color(): Float32Array {
    return this._color;
  }

  set color(value: ArrayLike<number>) {
    this._color = new Float32Array(value);
    this.updateUniforms({ color: colorToLinear(this._color) });
  }

  get albedoTexture(): Texture | null {
    return this._albedoTexture.texture;
  }

  set albedoTexture(value: Texture | null) {
    this._albedoTexture.texture = value;
    this.setMaterialFlags(MaterialFlags.Albedo, value !== null);
    this.recreateMaterialBindGroup();
  }

  get alphaTexture(): Texture | null {
    return this._alphaTexture.texture;
  }

  set alphaTexture(value: Texture | null) {
    this._alphaTexture.texture = value;
    this.setMaterialFlags(MaterialFlags.Alpha, value !== null);
    this.recreateMaterialBindGroup();
  }

  override onMaterialTextureUpdate(slot: MaterialTextureSlot, texture: Texture | null) {
    if (slot !== 'albedo' && slot !== 'alpha') return;

    const repeatValue = texture?.repeat ?? new Float32Array([1, 1]);
    this.textureRepeatBySlot[slot].set(repeatValue);
    this.updateUniforms({ [this.repeatUniformBySlot[slot]]: this.textureRepeatBySlot[slot] });
  }

  protected override getBindGroupEntries(rendererInstance: Renderer): GPUBindGroupEntry[] {
    const albedoTextureView = this._albedoTexture.getView();
    const alphaTextureView = this._alphaTexture.getView();
    const sampler = rendererInstance.samplerLibrary.getSampler('linearRepeat');

    if (!albedoTextureView || !alphaTextureView || !sampler) {
      throw new Error('Unlit material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: alphaTextureView },
      { binding: 2, resource: albedoTextureView },
      { binding: 3, resource: sampler },
    ];
  }

  static override getMaterialLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
    return {
      label: 'Unlit Material Bind Group Layout',
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
