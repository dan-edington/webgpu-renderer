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

export type Canvas = {
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  setOnResize: (resizeFunction: ResizeFunction) => void;
};

export type RendererProps = {
  canvasOptions: CanvasOptions;
};

export type Renderer = {
  render: () => void;
  createPipeline: (pipelineOptions: PipelineOptions) => Pipeline;
  device: GPUDevice;
  canvasElement: HTMLCanvasElement;
  presentationFormat: GPUTextureFormat;
  context: GPUCanvasContext;
  setOnResize: (resizeFunction: ResizeFunction) => void;
};

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
