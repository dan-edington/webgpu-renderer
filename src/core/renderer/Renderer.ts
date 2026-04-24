import type { Geometry } from '../Geometry';
import type { MaterialType } from '../types';
import type { Material } from '../materials/Material';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { MaterialLayoutRepository } from '../materials/MaterialLayoutRepository';
import { TextureLibrary } from './libraries/TextureLibrary';
import { SamplerLibrary } from './libraries/SamplerLibrary';
import { ShaderLibrary } from './libraries/ShaderLibrary';
import { Scene } from '../Scene';
import { errorMessages } from '../constants/errorMessages';
import { DepthTexture } from '../DepthTexture';
import { CanvasManager } from './CanvasManager';
import { ContextManager } from './ContextManager';
import { PassManager } from './PassManager';
import { OpaquePass } from './passes/OpaquePass';

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
  materialLayoutRepository: MaterialLayoutRepository;
  textureLibrary: TextureLibrary | null;
  samplerLibrary: SamplerLibrary | null;
  shaderLibrary: ShaderLibrary | null;
  depthTexture: DepthTexture | null;
  passManager: PassManager | null;
  init(): Promise<void>;
  getMaterialBindGroupLayout(materialType: MaterialType): GPUBindGroupLayout;
  createMeshPipeline(material: Material, geometry: Geometry): GPURenderPipeline;
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
  materialLayoutRepository: MaterialLayoutRepository;
  depthTexture: DepthTexture | null = null;
  textureLibrary: TextureLibrary | null = null;
  samplerLibrary: SamplerLibrary | null = null;
  shaderLibrary: ShaderLibrary | null = null;
  passManager: PassManager | null = null;
  private materialBindGroupLayoutCache: Map<MaterialType, GPUBindGroupLayout> = new Map();
  private meshPipelineCache: Map<string, GPURenderPipeline> = new Map();

  constructor(options: RendererOptions) {
    this.dpr = options.dpr ?? window.devicePixelRatio;
    this.alpha = options.alpha ?? true;
    this.materialLayoutRepository = new MaterialLayoutRepository();
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

    this.configurePasses();
  }

  private configurePasses() {
    this.passManager = new PassManager(this);
    this.passManager.registerPass('opaque', OpaquePass);
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

  getMaterialBindGroupLayout(materialType: MaterialType): GPUBindGroupLayout {
    if (!this.device) throw new Error(errorMessages.missingDevice);

    const cachedLayout = this.materialBindGroupLayoutCache.get(materialType);
    if (cachedLayout) return cachedLayout;

    const layoutDescriptor = this.materialLayoutRepository.getMaterialLayoutDescriptor(materialType);
    if (!layoutDescriptor) throw new Error(`No material layout descriptor registered for '${materialType}'.`);

    const layout = this.device.createBindGroupLayout(layoutDescriptor);
    this.materialBindGroupLayoutCache.set(materialType, layout);

    return layout;
  }

  createMeshPipeline(material: Material, geometry: Geometry): GPURenderPipeline {
    if (!this.device) throw new Error(errorMessages.missingDevice);
    if (!this.presentationFormat) throw new Error(errorMessages.missingPresentationFormat);
    if (!this.cameraBindGroupLayout) throw new Error(errorMessages.missingCameraBufferLayout);
    if (!this.sceneBindGroupLayout) throw new Error(errorMessages.missingSceneBindGroupLayout);
    if (!this.entityBindGroupLayout) throw new Error(errorMessages.missingEntityBindGroupLayout);
    if (!material.shaderModule) throw new Error(errorMessages.missingMaterialShaderModule);
    if (!this.depthTexture) throw new Error(errorMessages.missingDepthTexture);

    const materialBindGroupLayout = this.getMaterialBindGroupLayout(material.type);
    const pipelineKey = `${material.getPipelineCacheKey()}:${geometry.topology}:${this.presentationFormat}`;
    const cachedPipeline = this.meshPipelineCache.get(pipelineKey);

    if (cachedPipeline) {
      return cachedPipeline;
    }

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.cameraBindGroupLayout,
        this.sceneBindGroupLayout,
        materialBindGroupLayout,
        this.entityBindGroupLayout,
      ],
    });

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      layout: pipelineLayout,
      vertex: {
        module: material.shaderModule,
        entryPoint: material.shaderEntryPoints.vertex,
        buffers: [
          {
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
          {
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
        ],
      },
      fragment: {
        module: material.shaderModule,
        entryPoint: material.shaderEntryPoints.fragment,
        targets: [
          {
            format: this.presentationFormat,
          },
        ],
      },
      primitive: {
        topology: geometry.topology,
        cullMode: 'back',
      },
      depthStencil: {
        format: this.depthTexture.format,
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    };

    const pipeline = this.device.createRenderPipeline(pipelineDescriptor);

    this.meshPipelineCache.set(pipelineKey, pipeline);

    return pipeline;
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

  render(scene: Scene, camera: PerspectiveCamera) {
    this.updateTimersAndFrameCounter();
    this.updateSceneAndCamera(scene, camera);

    if (!this.passManager) throw new Error('PassManager not initialized.');
    if (!this.device) throw new Error(errorMessages.missingDevice);

    const commandEncoder = this.device.createCommandEncoder();

    this.passManager.scene = scene;
    this.passManager.camera = camera;
    this.passManager.runPass('opaque', commandEncoder);

    this.device.queue.submit([commandEncoder.finish()]);
  }
}

export { Renderer };
