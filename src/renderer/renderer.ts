import { Canvas } from "./canvas";
import type { RendererProps, IRenderer, PipelineOptions, Pipeline } from "../types";

class Renderer implements IRenderer {
  canvas: Canvas;
  device: GPUDevice | undefined;
  canvasElement: HTMLCanvasElement | undefined;
  presentationFormat: GPUTextureFormat | undefined;
  context: GPUCanvasContext | null;
  #pipelines: Pipeline[];

  constructor(options: RendererProps) {
    const { canvasOptions } = options;
    this.canvas = new Canvas(canvasOptions);
    this.#pipelines = [];
    this.context = null;
  }

  async init() {
    if (this.canvas) {
      await this.canvas.init();
      this.device = this.canvas.device;
      this.canvasElement = this.canvas.canvasElement;
      this.presentationFormat = this.canvas.presentationFormat;
      this.context = this.canvas.context;
    }
  }

  render() {
    if (this.device && this.context) {
      const commandEncoder = this.device.createCommandEncoder();
      const textureView = this.context.getCurrentTexture().createView();

      for (let i = 0; i < this.#pipelines.length; i++) {
        const { pipeline, render } = this.#pipelines[i];
        render(commandEncoder, textureView, pipeline);
      }

      this.device.queue.submit([commandEncoder.finish()]);
    }
  }

  createPipeline(pipelineOptions: PipelineOptions): Pipeline {
    const { descriptor, renderFunction } = pipelineOptions;

    if (this.device) {
      const pipeline = this.device.createRenderPipeline(descriptor);

      function render(commandEncoder: GPUCommandEncoder, textureView: GPUTextureView) {
        renderFunction(commandEncoder, textureView, pipeline);
      }

      const output = {
        pipeline,
        render,
      };

      this.#pipelines.push(output);

      return output;
    } else {
      throw new Error("Device is not initialized");
    }
  }
}

export { Renderer };
