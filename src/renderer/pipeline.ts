interface Pipeline {
  pipeline: GPURenderPipeline;
  render: PipelineRenderFunction;
}

interface PipelineOptions {
  descriptor: GPURenderPipelineDescriptor;
  renderFunction: PipelineRenderFunction;
}

type PipelineRenderFunction = (
  commandEncoder: GPUCommandEncoder,
  textureView: GPUTextureView,
  pipeline: GPURenderPipeline
) => void;

function createPipeline(device: GPUDevice, pipelines: Pipeline[]) {
  return function (pipelineOptions: PipelineOptions): Pipeline {
    const { descriptor, renderFunction } = pipelineOptions;

    const pipeline = device.createRenderPipeline(descriptor);

    function render(commandEncoder: GPUCommandEncoder, textureView: GPUTextureView) {
      renderFunction(commandEncoder, textureView, pipeline);
    }

    const output = {
      pipeline,
      render,
    };

    pipelines.push(output);

    return output;
  };
}

export { createPipeline };
export type { Pipeline, PipelineOptions, PipelineRenderFunction };
