import "./style.css";
import { initCanvas } from "./renderer/canvas.ts";
import shader from "./shader.wgsl?raw";
// import { createUniformBuffer } from "./util/uniformBuffer.ts";

const canvas = await initCanvas({ className: "webgpu-canvas" });
let time = performance.now();

if (!canvas) {
  console.error("WebGPU not supported or something.");
} else {
  const { device, presentationFormat, context, setRenderFunction, canvasElement } = canvas;

  const shaderModule = device.createShaderModule({
    label: "triangle shader",
    code: shader,
  });

  const pipeline = device.createRenderPipeline({
    label: "triangle pipeline",
    layout: "auto", // automatically create a pipeline layout
    vertex: {
      entryPoint: "vertex_shader", // entry function (not needed if only one function)
      module: shaderModule,
    },
    fragment: {
      entryPoint: "fragment_shader", // entry function (not needed if only one function)
      module: shaderModule,
      targets: [{ format: presentationFormat }], // create render target(s) and set the format
    },
  });

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "basic render pass",
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(), // the texture to render to (canvas)
        clearValue: [0.3, 0.3, 0.3, 1.0], // clear color
        loadOp: "clear", // clear the texture
        storeOp: "store", // store the result
      },
    ],
  };

  // const newBuffer = createUniformBuffer({
  //   device: device,
  //   uniforms: {
  //     color: { type: "vec4<f32>", value: [1.0, 1.0, 0.0, 1.0] },
  //     scale: { type: "vec2<f32>", value: [1, 1] },
  //     offset: { type: "vec2<f32>", value: [0.0, 0.0] },
  //     time: { type: "f32", value: 0.0 },
  //   },
  // });

  // console.log(newBuffer);

  // f = float32 = 32 bits / 8 bits in a byte = 4 bytes
  // vecNf = N * f (vec2f = 2 * 4 bytes = 8 bytes) (vec4f = 4 * 4 bytes = 16 bytes) etc.

  // color: vec4f, = 4 * 4 bytes
  // scale: vec2f, = 2 * 4 bytes
  // offset: vec2f, = 2 * 4 bytes

  const uniformBufferSize =
    4 * 4 + // color
    2 * 4 + // scale
    2 * 4 + // offset
    4; // time

  // uniform buffer has an alignment requirement of multiple of 16 bytes so round the uniformBufferSize up to the nearest multiple of 16

  const newUniformBufferSize = Math.ceil(uniformBufferSize / 16) * 16;

  const uniformBuffer = device.createBuffer({
    size: newUniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformValues = new Float32Array(newUniformBufferSize / 4);
  const kColorOffset = 0; // first position
  const kScaleOffset = 4; // color takes up 4 bytes so next position is 4
  const kOffsetOffset = 6; // scale takes up 2 bytes so next position is 6
  const kOffsetTime = 8;

  uniformValues.set([1.0, 1.0, 0.0, 1.0], kColorOffset);
  uniformValues.set([0.25, 0.25], kOffsetOffset);
  uniformValues.set([time], kOffsetTime);

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  function render() {
    time = performance.now();
    const aspect = canvasElement.width / canvasElement.height;

    uniformValues.set([0.5 / aspect, 0.5], kScaleOffset); // set the scale
    uniformValues.set([time], kOffsetTime);

    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    // get the current texture from the canvas and set it as the render target
    const view = context.getCurrentTexture().createView();
    (renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view = view;

    // create a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: "my encoder" });

    // create a render pass encoder to start encoding render pass commands
    const pass = encoder.beginRenderPass(renderPassDescriptor);

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3); // call the vertex shader 3 times (there are 3 vertices)
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(render);
  }

  setRenderFunction(render);
}
