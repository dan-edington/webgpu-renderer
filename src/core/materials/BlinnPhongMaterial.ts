import { Material, MaterialFlags } from './Material';
import { Renderer } from '../renderer/Renderer';
import { Texture } from '../textures/Texture';
import { colorToLinear } from '../utilities/colorUtilities';
import { MaterialTexture } from './MaterialTexture';
import { MaterialTextureSlot } from '../types';

type BlinnPhongMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  albedoTexture?: Texture | null;
  normalTexture?: Texture | null;
  alphaTexture?: Texture | null;
  transparent?: boolean;
  shininess?: number;
  specularColor?: ArrayLike<number>;
  specularStrength?: number;
};

class BlinnPhongMaterial extends Material {
  private _color: Float32Array;
  private _albedoTexture: MaterialTexture;
  private _normalTexture: MaterialTexture;
  private _alphaTexture: MaterialTexture;
  private textureRepeatBySlot: Record<'albedo' | 'alpha' | 'normal', Float32Array>;
  private readonly repeatUniformBySlot: Record<'albedo' | 'alpha' | 'normal', string> = {
    albedo: 'textureRepeatAlbedo',
    alpha: 'textureRepeatAlpha',
    normal: 'textureRepeatNormal',
  };
  private _shininess: number;
  private _specularColor: Float32Array;
  private _specularStrength: number;

  constructor(options: BlinnPhongMaterialOptions = {}) {
    const color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    const specularColor = new Float32Array(options.specularColor ?? [1, 1, 1]);
    const textureRepeatAlbedo = new Float32Array([1, 1]);
    const textureRepeatAlpha = new Float32Array([1, 1]);
    const textureRepeatNormal = new Float32Array([1, 1]);

    let materialFlags = MaterialFlags.None;
    if (options.alphaTexture) materialFlags |= MaterialFlags.Alpha;
    if (options.normalTexture) materialFlags |= MaterialFlags.Normal;
    if (options.albedoTexture) materialFlags |= MaterialFlags.Albedo;

    super({
      name: options.name,
      type: 'blinnphong',
      shader: 'blinnphong',
      uniforms: {
        color: { type: 'vec4<f32>', value: colorToLinear(color) },
        textureRepeatAlbedo: { type: 'vec2<f32>', value: textureRepeatAlbedo },
        textureRepeatAlpha: { type: 'vec2<f32>', value: textureRepeatAlpha },
        textureRepeatNormal: { type: 'vec2<f32>', value: textureRepeatNormal },
        shininess: { type: 'f32', value: options.shininess ?? 1.0 },
        specularColor: { type: 'vec3<f32>', value: colorToLinear(specularColor) },
        specularStrength: { type: 'f32', value: options.specularStrength ?? 1.0 },
      },
      transparent: options.transparent ?? false,
      materialFlags: materialFlags,
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

    this._normalTexture = new MaterialTexture({
      material: this,
      slot: 'normal',
      texture: options.normalTexture || null,
      fallback: 'normal',
    });

    this.textureRepeatBySlot = {
      albedo: textureRepeatAlbedo,
      alpha: textureRepeatAlpha,
      normal: textureRepeatNormal,
    };

    this._shininess = options.shininess ?? 1.0;
    this._specularColor = specularColor;
    this._specularStrength = options.specularStrength ?? 1.0;

    this.materialTextures.push(this._albedoTexture, this._alphaTexture, this._normalTexture);
  }

  override get usesAlphaPipeline(): boolean {
    return (this.materialFlags & MaterialFlags.Alpha) !== 0 || this._color[3] < 1;
  }

  override onMaterialTextureUpdate(slot: MaterialTextureSlot, texture: Texture | null) {
    if (slot !== 'albedo' && slot !== 'alpha' && slot !== 'normal') return;

    const repeatValue = texture?.repeat ?? new Float32Array([1, 1]);
    this.textureRepeatBySlot[slot].set(repeatValue);
    this.updateUniforms({ [this.repeatUniformBySlot[slot]]: this.textureRepeatBySlot[slot] });
  }

  get color(): Float32Array {
    return this._color;
  }

  set color(value: ArrayLike<number>) {
    this._color = new Float32Array(value);
    this.updateUniforms({ color: colorToLinear(this._color) });
  }

  get specularColor(): Float32Array {
    return this._specularColor;
  }

  set specularColor(value: ArrayLike<number>) {
    this._specularColor = new Float32Array(value);
    this.updateUniforms({ specularColor: colorToLinear(this._specularColor) });
  }

  get specularStrength(): Float32Array {
    return this._specularColor;
  }

  set specularStrength(value: number) {
    this._specularStrength = value;
    this.updateUniforms({ specularStrength: this._specularStrength });
  }

  get albedoTexture(): Texture | null {
    return this._albedoTexture.texture;
  }

  set albedoTexture(value: Texture | null) {
    this._albedoTexture.texture = value;
    this.setMaterialFlags(MaterialFlags.Albedo, value !== null);
    this.recreateMaterialBindGroup();
  }

  get normalTexture(): Texture | null {
    return this._normalTexture.texture;
  }

  set normalTexture(value: Texture | null) {
    this._normalTexture.texture = value;
    this.setMaterialFlags(MaterialFlags.Normal, value !== null);
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

  get shininess(): number {
    return this._shininess;
  }

  set shininess(value: number) {
    this._shininess = value;
    this.updateUniforms({ shininess: this._shininess });
  }

  protected override getBindGroupEntries(rendererInstance: Renderer): GPUBindGroupEntry[] {
    const albedoTextureView = this._albedoTexture.getView();
    const alphaTextureView = this._alphaTexture.getView();
    const normalTextureView = this._normalTexture.getView();
    const sampler = rendererInstance.samplerLibrary.getSampler('linearRepeat');

    if (!albedoTextureView || !normalTextureView || !sampler || !alphaTextureView) {
      throw new Error('BlinnPhong material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: alphaTextureView },
      { binding: 2, resource: normalTextureView },
      { binding: 3, resource: albedoTextureView },
      { binding: 4, resource: sampler },
    ];
  }

  static override getMaterialLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
    return {
      label: 'BlinnPhong Material Bind Group Layout',
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
        // binding 2: normal texture
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 3: albedo texture
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 4: sampler for color textures
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    };
  }
}

export { BlinnPhongMaterial };
