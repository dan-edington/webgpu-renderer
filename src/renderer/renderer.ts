import { initCanvas } from "./canvas";
import { createShaderModule as _createShaderModule } from "./shaderModule";
import { createPipeline as _createPipeline, Pipeline } from "./pipeline";
import type { RendererProps, Renderer } from "../types";

async function createRenderer(props: RendererProps): Promise<Renderer | false> {
  const { canvasOptions } = props;

  const canvas = await initCanvas(canvasOptions);

  if (!canvas) {
    console.error("WebGPU not supported or something.");
    return false;
  }

  const { device, canvasElement, presentationFormat, context } = canvas;
  const pipelines: Pipeline[] = [];

  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    for (let i = 0; i < pipelines.length; i++) {
      const { pipeline, render } = pipelines[i];
      render(commandEncoder, textureView, pipeline);
    }

    device.queue.submit([commandEncoder.finish()]);
  }

  const createShaderModule = _createShaderModule(device);
  const createPipeline = _createPipeline(device, pipelines);

  return {
    render,
    createShaderModule,
    createPipeline,
    device,
    canvasElement,
    presentationFormat,
    context,
  };
}

export { createRenderer };
export type { Renderer };
