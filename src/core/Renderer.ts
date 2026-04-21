import { Mesh } from './Mesh';
import { Scene } from './Scene';

interface RendererOptions {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
}

class Renderer {
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  dpr: number;
  alpha: boolean;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  clearColor: GPUColor;
  currentFrame: number = 0;
  elapsedTime: number = 0;
  previousTime: number = 0;
  deltaTime: number = 0;

  constructor(rendererOptions: RendererOptions) {
    const { containerElement } = rendererOptions;
    this.containerElement = containerElement || document.body;
    this.dpr = rendererOptions.dpr || window.devicePixelRatio;
    this.alpha = rendererOptions.alpha || true;
    this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  async init() {
    this.canvasElement = document.createElement('canvas');
    this.containerElement.appendChild(this.canvasElement);
    this.setCanvasSize();

    const context = this.canvasElement.getContext('webgpu');

    if (!context) {
      throw new Error('Could not create WebGPU context.');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw new Error('Could not get GPU adapter.');
    }

    const device = await adapter.requestDevice();
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context = context;
    this.adapter = adapter;
    this.device = device;
    this.presentationFormat = presentationFormat;

    context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: this.alpha ? 'premultiplied' : 'opaque',
    });
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

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: this.clearColor,
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
    this.canvasElement.width = Math.floor(this.containerElement.clientWidth * this.dpr);
    this.canvasElement.height = Math.floor(this.containerElement.clientHeight * this.dpr);
  }
}

export { Renderer };
