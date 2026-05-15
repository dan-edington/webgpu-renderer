import { Renderer } from '../renderer/Renderer';
import { Texture } from '../textures/Texture';
import { Material, MaterialFlags } from './Material';
import { MaterialTexture } from './MaterialTexture';

type NormalMaterialOptions = {
  name?: string;
  normalTexture?: Texture | null;
};

class NormalMaterial extends Material {
  private _normalTexture: MaterialTexture;

  constructor(options: NormalMaterialOptions = {}) {
    let initialFlags = MaterialFlags.None;
    if (options.normalTexture) initialFlags |= MaterialFlags.Normal;

    super({
      name: options.name,
      type: 'normal',
      shader: 'normal',
      initialFlags,
    });

    this._normalTexture = new MaterialTexture({
      material: this,
      slot: 'normal',
      texture: options.normalTexture || null,
      fallback: 'normal',
    });

    this.materialTextures.push(this._normalTexture);
  }

  get normalTexture(): Texture | null {
    return this._normalTexture.texture;
  }

  set normalTexture(value: Texture | null) {
    this._normalTexture.texture = value;
    this.setMaterialFlags(MaterialFlags.Normal, value !== null);
    this.recreateMaterialBindGroup();
  }

  protected override getBindGroupEntries(rendererInstance: Renderer): GPUBindGroupEntry[] {
    const normalTextureView = this._normalTexture.getView();
    const sampler = rendererInstance.samplerLibrary.getSampler('linearRepeat');

    if (!normalTextureView || !sampler) {
      throw new Error('Normal material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: normalTextureView },
      { binding: 2, resource: sampler },
    ];
  }

  static override getMaterialLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
    return {
      label: 'Normal Material Bind Group Layout',
      entries: [
        // binding 0: material uniforms (color, etc.)
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        // binding 1: texture
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 2: sampler for color textures
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    };
  }
}

export { NormalMaterial };
