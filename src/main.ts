import { createRenderer } from "./renderer/renderer";
import "./style.css";
import shader from "./shader.wgsl?raw";

const renderer = await createRenderer({ canvasOptions: { className: "webgpu-canvas" } });

if (renderer) {
  const basicShader = renderer.createShaderModule({
    label: "basic shader",
    code: shader,
  });

  function basicPipelineRenderFunction(
    commandEncoder: GPUCommandEncoder,
    textureView: GPUTextureView,
    pipeline: GPURenderPipeline,
    bindGroup: GPUBindGroup
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
    passEncoder.draw(3);
    passEncoder.end();
  }

  const bindGroupLayout = renderer.device.createBindGroupLayout({
    entries: [], // No resources in this case
  });

  const bindGroup = renderer.device.createBindGroup({
    layout: bindGroupLayout, // Ensure bind group layout is correctly applied
    entries: [], // No bindings yet
  });

  const basicPipelineDesciptor = {
    label: "simple pipeline",
    layout: renderer.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout], // Apply layout to the pipeline
    }),
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

  renderer.createPipeline({
    descriptor: basicPipelineDesciptor,
    bindGroup,
    renderFunction: basicPipelineRenderFunction,
  });

  function renderLoop() {
    if (renderer) {
      renderer.render();
      requestAnimationFrame(renderLoop);
    }
  }

  renderLoop();
}
