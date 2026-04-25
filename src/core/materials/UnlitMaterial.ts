import { Material } from './Material';
import { Renderer } from '../renderer/Renderer';
import { Texture } from '../Texture';

type UnlitMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  alphaTexture?: Texture | null;
};

class UnlitMaterial extends Material {
  private _color: Float32Array;
  private _alphaTexture: Texture | null;

  constructor(options: UnlitMaterialOptions = {}) {
    const color = new Float32Array(options.color ?? [1, 1, 1, 1]);

    super({
      name: options.name,
      type: 'unlit',
      shader: 'unlit',
      uniforms: {
        uColor: { type: 'vec4<f32>', value: color },
      },
    });

    this._color = color;
    this._alphaTexture = options.alphaTexture ?? null;
  }

  get color(): Float32Array {
    return this._color;
  }

  set color(value: ArrayLike<number>) {
    this._color = new Float32Array(value);
    this.updateUniforms({ uColor: this._color });
  }

  get alphaTexture(): Texture | null {
    return this._alphaTexture;
  }

  set alphaTexture(value: Texture | null) {
    this._alphaTexture = value;
    this.recreateMaterialBindGroup();
  }

  protected override getBindGroupEntries(renderer: Renderer): GPUBindGroupEntry[] {
    const alphaTexture = this._alphaTexture ?? renderer.textureLibrary?.getFallback('white');
    const sampler = renderer.samplerLibrary?.getSampler('linearRepeat');

    if (!alphaTexture || !sampler) {
      throw new Error('Unlit material resources are missing.');
    }

    if (!this.materialUniformsBuffer?.buffer) return [];

    return [
      { binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } },
      { binding: 1, resource: alphaTexture.getView() },
      { binding: 2, resource: sampler },
    ];
  }
}

export { UnlitMaterial };
