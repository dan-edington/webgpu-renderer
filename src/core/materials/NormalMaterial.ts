import { Renderer } from '../renderer/Renderer';
import { Texture } from '../Texture';
import { Material } from './Material';

type LambertMaterialOptions = {
  name?: string;
  normalTexture?: Texture | null;
};

class NormalMaterial extends Material {
  private _normalTexture: Texture | null;

  constructor(options: LambertMaterialOptions = {}) {
    super({
      name: options.name,
      type: 'normal',
      shader: 'normal',
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

    return [
      { binding: 0, resource: normalTexture.getView() },
      { binding: 1, resource: sampler },
    ];
  }
}

export { NormalMaterial };
