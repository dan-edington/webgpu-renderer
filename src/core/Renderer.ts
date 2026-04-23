import { Mesh } from './Mesh';
import { PerspectiveCamera } from './PerspectiveCamera';
import { Scene } from './Scene';
import { errorMessages } from './constants/errorMessages';
import { constants } from './constants/constants';

interface IRenderer {
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement | null;
  dpr: number;
  alpha: boolean;
  context: GPUCanvasContext | null;
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  presentationFormat: GPUTextureFormat | null;
  currentFrame: number;
  elapsedTime: number;
  previousTime: number;
  deltaTime: number;
  cameraBindGroupLayout: GPUBindGroupLayout | null;
  sceneBindGroupLayout: GPUBindGroupLayout | null;
  materialBindGroupLayout: GPUBindGroupLayout | null;
  entityBindGroupLayout: GPUBindGroupLayout | null;
  meshPipelineLayout: GPUPipelineLayout | null;
  init(): Promise<void>;
  createBindGroupLayouts(): void;
  createMeshPipelineLayout(): void;
  updateTimersAndFrameCounter(): void;
  render(scene: Scene, camera: PerspectiveCamera): void;
  setCanvasSize(): void;
}

type RendererOptions = {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
};

class Renderer implements IRenderer {
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
  cameraBindGroupLayout: GPUBindGroupLayout | null = null;
  sceneBindGroupLayout: GPUBindGroupLayout | null = null;
  materialBindGroupLayout: GPUBindGroupLayout | null = null;
  entityBindGroupLayout: GPUBindGroupLayout | null = null;
  meshPipelineLayout: GPUPipelineLayout | null = null;

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

    this.createBindGroupLayouts();
    this.createMeshPipelineLayout();

    this.setCanvasSize();
  }

  createBindGroupLayouts() {
    if (!this.device) throw new Error(errorMessages.missingDevice);

    this.cameraBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    this.sceneBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    this.materialBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    this.entityBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });
  }

  createMeshPipelineLayout() {
    if (!this.device) throw new Error(errorMessages.missingDevice);
    if (!this.cameraBindGroupLayout) throw new Error(errorMessages.missingCameraBufferLayout);
    if (!this.sceneBindGroupLayout) throw new Error(errorMessages.missingSceneBindGroupLayout);
    if (!this.materialBindGroupLayout) throw new Error(errorMessages.missingMaterialBindGroupLayout);
    if (!this.entityBindGroupLayout) throw new Error(errorMessages.missingEntityBindGroupLayout);

    this.meshPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.cameraBindGroupLayout,
        this.sceneBindGroupLayout,
        this.materialBindGroupLayout,
        this.entityBindGroupLayout,
      ],
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

  render(scene: Scene, camera: PerspectiveCamera) {
    this.updateTimersAndFrameCounter();

    if (!scene.isInitialized) scene.init(this);
    if (!camera.isInitialized) camera.init(this);

    scene.updateRenderList();

    if (!this.device) throw new Error(errorMessages.missingDevice);
    if (!this.context) throw new Error(errorMessages.missingContext);
    if (!this.presentationFormat) throw new Error(errorMessages.missingPresentationFormat);
    if (!camera.cameraUniformBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);
    if (!camera.cameraBindGroup) throw new Error(errorMessages.missingCameraBindGroup);

    scene.sceneUniformsBuffer?.writeUpdatedBufferData();
    camera.cameraUniformBuffer.writeUpdatedBufferData();

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

    pass.setBindGroup(constants.bindGroupIndices.CAMERA, camera.cameraBindGroup);
    pass.setBindGroup(constants.bindGroupIndices.SCENE, scene.sceneUniformsBindGroup);

    scene.renderList.forEach((entity) => {
      if (entity instanceof Mesh) {
        entity.draw(pass, this);
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
