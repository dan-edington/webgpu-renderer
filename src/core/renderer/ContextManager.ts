import { errorMessages } from '../constants/errorMessages';

interface IContextManager {}

type ContextManagerOptions = {
  canvasElement: HTMLCanvasElement;
  alpha?: boolean;
};

class ContextManager implements IContextManager {
  alpha: boolean;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext | null = null;
  adapter: GPUAdapter | null = null;
  device: GPUDevice | null = null;
  presentationFormat: GPUTextureFormat | null = null;

  constructor(options: ContextManagerOptions) {
    this.alpha = options.alpha ?? true;
    this.canvasElement = options.canvasElement;
  }

  async init() {
    this.context = this.canvasElement.getContext('webgpu');
    if (!this.context) throw new Error(errorMessages.contextRequest);

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) throw new Error(errorMessages.adapterRequest);

    this.device = await this.adapter.requestDevice();
    if (!this.device) throw new Error(errorMessages.deviceRequest);

    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    if (!this.presentationFormat) throw new Error(errorMessages.presentationFormatRequest);

    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: this.alpha ? 'premultiplied' : 'opaque',
    });
  }
}

export { ContextManager };
