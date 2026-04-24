import { Mesh } from '../Mesh';
import type { Geometry } from '../Geometry';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { MaterialLayoutRepository } from '../materials/MaterialLayoutRepository';
import type { Material } from '../materials/Material';
import { TextureLibrary } from '../libraries/TextureLibrary';
import { SamplerLibrary } from '../libraries/SamplerLibrary';
import { ShaderLibrary } from '../libraries/ShaderLibrary';
import { Scene } from '../Scene';
import { errorMessages } from '../constants/errorMessages';
import { constants } from '../constants/constants';
import type { MaterialType } from '../types';
import { DepthTexture } from '../DepthTexture';
import { CanvasManager } from './CanvasManager';
import { ContextManager } from './ContextManager';

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

  render(scene: Scene, camera: PerspectiveCamera) {
    this.updateTimersAndFrameCounter();

    if (!scene.isInitialized) scene.init(this);
    if (!camera.isInitialized) camera.init(this);

    scene.updateRenderList();
    scene.updateLights();

    if (!this.device) throw new Error(errorMessages.missingDevice);
    if (!this.context) throw new Error(errorMessages.missingContext);
    if (!this.presentationFormat) throw new Error(errorMessages.missingPresentationFormat);
    if (!this.depthTexture || !this.depthTexture.depthTextureView) throw new Error(errorMessages.missingDepthTexture);
    if (!camera.cameraUniformBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);
    if (!camera.cameraBindGroup) throw new Error(errorMessages.missingCameraBindGroup);
    if (!scene.sceneUniformsBindGroup) throw new Error(errorMessages.missingSceneBindGroup);

    scene.sceneUniformsBuffer?.writeUpdatedBufferData();
    scene.lightUniformsBuffer?.writeUpdatedBufferData();
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
      depthStencilAttachment: {
        view: this.depthTexture.depthTextureView,
        depthLoadOp: 'clear',
        depthClearValue: 1,
        depthStoreOp: 'store',
      },
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
}

export { Renderer };
