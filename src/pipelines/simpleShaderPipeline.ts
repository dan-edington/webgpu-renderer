import shader from "./shaders/shader.wgsl?raw";
import type { Renderer } from "../renderer/renderer";

function simpleShaderPipeline(renderer: Renderer, uniformsBuffer: GPUBuffer) {
  const basicShader = renderer.createShaderModule({
    label: "basic shader",
    code: shader,
  });

  const basicPipelineDesciptor = {
    label: "simple pipeline",
    layout: "auto",
    vertex: {
      entryPoint: "vertex_shader",
      module: basicShader,
    },
    fragment: {
      entryPoint: "fragment_shader",
      module: basicShader,
      targets: [{ format: renderer.presentationFormat }],
    },
  } as GPURenderPipelineDescriptor;

  const pipeline = renderer.createPipeline({
    descriptor: basicPipelineDesciptor,
    renderFunction: basicPipelineRenderFunction,
  });

  const bindGroup = renderer.device.createBindGroup({
    layout: pipeline.pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformsBuffer,
        },
      },
    ],
  });

  function basicPipelineRenderFunction(
    commandEncoder: GPUCommandEncoder,
    textureView: GPUTextureView,
    pipeline: GPURenderPipeline
  ) {
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(6);
    passEncoder.end();
  }
}

export { simpleShaderPipeline };
