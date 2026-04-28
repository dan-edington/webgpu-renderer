import { constants } from '../../constants/constants';
import { errorMessages } from '../../constants/errorMessages';
import { Mesh } from '../../Mesh';
import { PerspectiveCamera } from '../../PerspectiveCamera';
import { Scene } from '../../Scene';
import { Pass, PassOptions } from './Pass';

class RenderPass extends Pass {
  constructor(options: PassOptions) {
    super(options);
  }

  private buildRenderPassDescriptor(scene: Scene): GPURenderPassDescriptor {
    if (!this.rendererInstance.context) throw new Error(errorMessages.missingContext);
    if (!this.rendererInstance.depthTexture?.depthTexture) throw new Error(errorMessages.missingDepthTexture);

    const msaaCount = this.rendererInstance.multiSampling;
    const swapchainView = this.rendererInstance.context.getCurrentTexture().createView();
    const colorView =
      msaaCount > 1 ? this.rendererInstance.contextManager.multiSampleTexture.createView() : swapchainView;
    const resolveTarget = msaaCount > 1 ? swapchainView : undefined;

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
        view: this.rendererInstance.depthTexture.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
  }

  override runPass(commandEncoder: GPUCommandEncoder, scene: Scene, camera: PerspectiveCamera) {
    const renderPassDescriptor = this.buildRenderPassDescriptor(scene);

    const pass = commandEncoder.beginRenderPass(renderPassDescriptor);

    pass.setBindGroup(constants.bindGroupIndices.CAMERA, camera.cameraBindGroup);
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
