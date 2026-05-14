import { constants } from '../constants/constants';
import { Renderer } from './Renderer';

interface IPipelineManager {
  rendererInstance: Renderer;
  pipelineCache: Map<string, GPURenderPipeline>;
  pipelineLayoutCache: Map<string, GPUPipelineLayout>;
  getOrCreateRenderPipeline(options: CreateRenderPipelineOptions): GPURenderPipeline;
}

type CreateRenderPipelineOptions = {
  label?: string;
  shaderModule: GPUShaderModule;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
  bindGroupLayouts: GPUBindGroupLayout[];
  vertexBuffers: GPUVertexBufferLayout[];
  topology?: GPUPrimitiveTopology;
  cullMode?: GPUCullMode;
  format?: GPUTextureFormat;
  blendState?: GPUBlendState;
  depthStencilState?: GPUDepthStencilState;
  msaa?: number;
};

class PipelineManager implements IPipelineManager {
  readonly rendererInstance: Renderer;
  readonly pipelineCache: Map<string, GPURenderPipeline>;
  readonly pipelineLayoutCache: Map<string, GPUPipelineLayout>;

  constructor(rendererInstance: Renderer) {
    this.rendererInstance = rendererInstance;
    this.pipelineCache = new Map();
    this.pipelineLayoutCache = new Map();
  }

  getOrCreateRenderPipeline(options: CreateRenderPipelineOptions) {
    const {
      label = `Pipeline_${crypto.randomUUID()}`,
      shaderModule,
      shaderEntryPoints = { vertex: 'vertex_shader', fragment: 'fragment_shader' },
      vertexBuffers,
      bindGroupLayouts,
      format = constants.INTERNAL_COLOR_FORMAT,
      topology = 'triangle-list',
      cullMode = 'back',
      blendState,
      depthStencilState,
      msaa = this.rendererInstance.multiSampling,
    } = options;

    const pipelineCacheKey = this.generateRenderPipelineCacheKey(options);

    if (this.pipelineCache.has(pipelineCacheKey)) {
      return this.pipelineCache.get(pipelineCacheKey)!;
    }

    let pipelineLayout: GPUPipelineLayout | 'auto';

    if (bindGroupLayouts) {
      pipelineLayout = this.getOrCreatePipelineLayout(bindGroupLayouts);
    } else {
      pipelineLayout = 'auto';
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label,
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: shaderEntryPoints.vertex,
        buffers: vertexBuffers,
      },
      fragment: {
        module: shaderModule,
        entryPoint: shaderEntryPoints.fragment,
        targets: [
          {
            format,
            blend: blendState,
          },
        ],
      },
      primitive: {
        topology,
        cullMode,
      },
      depthStencil: depthStencilState,
      multisample: {
        count: msaa,
      },
    };

    const renderPipeline = this.rendererInstance.device.createRenderPipeline(pipelineDescriptor);

    this.pipelineCache.set(pipelineCacheKey, renderPipeline);

    return renderPipeline;
  }

  private generateRenderPipelineCacheKey(options: CreateRenderPipelineOptions): string {
    const {
      shaderModule,
      shaderEntryPoints = { vertex: 'vertex_shader', fragment: 'fragment_shader' },
      vertexBuffers,
      bindGroupLayouts,
      format = constants.INTERNAL_COLOR_FORMAT,
      topology = 'triangle-list',
      cullMode = 'back',
      blendState,
      depthStencilState,
    } = options;

    const vertexBufferKey = vertexBuffers
      .map((vertexBuffer) => {
        const attributeKey = Array.from(vertexBuffer.attributes)
          .map((attribute) => `${attribute.shaderLocation}:${attribute.format}:${attribute.offset}`)
          .join(',');

        return `${vertexBuffer.arrayStride}:${vertexBuffer.stepMode ?? 'vertex'}:${attributeKey}`;
      })
      .join('|');

    const bindGroupLayoutKey = this.createBindGroupLayoutCacheKey(bindGroupLayouts);
    const blendKey = blendState ? JSON.stringify(blendState) : 'no-blend';
    const depthStencilKey = depthStencilState ? JSON.stringify(depthStencilState) : 'no-depth';
    const shaderModuleKey = shaderModule.label ?? 'unlabelled-shader';

    return `${shaderModuleKey}|${shaderEntryPoints.vertex}|${shaderEntryPoints.fragment}|${vertexBufferKey}|${bindGroupLayoutKey}|${format}|${topology}|${cullMode}|${depthStencilKey}|${blendKey}|msaa:${this.rendererInstance.multiSampling}`;
  }

  private getOrCreatePipelineLayout(bindGroupLayouts: GPUBindGroupLayout[]) {
    const cacheKey = this.createBindGroupLayoutCacheKey(bindGroupLayouts, true);

    if (this.pipelineLayoutCache.has(cacheKey)) {
      return this.pipelineLayoutCache.get(cacheKey)!;
    }

    const pipelineLayout = this.rendererInstance.device.createPipelineLayout({
      bindGroupLayouts,
    });

    this.pipelineLayoutCache.set(cacheKey, pipelineLayout);

    return pipelineLayout;
  }

  private createBindGroupLayoutCacheKey(bindGroupLayouts: GPUBindGroupLayout[], warnOnMissingLabels = false): string {
    const missingLabelLayouts: string[] = [];

    const cacheKey = bindGroupLayouts
      .map((bindGroupLayout, index) => {
        if (!bindGroupLayout.label) {
          missingLabelLayouts.push(bindGroupLayout.toString());
        }

        return bindGroupLayout.label || `missing-label-${index}-${crypto.randomUUID()}`;
      })
      .join('|');

    if (warnOnMissingLabels && missingLabelLayouts.length > 0) {
      console.warn(
        `PipelineManager: The following bind group layouts are missing labels, which may lead to cache collisions. Please add labels to these bind group layouts for better caching performance.`,
        missingLabelLayouts,
      );
    }

    return cacheKey;
  }
}

export { PipelineManager };
