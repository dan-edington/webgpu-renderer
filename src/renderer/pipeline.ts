interface Pipeline {
  pipeline: GPURenderPipeline;
  render: (
    commandEncoder: GPUCommandEncoder,
    textureView: GPUTextureView,
    pipeline: GPURenderPipeline,
    bindGroup: GPUBindGroup
  ) => void;
  bindGroup: GPUBindGroup;
}

interface PipelineOptions {
  descriptor: GPURenderPipelineDescriptor;
  bindGroup: GPUBindGroup;
  renderFunction: PipelineRenderFunction;
}

type PipelineRenderFunction = (
  commandEncoder: GPUCommandEncoder,
  textureView: GPUTextureView,
  pipeline: GPURenderPipeline,
  bindGroup: GPUBindGroup
) => void;

function createPipeline(device: GPUDevice, pipelines: Pipeline[]) {
  return function (pipelineOptions: PipelineOptions): Pipeline {
    const { descriptor, bindGroup, renderFunction } = pipelineOptions;

    const pipeline = device.createRenderPipeline(descriptor);

    function render(commandEncoder: GPUCommandEncoder, textureView: GPUTextureView) {
      renderFunction(commandEncoder, textureView, pipeline, bindGroup);
    }

    const output = {
      pipeline,
      bindGroup,
      render,
    };

    pipelines.push(output);

    return output;
  };
}

export { createPipeline };
export type { Pipeline, PipelineOptions, PipelineRenderFunction };
