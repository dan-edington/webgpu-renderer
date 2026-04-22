import { Mesh } from './Mesh';
import { Scene } from './Scene';
import { errorMessages } from './errorMessages';

interface RendererOptions {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
}

class Renderer {
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement | null = null;
  dpr: number;
  alpha: boolean;
  context: GPUCanvasContext | null = null;
  adapter: GPUAdapter | null = null;
  device: GPUDevice | null = null;
  presentationFormat: GPUTextureFormat | null = null;
  currentFrame: number = 0;
  elapsedTime: number = 0;
  previousTime: number = 0;
  deltaTime: number = 0;

  constructor(rendererOptions: RendererOptions) {
    const { containerElement } = rendererOptions;
    this.containerElement = containerElement || document.body;
    this.dpr = rendererOptions.dpr || window.devicePixelRatio;
    this.alpha = rendererOptions.alpha || true;
  }

  async init() {
    this.canvasElement = document.createElement('canvas');
    this.containerElement.appendChild(this.canvasElement);

    const context = this.canvasElement.getContext('webgpu');

    if (!context) throw new Error(errorMessages.contextRequest);

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) throw new Error(errorMessages.adapterRequest);

    const device = await adapter.requestDevice();

    if (!device) throw new Error(errorMessages.deviceRequest);

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    if (!presentationFormat) throw new Error(errorMessages.presentationFormatRequest);

    this.context = context;
    this.adapter = adapter;
    this.device = device;
    this.presentationFormat = presentationFormat;

    context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: this.alpha ? 'premultiplied' : 'opaque',
    });

    this.setCanvasSize();
  }

  updateTimersAndFrameCounter() {
    this.currentFrame++;
    const currentTime = performance.now();

    if (!this.previousTime) {
      this.previousTime = currentTime;
    }

    this.deltaTime = currentTime - this.previousTime;
    this.elapsedTime += this.deltaTime;
    this.previousTime = currentTime;
  }

  render(scene: Scene) {
    this.updateTimersAndFrameCounter();

    scene.updateRenderList();

    if (!this.device) throw new Error(errorMessages.missingDevice);
    if (!this.context) throw new Error(errorMessages.missingContext);
    if (!this.presentationFormat) throw new Error(errorMessages.missingPresentationFormat);

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: scene.clearColor,
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    const pass = commandEncoder.beginRenderPass(renderPassDescriptor);

    scene.renderList.forEach((entity) => {
      if (entity.isRenderable && entity.visible) {
        if (entity instanceof Mesh) {
          entity.draw(pass, this);
        }
      }
    });

    pass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  setCanvasSize() {
    if (!this.canvasElement) throw new Error(errorMessages.missingCanvasElement);

    this.canvasElement.width = Math.floor(this.containerElement.clientWidth * this.dpr);
    this.canvasElement.height = Math.floor(this.containerElement.clientHeight * this.dpr);
  }
}

export { Renderer };
