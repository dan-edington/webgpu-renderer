import { Renderer } from '../renderer/Renderer';
import { Texture } from '../Texture';
import { Material, MaterialFlag } from './Material';

type NormalMaterialOptions = {
  name?: string;
  normalTexture?: Texture | null;
};

class NormalMaterial extends Material {
  private _normalTexture: Texture | null;

  constructor(options: NormalMaterialOptions = {}) {
    let initialFlags = MaterialFlag.None;
    if (options.normalTexture) initialFlags |= MaterialFlag.Normal;

    super({
      name: options.name,
      type: 'normal',
      shader: 'normal',
      initialFlags,
    });

    this._normalTexture = options.normalTexture ?? null;
  }

  get normalTexture(): Texture | null {
    return this._normalTexture;
  }

  set normalTexture(value: Texture | null) {
    this._normalTexture = value;
    this.recreateMaterialBindGroup();
  }

  protected override getBindGroupEntries(renderer: Renderer): GPUBindGroupEntry[] {
    const normalTexture = this._normalTexture ?? renderer.textureLibrary?.getFallback('normal');
    const sampler = renderer.samplerLibrary?.getSampler('linearRepeat');

    if (!normalTexture || !sampler) {
      throw new Error('Normal material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: normalTexture.getView() },
      { binding: 2, resource: sampler },
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
        // binding 1: sampler for color textures
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
