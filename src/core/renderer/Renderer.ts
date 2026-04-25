import type { MaterialType } from '../types';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { MaterialLayoutLibrary } from '../materials/libraries/MaterialLayoutLibrary';
import { TextureLibrary } from './libraries/TextureLibrary';
import { SamplerLibrary } from './libraries/SamplerLibrary';
import { ShaderLibrary } from './libraries/ShaderLibrary';
import { Scene } from '../Scene';
import { errorMessages } from '../constants/errorMessages';
import { DepthTexture } from '../DepthTexture';
import { CanvasManager } from './CanvasManager';
import { ContextManager } from './ContextManager';
import { PassManager } from './PassManager';
import { RenderPass } from './passes/RenderPass';
import { PipelineLibrary } from './libraries/PipelineLibrary';
import { OpaquePipeline } from './pipelines/OpaquePipeline';

interface IRenderer {
  canvasManager: CanvasManager;
  contextManager: ContextManager;
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
  materialLayoutLibrary: MaterialLayoutLibrary;
  textureLibrary: TextureLibrary | null;
  samplerLibrary: SamplerLibrary | null;
  shaderLibrary: ShaderLibrary | null;
  depthTexture: DepthTexture | null;
  passManager: PassManager | null;
  init(): Promise<void>;
  getMaterialBindGroupLayout(materialType: MaterialType): GPUBindGroupLayout;
  render(scene: Scene, camera: PerspectiveCamera): void;
}

type RendererOptions = {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
};

class Renderer implements IRenderer {
  canvasManager: CanvasManager;
  contextManager: ContextManager;
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
  materialLayoutLibrary: MaterialLayoutLibrary;
  depthTexture: DepthTexture | null = null;
  textureLibrary: TextureLibrary | null = null;
  samplerLibrary: SamplerLibrary | null = null;
  shaderLibrary: ShaderLibrary | null = null;
  pipelineLibrary: PipelineLibrary | null = null;
  passManager: PassManager | null = null;
  private materialBindGroupLayoutCache: Map<MaterialType, GPUBindGroupLayout> = new Map();

  constructor(options: RendererOptions) {
    this.dpr = options.dpr ?? window.devicePixelRatio;
    this.alpha = options.alpha ?? true;
    this.materialLayoutLibrary = new MaterialLayoutLibrary();
    this.canvasManager = new CanvasManager({ renderer: this, containerElement: options.containerElement });
    this.contextManager = new ContextManager({
      canvasElement: this.canvasManager.canvasElement,
      alpha: this.alpha,
    });
  }

  async init() {
    await this.contextManager.init();
    this.context = this.contextManager.context;
    this.adapter = this.contextManager.adapter;
    this.device = this.contextManager.device;
    this.presentationFormat = this.contextManager.presentationFormat;

    if (!this.device) throw new Error(errorMessages.missingDevice);

    this.samplerLibrary = new SamplerLibrary(this.device);
    this.textureLibrary = new TextureLibrary(this);
    this.shaderLibrary = new ShaderLibrary();

    this.createCameraSceneEntityBindGroupLayouts();

    this.canvasManager.updateCanvasSize();

    this.depthTexture = new DepthTexture({
      width: this.canvasManager.canvasElement.width,
      height: this.canvasManager.canvasElement.height,
      renderer: this,
    });

    this.configurePipelines();
    this.configurePasses();
  }

  private configurePipelines() {
    this.pipelineLibrary = new PipelineLibrary();
    this.pipelineLibrary.registerPipeline('opaque', OpaquePipeline);
  }

  private configurePasses() {
    this.passManager = new PassManager(this);
    this.passManager.registerPass('render', RenderPass);
  }

  private createCameraSceneEntityBindGroupLayouts() {
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
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
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

  private updateTimersAndFrameCounter() {
    this.currentFrame++;
    const currentTime = performance.now();

    if (!this.previousTime) {
      this.previousTime = currentTime;
    }

    this.deltaTime = currentTime - this.previousTime;
    this.elapsedTime += this.deltaTime;
    this.previousTime = currentTime;
  }

  private updateSceneAndCamera(scene: Scene, camera: PerspectiveCamera) {
    if (!scene.isInitialized) scene.init(this);
    if (!camera.isInitialized) camera.init(this);

    scene.updateRenderList();
    scene.updateLights();

    if (!scene.sceneUniformsBuffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    if (!scene.lightUniformsBuffer) throw new Error(errorMessages.missingLightUniformsBuffer);
    if (!camera.cameraUniformBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);

    scene.sceneUniformsBuffer.writeUpdatedBufferData();
    scene.lightUniformsBuffer.writeUpdatedBufferData();
    camera.cameraUniformBuffer.writeUpdatedBufferData();
  }

  getMaterialBindGroupLayout(materialType: MaterialType): GPUBindGroupLayout {
    if (!this.device) throw new Error(errorMessages.missingDevice);

    const cachedLayout = this.materialBindGroupLayoutCache.get(materialType);
    if (cachedLayout) return cachedLayout;

    const layoutDescriptor = this.materialLayoutLibrary.getMaterialLayoutDescriptor(materialType);
    if (!layoutDescriptor) throw new Error(`No material layout descriptor registered for '${materialType}'.`);

    const layout = this.device.createBindGroupLayout(layoutDescriptor);
    this.materialBindGroupLayoutCache.set(materialType, layout);

    return layout;
  }

  render(scene: Scene, camera: PerspectiveCamera) {
    this.updateTimersAndFrameCounter();
    this.updateSceneAndCamera(scene, camera);

    if (!this.passManager) throw new Error('PassManager not initialized.');
    if (!this.device) throw new Error(errorMessages.missingDevice);

    const commandEncoder = this.device.createCommandEncoder();

    this.passManager.scene = scene;
    this.passManager.camera = camera;
    this.passManager.runPass('render', commandEncoder);

    this.device.queue.submit([commandEncoder.finish()]);
  }
}

export { Renderer };
