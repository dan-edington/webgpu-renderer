import { constants } from '../../constants/constants';
import { errorMessages } from '../../constants/errorMessages';
import { Mesh } from '../../scene/Mesh';
import { PerspectiveCamera } from '../../camera/PerspectiveCamera';
import { Scene } from '../../scene/Scene';
import { PassContext } from '../PassManager';
import { Pass, PassOptions } from './Pass';

class RenderPass extends Pass {
  constructor(options: PassOptions) {
    super(options);
  }

  private buildRenderPassDescriptor(scene: Scene, passContext: PassContext): GPURenderPassDescriptor {
    if (!this.rendererInstance.depthTexture.gpuTextureView) throw new Error(errorMessages.missingDepthTexture);

    const outputName = passContext.route.output;
    if (!outputName) throw new Error('RenderPass route.output is not defined.');

    const msaaEnabled = this.rendererInstance.multiSampling > 1;

    const outputTarget = passContext.validateRenderTarget(
      outputName,
      passContext.width,
      passContext.height,
      constants.INTERNAL_COLOR_FORMAT,
    );

    const colorView = msaaEnabled ? this.rendererInstance.surfaceManager.multiSampleTextureView : outputTarget.view;

    const resolveTarget = msaaEnabled ? outputTarget.view : undefined;

    return {
      label: this.name,
      colorAttachments: [
        {
          view: colorView,
          resolveTarget,
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: scene.clearColor,
        },
      ],
      depthStencilAttachment: {
        view: this.rendererInstance.depthTexture.gpuTextureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
  }

  override runPass(
    commandEncoder: GPUCommandEncoder,
    scene: Scene,
    camera: PerspectiveCamera,
    passContext: PassContext,
  ) {
    const renderPassDescriptor = this.buildRenderPassDescriptor(scene, passContext);

    const pass = commandEncoder.beginRenderPass(renderPassDescriptor);

    pass.setBindGroup(constants.bindGroupIndices.CAMERA, camera.cameraUniformsBindGroup);
    pass.setBindGroup(constants.bindGroupIndices.SCENE, scene.sceneUniformsBindGroup);

    const opaqueEntities = scene.renderList.filter(
      (entity) => entity instanceof Mesh && !entity.material.usesAlphaPipeline,
    );

    const alphaEntities = scene.renderList.filter(
      (entity) => entity instanceof Mesh && entity.material.usesAlphaPipeline,
    );

    opaqueEntities.forEach((entity) => {
      if (entity instanceof Mesh) {
        entity.draw(pass, this.rendererInstance);
      }
    });

    alphaEntities.forEach((entity) => {
      if (entity instanceof Mesh) {
        entity.draw(pass, this.rendererInstance);
      }
    });

    pass.end();
  }
}

export { RenderPass };
