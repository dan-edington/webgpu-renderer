import { uuid } from './types';

interface ITexture {
  id: uuid;
  gpuTexture: GPUTexture | null;
  gpuTextureView: GPUTextureView | null;
  width: number;
  height: number;
  format: GPUTextureFormat;
  isInitialized: boolean;
  getView(): GPUTextureView;
}

type TextureOptions = {
  width: number;
  height: number;
  format?: GPUTextureFormat;
};

class Texture implements ITexture {
  id: uuid;
  gpuTexture: GPUTexture | null = null;
  gpuTextureView: GPUTextureView | null = null;
  width: number;
  height: number;
  format: GPUTextureFormat;
  isInitialized: boolean = false;

  constructor(options: TextureOptions) {
    this.id = crypto.randomUUID();
    this.width = options.width;
    this.height = options.height;
    this.format = options.format || 'rgba8unorm';
  }

  static fromImageBitmap(imageBitmap: ImageBitmap, device: GPUDevice): Texture {
    const texture = new Texture({
      width: imageBitmap.width,
      height: imageBitmap.height,
      format: 'rgba8unorm',
    });

    texture.initFromImageBitmap(imageBitmap, device);
    return texture;
  }

  static createSolidColor(color: [r: number, g: number, b: number, a: number], device: GPUDevice): Texture {
    const texture = new Texture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
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
}

export { Texture };
export type { ITexture };
