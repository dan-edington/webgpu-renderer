import { errorMessages } from '../constants/errorMessages';
import { Renderer } from '../renderer/Renderer';

interface IDepthTexture {
  width: number;
  height: number;
  format: GPUTextureFormat;
  gpuTexture: GPUTexture | null;
  gpuTextureView: GPUTextureView | null;
  rendererInstance: Renderer;
  resize(width: number, height: number): void;
  destroy(): void;
}

type DepthTextureOptions = {
  width?: number;
  height?: number;
  format?: GPUTextureFormat;
  rendererInstance: Renderer;
};

class DepthTexture implements IDepthTexture {
  width: number;
  height: number;
  format: GPUTextureFormat;
  gpuTexture: GPUTexture | null = null;
  gpuTextureView: GPUTextureView | null = null;
  rendererInstance: Renderer;

  constructor(depthTextureOptions: DepthTextureOptions) {
    this.width = depthTextureOptions.width ?? 1;
    this.height = depthTextureOptions.height ?? 1;
    this.format = depthTextureOptions.format ?? 'depth24plus';
    this.rendererInstance = depthTextureOptions.rendererInstance;
    this.createDepthTexture();
  }

  private createDepthTexture() {
    if (!this.rendererInstance?.device) throw new Error(errorMessages.missingDevice);

    this.gpuTexture = this.rendererInstance.device.createTexture({
      size: [this.width, this.height],
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      sampleCount: this.rendererInstance.multiSampling,
    });

    this.gpuTextureView = this.gpuTexture.createView();
  }

  destroy() {
    this.gpuTexture?.destroy();
    this.gpuTextureView = null;
    this.gpuTexture = null;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.destroy();
    this.createDepthTexture();
  }
}

export { DepthTexture };
