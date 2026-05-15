import { uuid } from '../types';

export interface TextureSubscriber {
  id: uuid;
  onTextureUpdate(texture: Texture): void;
}

interface ITexture {
  id: uuid;
  gpuTexture: GPUTexture | null;
  width: number;
  height: number;
  format: GPUTextureFormat;
  repeat: Float32Array;
  isInitialized: boolean;
  getView(): GPUTextureView;
}

export type TextureOptions = {
  width: number;
  height: number;
  colorSpace?: TextureColorSpace;
};

export type TextureColorSpace = 'srgb' | 'linear' | 'data';

class Texture implements ITexture {
  id: uuid;
  gpuTexture: GPUTexture | null = null;
  private gpuTextureView: GPUTextureView | null = null;
  width: number;
  height: number;
  format: GPUTextureFormat;
  private _repeat: Float32Array;
  colorSpace: TextureColorSpace;
  isInitialized: boolean = false;
  private subscribers: Map<uuid, TextureSubscriber> = new Map();

  constructor(options: TextureOptions) {
    this.id = crypto.randomUUID();
    this.width = options.width;
    this.height = options.height;
    this.colorSpace = options.colorSpace || 'srgb';
    this.format = this.colorSpace === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm';
    this._repeat = new Float32Array([1, 1]);
  }

  static fromImageBitmap(imageBitmap: ImageBitmap, device: GPUDevice, colorSpace: TextureColorSpace = 'srgb'): Texture {
    const texture = new Texture({
      width: imageBitmap.width,
      height: imageBitmap.height,
      colorSpace,
    });

    texture.initFromImageBitmap(imageBitmap, device);
    return texture;
  }

  static createSolidColor(
    color: [r: number, g: number, b: number, a: number],
    device: GPUDevice,
    colorSpace: TextureColorSpace = 'srgb',
  ): Texture {
    const texture = new Texture({
      width: 1,
      height: 1,
      colorSpace,
    });

    const data = new Uint8Array([color[0], color[1], color[2], color[3]]);
    texture.initFromData(data, device);
    return texture;
  }

  private initFromImageBitmap(imageBitmap: ImageBitmap, device: GPUDevice): void {
    this.gpuTexture = device.createTexture({
      size: { width: this.width, height: this.height },
      format: this.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: 1,
    });

    device.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: true }, { texture: this.gpuTexture }, [
      this.width,
      this.height,
    ]);

    this.gpuTextureView = this.gpuTexture.createView();
    this.isInitialized = true;
  }

  private initFromData(data: Uint8Array, device: GPUDevice): void {
    this.gpuTexture = device.createTexture({
      size: { width: this.width, height: this.height },
      format: this.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      mipLevelCount: 1,
    });

    device.queue.writeTexture(
      { texture: this.gpuTexture },
      data,
      { bytesPerRow: this.width * 4 },
      { width: this.width, height: this.height },
    );

    this.gpuTextureView = this.gpuTexture.createView();
    this.isInitialized = true;
  }

  getView(): GPUTextureView {
    if (!this.gpuTextureView) {
      throw new Error(`Texture ${this.id} has no view. Initialize first.`);
    }
    return this.gpuTextureView;
  }

  destroy(): void {
    if (this.gpuTexture) {
      this.gpuTexture.destroy();
      this.gpuTexture = null;
      this.gpuTextureView = null;
    }
  }

  subscribe(subscriber: TextureSubscriber) {
    if (!this.subscribers.has(subscriber.id)) {
      this.subscribers.set(subscriber.id, subscriber);
    }
  }

  unsubscribe(id: uuid) {
    this.subscribers.delete(id);
  }

  private publish() {
    this.subscribers.forEach((subscriber) => subscriber.onTextureUpdate(this));
  }

  get repeat() {
    return this._repeat;
  }

  set repeat(repeat: Float32Array) {
    this._repeat = new Float32Array(repeat);
    this.publish();
  }
}

export { Texture };
