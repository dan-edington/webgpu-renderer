export type CBO = {
  buffer: GPUBuffer | null;
  data: ArrayBuffer;
  uniforms: {
    uResolution: Float32Array;
    uCameraPosition: Float32Array;
  };
};

export type CanvasOptions = {
  className?: string;
  dpr?: number;
};

export type ICanvas = {
  device: GPUDevice | undefined;
  presentationFormat: GPUTextureFormat | undefined;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext | null;
  onResize: ResizeFunction;
};

export type RendererProps = {
  canvasOptions: CanvasOptions;
};

export interface IRenderer {
  canvas: ICanvas;
  device?: GPUDevice;
  canvasElement?: HTMLCanvasElement;
  presentationFormat?: GPUTextureFormat;
  context: GPUCanvasContext | null;
  isReady?: boolean;
  onResize?: ResizeFunction;
  render: () => void;
  init: () => Promise<void>;
  createPipeline: (options: PipelineOptions) => Pipeline;
  createPipelineDescriptor: (options: Partial<GPURenderPipelineDescriptor>) => GPURenderPipelineDescriptor;
  createShaderModule: (options: GPUShaderModuleDescriptor) => GPUShaderModule;
}

export type Pipeline = {
  pipeline: GPURenderPipeline;
  render: PipelineRenderFunction;
};

export type PipelineOptions = {
  descriptor: GPURenderPipelineDescriptor;
  renderFunction: PipelineRenderFunction;
};

export type PipelineRenderFunction = (
  commandEncoder: GPUCommandEncoder,
  textureView: GPUTextureView,
  pipeline: GPURenderPipeline
) => void;

export type ResizeFunction = (width: number, height: number) => void;

export type UniformsList = Record<string, Float32Array | number[]>;

export interface IUBOOptions {
  renderer: IRenderer;
  buffer: ArrayBuffer;
  uniforms: UniformsList;
  label?: string;
}

export interface IUBO {
  label: string;
  gpuBuffer?: GPUBuffer;
  bufferData?: ArrayBuffer;
  uniforms?: UniformsList;
  updateUniforms(updatedUniforms: UniformsList): void;
  writeUpdatedBufferData(): void;
}
