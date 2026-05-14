import { Material, MaterialFlags } from './Material';
import { Renderer } from '../renderer/Renderer';
import { Texture } from '../textures/Texture';
import { colorToLinear } from '../utilities/colorUtilities';

type BlinnPhongMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  albedoTexture?: Texture | null;
  normalTexture?: Texture | null;
  alphaTexture?: Texture | null;
  transparent?: boolean;
  shininess?: number;
  specularColor?: ArrayLike<number>;
};

class BlinnPhongMaterial extends Material {
  private _color: Float32Array;
  private _albedoTexture: Texture | null;
  private _normalTexture: Texture | null;
  private _alphaTexture: Texture | null;
  private _shininess: number;
  private _specularColor: Float32Array;

  constructor(options: BlinnPhongMaterialOptions = {}) {
    const color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    const specularColor = new Float32Array(options.specularColor ?? [1, 1, 1, 1]);

    let initialFlags = MaterialFlags.None;
    if (options.alphaTexture) initialFlags |= MaterialFlags.Alpha;
    if (options.normalTexture) initialFlags |= MaterialFlags.Normal;
    if (options.albedoTexture) initialFlags |= MaterialFlags.Albedo;

    super({
      name: options.name,
      type: 'blinnphong',
      shader: 'blinnphong',
      uniforms: {
        color: { type: 'vec4<f32>', value: colorToLinear(color) },
        shininess: { type: 'f32', value: options.shininess ?? 1.0 },
        specularColor: { type: 'vec3<f32>', value: colorToLinear(specularColor) },
      },
      transparent: options.transparent ?? false,
      initialFlags,
    });

    this._color = color;
    this._albedoTexture = options.albedoTexture ?? null;
    this._alphaTexture = options.alphaTexture ?? null;
    this._normalTexture = options.normalTexture ?? null;
    this._shininess = options.shininess ?? 1.0;
    this._specularColor = specularColor;
  }

  override get usesAlphaPipeline(): boolean {
    return this._alphaTexture !== null || this._color[3] < 1;
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

  get albedoTexture(): Texture | null {
    return this._albedoTexture;
  }

  set albedoTexture(value: Texture | null) {
    this._albedoTexture = value;
    this.setMaterialFlags(MaterialFlags.Albedo, value !== null);
    this.recreateMaterialBindGroup();
  }

  get normalTexture(): Texture | null {
    return this._normalTexture;
  }

  set normalTexture(value: Texture | null) {
    this._normalTexture = value;
    this.setMaterialFlags(MaterialFlags.Normal, value !== null);
    this.recreateMaterialBindGroup();
  }

  get alphaTexture(): Texture | null {
    return this._alphaTexture;
  }

  set alphaTexture(value: Texture | null) {
    this._alphaTexture = value;
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
    const albedoTexture = this._albedoTexture ?? rendererInstance.textureLibrary.getFallback('white');
    const alphaTexture = this._alphaTexture ?? rendererInstance.textureLibrary.getFallback('white');
    const normalTexture = this._normalTexture ?? rendererInstance.textureLibrary.getFallback('normal');
    const sampler = rendererInstance.samplerLibrary.getSampler('linearRepeat');

    if (!albedoTexture || !normalTexture || !sampler || !alphaTexture) {
      throw new Error('Lambert material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: alphaTexture.getView() },
      { binding: 2, resource: normalTexture.getView() },
      { binding: 3, resource: albedoTexture.getView() },
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
