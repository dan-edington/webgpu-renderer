import { errorMessages } from './constants/errorMessages';
import { Renderer } from './renderer/Renderer';

interface IDepthTexture {
  width: number;
  height: number;
  format: GPUTextureFormat;
  depthTexture: GPUTexture | null;
  rendererInstance: Renderer | null;
  resize(width: number, height: number): void;
  destroy(): void;
}

type DepthTextureOptions = {
  width?: number;
  height?: number;
  format?: GPUTextureFormat;
  renderer: Renderer;
};

class DepthTexture implements IDepthTexture {
  width: number;
  height: number;
  format: GPUTextureFormat;
  depthTexture: GPUTexture | null = null;
  depthTextureView: GPUTextureView | null = null;
  rendererInstance: Renderer | null = null;

  constructor(depthTextureOptions: DepthTextureOptions) {
    this.width = depthTextureOptions.width ?? 1;
    this.height = depthTextureOptions.height ?? 1;
    this.format = depthTextureOptions.format ?? 'depth24plus';
    this.rendererInstance = depthTextureOptions.renderer;
    this.createDepthTexture();
  }

  private createDepthTexture() {
    if (!this.rendererInstance?.device) throw new Error(errorMessages.missingDevice);

    this.depthTexture = this.rendererInstance.device.createTexture({
      size: [this.width, this.height],
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.depthTextureView = this.depthTexture.createView();
  }

  destroy() {
    this.depthTexture?.destroy();
    this.depthTextureView = null;
    this.depthTexture = null;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.destroy();
    this.createDepthTexture();
  }
}

export { DepthTexture };
