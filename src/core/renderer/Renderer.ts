import type { MaterialType } from '../types';
import { PerspectiveCamera } from '../camera/PerspectiveCamera';
import { TextureLibrary } from './libraries/TextureLibrary';
import { SamplerLibrary } from './libraries/SamplerLibrary';
import { ShaderLibrary } from './libraries/ShaderLibrary';
import { Scene } from '../scene/Scene';
import { Mesh } from '../scene/Mesh';
import { errorMessages } from '../constants/errorMessages';
import { DepthTexture } from '../textures/DepthTexture';
import { SurfaceManager } from './SurfaceManager';
import { PassManager } from './PassManager';
import { RenderPass } from './passes/RenderPass';
import { cameraBindGroupLayoutDescriptor } from './bindGroupLayouts/camera';
import { sceneBindGroupLayoutDescriptor } from './bindGroupLayouts/scene';
import { entityBindGroupLayoutDescriptor } from './bindGroupLayouts/entity';
import { materialBindGroupLayoutDescriptors } from './bindGroupLayouts/materials';
import { PostProcessingPass } from './passes/PostProcessingPass';
import { PipelineManager } from './PipelineManager';

interface IRenderer {
  surfaceManager: SurfaceManager;
  dpr: number;
  multiSampling: number;
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
  pipelineManager: PipelineManager | null;
  init(): Promise<void>;
  render(scene: Scene, camera: PerspectiveCamera): void;
}

type RendererOptions = {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
  multiSampling?: number;
};

class Renderer implements IRenderer {
  surfaceManager: SurfaceManager;
  dpr: number;
  multiSampling: number;
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
  passManager: PassManager | null = null;
  pipelineManager: PipelineManager | null = null;

  private constructor(options: RendererOptions, surfaceManager: SurfaceManager) {
    this.dpr = options.dpr ?? window.devicePixelRatio;
    this.multiSampling = options.multiSampling ?? 4;
    this.alpha = options.alpha ?? true;
    this.surfaceManager = surfaceManager;
    this.surfaceManager.rendererInstance = this;
    this.context = this.surfaceManager.context;
    this.adapter = this.surfaceManager.adapter;
    this.device = this.surfaceManager.device;
    this.presentationFormat = this.surfaceManager.presentationFormat;
  }

  static async create(options: RendererOptions): Promise<Renderer> {
    const surfaceManager = await SurfaceManager.create({
      containerElement: options.containerElement,
      alpha: options.alpha ?? false,
      multiSampling: options.multiSampling ?? 4,
    });

    const renderer = new Renderer(options, surfaceManager);

    renderer.init();

    return renderer;
  }

  async init() {
    this.samplerLibrary = new SamplerLibrary(this.device);
    this.textureLibrary = new TextureLibrary(this);
    this.shaderLibrary = new ShaderLibrary(this);

    this.initializeBindGroupLayouts();

    this.surfaceManager.updateCanvasSize();

    this.depthTexture = new DepthTexture({
      width: this.surfaceManager.canvasElement.width,
      height: this.surfaceManager.canvasElement.height,
      rendererInstance: this,
    });

    this.pipelineManager = new PipelineManager(this);
    this.configurePasses();
  }

  private configurePasses() {
    this.passManager = new PassManager(this);

    this.passManager.registerPass('render', RenderPass, {
      input: null,
      output: 'scene',
      renderToSwapchain: false,
    });

    this.passManager.registerPass('postprocessing', PostProcessingPass, {
      input: 'scene',
      output: 'postprocess',
      renderToSwapchain: true,
    });
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

  private prepareFrame(scene: Scene, camera: PerspectiveCamera) {
    if (!scene.isInitialized) scene.init(this);
    if (!camera.isInitialized) camera.init(this);

    scene.updateRenderList();
    scene.updateLights();

    scene.renderList.forEach((entity) => {
      if (entity instanceof Mesh && !entity.isInitialized) {
        entity.init(this);
      }
    });

    if (!scene.sceneUniformsBuffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    if (!scene.lightManager.lightUniformsBuffer) throw new Error(errorMessages.missingLightUniformsBuffer);
    if (!camera.cameraUniformsBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);

    scene.sceneUniformsBuffer.writeUpdatedBufferData();
    scene.lightManager.lightUniformsBuffer.writeUpdatedBufferData();

    camera.updateCameraUniforms();
  }

  render(scene: Scene, camera: PerspectiveCamera) {
    this.updateFrameTimers();
    this.prepareFrame(scene, camera);

    if (!this.passManager) throw new Error(errorMessages.missingPassManager);
    if (!this.device) throw new Error(errorMessages.missingDevice);

    const commandEncoder = this.device.createCommandEncoder();

    this.passManager.scene = scene;
    this.passManager.camera = camera;
    this.passManager.runPass('render', commandEncoder);
    this.passManager.runPass('postprocessing', commandEncoder);

    this.device.queue.submit([commandEncoder.finish()]);
  }
}

export { Renderer };
