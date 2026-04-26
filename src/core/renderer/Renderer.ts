import type { MaterialType } from '../types';
import { PerspectiveCamera } from '../PerspectiveCamera';
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
import { cameraBindGroupLayoutDescriptor } from './bindGroupLayouts/camera';
import { sceneBindGroupLayoutDescriptor } from './bindGroupLayouts/scene';
import { entityBindGroupLayoutDescriptor } from './bindGroupLayouts/entity';
import { materialBindGroupLayoutDescriptors } from './bindGroupLayouts/materials';

interface IRenderer {
  canvasManager: CanvasManager;
  contextManager: ContextManager;
  dpr: number;
  alpha: boolean;
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  currentFrame: number;
  elapsedTime: number;
  previousTime: number;
  deltaTime: number;
  cameraBindGroupLayout: GPUBindGroupLayout | null;
  sceneBindGroupLayout: GPUBindGroupLayout | null;
  materialBindGroupLayout: GPUBindGroupLayout | null;
  entityBindGroupLayout: GPUBindGroupLayout | null;
  materialBindGroupLayouts: Map<MaterialType, GPUBindGroupLayout> | null;
  meshPipelineLayout: GPUPipelineLayout | null;
  textureLibrary: TextureLibrary | null;
  samplerLibrary: SamplerLibrary | null;
  shaderLibrary: ShaderLibrary | null;
  depthTexture: DepthTexture | null;
  passManager: PassManager | null;
  init(): Promise<void>;
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
  context: GPUCanvasContext;
  adapter: GPUAdapter;
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  currentFrame: number = 0;
  elapsedTime: number = 0;
  previousTime: number = 0;
  deltaTime: number = 0;
  cameraBindGroupLayout: GPUBindGroupLayout | null = null;
  sceneBindGroupLayout: GPUBindGroupLayout | null = null;
  materialBindGroupLayout: GPUBindGroupLayout | null = null;
  entityBindGroupLayout: GPUBindGroupLayout | null = null;
  materialBindGroupLayouts: Map<MaterialType, GPUBindGroupLayout> | null = null;
  meshPipelineLayout: GPUPipelineLayout | null = null;
  depthTexture: DepthTexture | null = null;
  textureLibrary: TextureLibrary | null = null;
  samplerLibrary: SamplerLibrary | null = null;
  shaderLibrary: ShaderLibrary | null = null;
  pipelineLibrary: PipelineLibrary | null = null;
  passManager: PassManager | null = null;

  private constructor(options: RendererOptions, canvasManager: CanvasManager, contextManager: ContextManager) {
    this.dpr = options.dpr ?? window.devicePixelRatio;
    this.alpha = options.alpha ?? true;
    this.canvasManager = canvasManager;
    this.canvasManager.rendererInstance = this;
    this.contextManager = contextManager;
    this.context = this.contextManager.context;
    this.adapter = this.contextManager.adapter;
    this.device = this.contextManager.device;
    this.presentationFormat = this.contextManager.presentationFormat;
    console.log(this);
  }

  static async create(options: RendererOptions): Promise<Renderer> {
    const canvasManager = new CanvasManager({ containerElement: options.containerElement });
    const contextManager = await ContextManager.create({
      canvasElement: canvasManager.canvasElement,
      alpha: options.alpha ?? false,
    });
    const renderer = new Renderer(options, canvasManager, contextManager);
    renderer.init();
    return renderer;
  }

  async init() {
    this.samplerLibrary = new SamplerLibrary(this.device);
    this.textureLibrary = new TextureLibrary(this);
    this.shaderLibrary = new ShaderLibrary();

    this.initializeBindGroupLayouts();

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

  private initializeBindGroupLayouts() {
    if (!this.device) throw new Error(errorMessages.missingDevice);
    this.cameraBindGroupLayout = this.device.createBindGroupLayout(cameraBindGroupLayoutDescriptor);
    this.sceneBindGroupLayout = this.device.createBindGroupLayout(sceneBindGroupLayoutDescriptor);
    this.entityBindGroupLayout = this.device.createBindGroupLayout(entityBindGroupLayoutDescriptor);
    this.materialBindGroupLayouts = new Map<MaterialType, GPUBindGroupLayout>();

    for (const [materialType, layoutDescriptor] of materialBindGroupLayoutDescriptors.entries()) {
      const layout = this.device.createBindGroupLayout(layoutDescriptor);
      this.materialBindGroupLayouts.set(materialType, layout);
    }
  }

  private updateFrameTimers() {
    this.currentFrame++;
    const currentTime = performance.now();

    if (!this.previousTime) {
      this.previousTime = currentTime;
    }

    this.deltaTime = currentTime - this.previousTime;
    this.elapsedTime += this.deltaTime;
    this.previousTime = currentTime;
  }

  private synchronizeSceneAndCamera(scene: Scene, camera: PerspectiveCamera) {
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

  render(scene: Scene, camera: PerspectiveCamera) {
    this.updateFrameTimers();
    this.synchronizeSceneAndCamera(scene, camera);

    if (!this.passManager) throw new Error(errorMessages.missingPassManager);
    if (!this.device) throw new Error(errorMessages.missingDevice);

    const commandEncoder = this.device.createCommandEncoder();

    this.passManager.scene = scene;
    this.passManager.camera = camera;
    this.passManager.runPass('render', commandEncoder);

    this.device.queue.submit([commandEncoder.finish()]);
  }
}

export { Renderer };
