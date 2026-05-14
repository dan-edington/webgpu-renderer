import { constants } from '../constants/constants';
import { errorMessages } from '../constants/errorMessages';
import { Renderer } from './Renderer';

interface ISurfaceManager {
  alpha: boolean;
  canvasElement: HTMLCanvasElement;
  containerElement: HTMLElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  canvasTexture: GPUTexture;
  multiSampleTexture: GPUTexture;
  multiSampleTextureView: GPUTextureView;
  updateCanvasSize(): void;
  resize(width: number, height: number, multiSampling: number): void;
}

type SurfaceManagerCreateOptions = {
  containerElement?: HTMLElement;
  alpha?: boolean;
  multiSampling: number;
};

type SurfaceManagerOptions = SurfaceManagerCreateOptions & {
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
};

class SurfaceManager implements ISurfaceManager {
  private rendererInstance: Renderer | null = null;
  alpha: boolean;
  canvasElement: HTMLCanvasElement;
  containerElement: HTMLElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  canvasTexture: GPUTexture;
  multiSampleTexture: GPUTexture;
  multiSampleTextureView: GPUTextureView;

  private constructor(options: SurfaceManagerOptions) {
    this.alpha = options.alpha ?? true;
    this.containerElement = options.containerElement ?? document.body;
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
      format: constants.INTERNAL_COLOR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      size: [this.canvasTexture.width, this.canvasTexture.height],
      sampleCount: options.multiSampling,
    });

    this.multiSampleTextureView = this.multiSampleTexture.createView();

    this.initEventListeners();
  }

  init(renderer: Renderer) {
    this.rendererInstance = renderer;
    this.updateCanvasSize();

    return this;
  }

  static async create(options: SurfaceManagerCreateOptions): Promise<SurfaceManager> {
    const containerElement = options.containerElement ?? document.body;
    if (!(containerElement instanceof HTMLElement)) {
      throw new Error('Invalid container element');
    }

    const canvasElement = document.createElement('canvas');
    containerElement.appendChild(canvasElement);

    const context = canvasElement.getContext('webgpu');
    if (!context) throw new Error(errorMessages.contextRequest);

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error(errorMessages.adapterRequest);

    const device = await adapter.requestDevice();
    if (!device) throw new Error(errorMessages.deviceRequest);

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    if (!presentationFormat) throw new Error(errorMessages.presentationFormatRequest);

    return new SurfaceManager({
      ...options,
      containerElement,
      canvasElement,
      context,
      adapter,
      device,
      presentationFormat,
    });
  }

  private initEventListeners() {
    const onResize = () => {
      this.updateCanvasSize();
    };

    window.addEventListener('resize', onResize);
  }

  updateCanvasSize() {
    if (!this.canvasElement) throw new Error(errorMessages.missingCanvasElement);
    if (!this.rendererInstance) throw new Error(errorMessages.missingRendererInstance);

    this.canvasElement.width = Math.floor(this.containerElement.clientWidth * this.rendererInstance.dpr);
    this.canvasElement.height = Math.floor(this.containerElement.clientHeight * this.rendererInstance.dpr);

    this.resize(this.canvasElement.width, this.canvasElement.height, this.rendererInstance.multiSampling);

    this.rendererInstance.depthTexture?.resize(this.canvasElement.width, this.canvasElement.height);
    this.rendererInstance.passManager?.resizeRenderTargets(this.canvasElement.width, this.canvasElement.height);
  }

  resize(width: number, height: number, multiSampling: number) {
    this.canvasTexture = this.context.getCurrentTexture();

    this.multiSampleTexture.destroy();

    this.multiSampleTexture = this.device.createTexture({
      format: constants.INTERNAL_COLOR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      size: [width, height],
      sampleCount: multiSampling,
    });

    this.multiSampleTextureView = this.multiSampleTexture.createView();
  }
}

export { SurfaceManager };
