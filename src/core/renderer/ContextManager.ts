import { errorMessages } from '../constants/errorMessages';

interface IContextManager {
  alpha: boolean;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  canvasTexture: GPUTexture;
  multiSampleTexture: GPUTexture;
  resize(width: number, height: number, multiSampling: number): void;
}

type ContextManagerCreateOptions = {
  canvasElement: HTMLCanvasElement;
  alpha?: boolean;
  multiSampling: number;
};

type ContextManagerOptions = ContextManagerCreateOptions & {
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
};

class ContextManager implements IContextManager {
  alpha: boolean;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  canvasTexture: GPUTexture;
  multiSampleTexture: GPUTexture;

  private constructor(options: ContextManagerOptions) {
    this.alpha = options.alpha ?? true;
    this.canvasElement = options.canvasElement;
    this.context = options.context;
    this.adapter = options.adapter;
    this.device = options.device;
    this.presentationFormat = options.presentationFormat;

    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: this.alpha ? 'premultiplied' : 'opaque',
    });

    this.canvasTexture = this.context.getCurrentTexture();
    this.multiSampleTexture = this.device.createTexture({
      format: this.canvasTexture.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      size: [this.canvasTexture.width, this.canvasTexture.height],
      sampleCount: options.multiSampling,
    });
  }

  static async create(options: ContextManagerCreateOptions): Promise<ContextManager> {
    const context = options.canvasElement.getContext('webgpu');
    if (!context) throw new Error(errorMessages.contextRequest);

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error(errorMessages.adapterRequest);

    const device = await adapter.requestDevice();
    if (!device) throw new Error(errorMessages.deviceRequest);

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    if (!presentationFormat) throw new Error(errorMessages.presentationFormatRequest);

    return new ContextManager({
      ...options,
      context,
      adapter,
      device,
      presentationFormat,
    });
  }

  resize(width: number, height: number, multiSampling: number) {
    this.canvasTexture = this.context.getCurrentTexture();

    this.multiSampleTexture.destroy();
    this.multiSampleTexture = this.device.createTexture({
      format: this.presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      size: [width, height],
      sampleCount: multiSampling,
    });
  }
}

export { ContextManager };
