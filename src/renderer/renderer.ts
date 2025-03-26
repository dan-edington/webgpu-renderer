import { Canvas } from "./canvas";
import type { RendererProps, IRenderer, PipelineOptions, Pipeline } from "../types";

class Renderer implements IRenderer {
  canvas: Canvas;
  device?: GPUDevice;
  canvasElement?: HTMLCanvasElement;
  presentationFormat?: GPUTextureFormat;
  context: GPUCanvasContext | null;
  isReady?: boolean;
  #pipelines: Pipeline[];

  constructor(options: RendererProps) {
    const { canvasOptions } = options;
    this.canvas = new Canvas(canvasOptions);
    this.#pipelines = [];
    this.context = null;
    this.isReady = false;
  }

  async init() {
    if (this.canvas) {
      await this.canvas.init();
      this.device = this.canvas.device;
      this.canvasElement = this.canvas.canvasElement;
      this.presentationFormat = this.canvas.presentationFormat;
      this.context = this.canvas.context;
      this.isReady = true;
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

  createShaderModule(options: GPUShaderModuleDescriptor): GPUShaderModule {
    if (this.device) {
      return this.device.createShaderModule(options);
    } else {
      throw new Error("Device is not initialized");
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

  createPipelineDescriptor(options: Partial<GPURenderPipelineDescriptor>): GPURenderPipelineDescriptor {
    const vertexShaderModule = options.vertex?.module;
    const fragmentShaderModule = options.fragment?.module;

    if (!vertexShaderModule || !fragmentShaderModule) {
      throw new Error("Vertex and Fragment shader modules are required");
    }

    const defaultDescriptor: GPURenderPipelineDescriptor = {
      label: `Pipeline ${Date.now()}`,
      layout: "auto",
      vertex: {
        entryPoint: "vertex_shader",
        module: vertexShaderModule,
      },
      fragment: {
        entryPoint: "fragment_shader",
        module: fragmentShaderModule,
        targets: [{ format: this.presentationFormat || "bgra8unorm" }],
      },
    };

    return {
      ...defaultDescriptor,
      ...options,
    } as GPURenderPipelineDescriptor;
  }
}

export { Renderer };
