import { errorMessages } from '../../constants/errorMessages';
import { Geometry } from '../../Geometry';
import { PerspectiveCamera } from '../../PerspectiveCamera';
import { Scene } from '../../Scene';
import { PassContext } from '../PassManager';
import { Pass, PassOptions } from './Pass';

class PostProcessingPass extends Pass {
  geometry: Geometry;
  pipeline?: GPURenderPipeline;
  bindGroup: GPUBindGroup | null = null;
  boundInputView: GPUTextureView | null = null;

  constructor(options: PassOptions) {
    super(options);

    const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    // flip uvs to match WebGPU texture coordinate system
    for (let i = 1; i < uvs.length; i += 2) {
      uvs[i] = 1 - uvs[i];
    }
    const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);

    this.geometry = new Geometry({ vertices, indices, uvs, normals });
    this.geometry.init(this.rendererInstance);
    this.createPipeline();
  }

  private createPipeline() {
    const PipeLine = this.rendererInstance.pipelineLibrary?.getPipeline('postprocessing');
    if (!PipeLine) throw new Error(errorMessages.missingPipeline);

    this.pipeline = PipeLine.createPipeline({
      renderer: this.rendererInstance,
    });
  }

  private buildBindGroup(inputView: GPUTextureView): GPUBindGroup {
    if (!this.pipeline) throw new Error(errorMessages.missingPipeline);

    const sampler = this.rendererInstance.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    return this.rendererInstance.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: inputView },
      ],
    });
  }

  private buildPostProcessingPassDescriptor(scene: Scene, passContext: PassContext): GPURenderPassDescriptor {
    if (!this.rendererInstance.context) throw new Error(errorMessages.missingContext);
    if (!this.rendererInstance.depthTexture?.depthTexture) throw new Error(errorMessages.missingDepthTexture);

    return {
      label: this.name,
      colorAttachments: [
        {
          view: passContext.getSwapChainView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: scene.clearColor,
        },
      ],
    };
  }

  override runPass(
    commandEncoder: GPUCommandEncoder,
    scene: Scene,
    _camera: PerspectiveCamera,
    passContext: PassContext,
  ) {
    const inputName = this.route.input;
    if (!inputName) throw new Error('PostProcessingPass route.input is not set.');

    const inputTarget = passContext.getRenderTarget(inputName);
    if (!inputTarget) throw new Error(`PostProcessingPass: render target "${inputName}" not found.`);

    // Rebuild bind group if input view changed (e.g. after resize)
    if (!this.bindGroup || this.boundInputView !== inputTarget.view) {
      this.bindGroup = this.buildBindGroup(inputTarget.view);
      this.boundInputView = inputTarget.view;
    }

    const renderPassDescriptor = this.buildPostProcessingPassDescriptor(scene, passContext);
    if (!this.pipeline) throw new Error(errorMessages.missingPipeline);

    const pass = commandEncoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);

    pass.setVertexBuffer(0, this.geometry.vertexBuffer);
    pass.setVertexBuffer(1, this.geometry.normalBuffer);
    pass.setVertexBuffer(2, this.geometry.uvBuffer);

    pass.setIndexBuffer(this.geometry.indexBuffer!, this.geometry.indexFormat);
    pass.drawIndexed(this.geometry.indexCount);
    pass.end();
  }
}

export { PostProcessingPass };
