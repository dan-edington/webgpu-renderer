import { Texture } from '../../Texture';
import { errorMessages } from '../../constants/errorMessages';
import { Renderer } from '../../renderer/Renderer';
import { TextureKey } from '../../types';

class TextureLibrary {
  private device: GPUDevice | null = null;
  private queue: GPUQueue | null = null;
  private textures: Map<TextureKey, Texture>;
  private fallbackTextures: {
    white: Texture;
    black: Texture;
    normal: Texture;
  } | null = null;

  constructor(renderer: Renderer) {
    this.textures = new Map();
    this.device = renderer.device;
    this.queue = renderer.device?.queue || null;
    this.initializeFallbackTextures();
  }

  private initializeFallbackTextures(): void {
    if (!this.device || !this.queue) {
      throw new Error(errorMessages.missingTextureLibraryDeviceOrQueue);
    }

    this.fallbackTextures = {
      white: Texture.createSolidColor([255, 255, 255, 255], this.device, this.queue),
      black: Texture.createSolidColor([0, 0, 0, 255], this.device, this.queue),
      // Normal map pointing straight up (0, 0, 1) = (128, 128, 255) in RGB
      normal: Texture.createSolidColor([128, 128, 255, 255], this.device, this.queue),
    };
  }

  async loadTexture(key: TextureKey, url?: string): Promise<Texture> {
    if (this.textures.has(key)) {
      throw new Error(`Texture with key "${key}" already exists in the library`);
    }

    if (!url) return this.getFallback('white');

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);

      if (!this.device || !this.queue) {
        throw new Error(errorMessages.missingTextureLibraryDeviceOrQueue);
      }

      const texture = Texture.fromImageBitmap(imageBitmap, this.device, this.queue);
      this.textures.set(key, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load texture from ${url}:`, error);
      return this.getFallback('white');
    }
  }

  registerTexture(key: TextureKey, texture: Texture): void {
    this.textures.set(key, texture);
  }

  getFallback(textureName: 'white' | 'black' | 'normal'): Texture {
    if (!this.fallbackTextures) throw new Error(errorMessages.missingTextureLibraryFallbacks);
    return this.fallbackTextures[textureName];
  }

  getTexture(key: TextureKey): Texture {
    return this.textures.get(key) ?? this.getFallback('white');
  }

  destroy(): void {
    this.textures.forEach((texture) => texture.destroy());
    this.textures.clear();

    for (const key in this.fallbackTextures) {
      this.fallbackTextures[key as keyof typeof this.fallbackTextures].destroy();
    }
  }
}

export { TextureLibrary };
