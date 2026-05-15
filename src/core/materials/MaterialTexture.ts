import { Renderer } from '../renderer/Renderer';
import { Texture, TextureSubscriber } from '../textures/Texture';
import { MaterialTextureSlot, TextureFallback, uuid } from '../types';
import { Material } from './Material';

interface IMaterialTexture extends TextureSubscriber {
  id: uuid;
  material: Material;
  slot: MaterialTextureSlot;
  fallback: TextureFallback;
  texture: Texture | null;
  getView: () => GPUTextureView | null;
}

type MaterialTextureOptions = {
  material: Material;
  slot: MaterialTextureSlot;
  texture: Texture | null;
  fallback?: TextureFallback;
};

class MaterialTexture implements IMaterialTexture {
  id: uuid;
  material: Material;
  slot: MaterialTextureSlot;
  fallback: TextureFallback;
  private rendererInstance: Renderer | null = null;
  private _texture: Texture | null;
  private isInitialized: boolean = false;

  constructor(options: MaterialTextureOptions) {
    this.id = crypto.randomUUID();
    this.material = options.material;
    this.slot = options.slot;
    this.fallback = options.fallback || 'white';
    this._texture = options.texture || null;
  }

  init(renderer: Renderer) {
    this.rendererInstance = renderer;
    this.isInitialized = true;
    this.bindTexture(this._texture);
  }

  private resolveTexture(texture: Texture | null): Texture | null {
    if (texture) return texture;
    if (!this.rendererInstance) return null;
    return this.rendererInstance.textureLibrary.getFallback(this.fallback);
  }

  private bindTexture(texture: Texture | null) {
    this._texture?.unsubscribe(this.id);
    this._texture = this.resolveTexture(texture);
    this._texture?.subscribe(this);
    this.material.onMaterialTextureUpdate(this.slot, this._texture);
  }

  getView() {
    return this._texture?.getView() || null;
  }

  onTextureUpdate(texture: Texture) {
    this.material.onMaterialTextureUpdate(this.slot, texture);
  }

  get texture() {
    return this._texture;
  }

  set texture(texture: Texture | null) {
    if (this._texture === texture) return;

    if (!this.isInitialized) {
      this._texture = texture;
      return;
    }

    this.bindTexture(texture);
  }

  destroy() {
    this._texture?.unsubscribe(this.id);
  }
}

export { MaterialTexture };
