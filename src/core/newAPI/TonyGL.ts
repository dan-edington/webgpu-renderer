import { getAdapterInfo } from './getAdapterInfo';
import { configureRenderer, Renderer } from './configureRenderer';
import { setupRendererEventListeners } from './setupRendererEventListeners';
import { pipelineManager } from './pipelineManager';
import { initializeBindGroupLayouts } from './initializeBindGroupLayouts';
import { _createGeometry, Geometry, GeometryOptions } from './geometry';
import { _createUniformBuffer, UniformBufferOptions, UniformObject, UniformBuffer } from './uniformBuffer';

export type RendererOptions = {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
  multiSampling?: number;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
};

export type Tony = {
  renderer: Renderer;
  createGeometry: (options: GeometryOptions) => Geometry;
  createUniformBuffer: (uniformObject: UniformObject, options?: UniformBufferOptions) => UniformBuffer;
  destroy: () => void;
};

async function TonyGL(options: RendererOptions): Promise<Tony> {
  const renderer = await configureRenderer(options);
  const createGeometry = _createGeometry(renderer);
  const createUniformBuffer = _createUniformBuffer(renderer);

  const { rendererEventsAbortController } = setupRendererEventListeners(renderer);
  const { getOrCreateRenderPipeline, clearPipelineCache } = pipelineManager(renderer);

  //@ts-ignore
  const { cameraBindGroupLayout, sceneBindGroupLayout, entityBindGroupLayout, materialBindGroupLayouts } =
    initializeBindGroupLayouts(renderer);

  function destroy() {
    rendererEventsAbortController.abort();
    renderer.depthTexture.texture.destroy();
    renderer.multiSampleTexture.texture.destroy();
    clearPipelineCache();
  }

  return {
    renderer,
    createGeometry,
    createUniformBuffer,
    destroy,
  };
}

export { TonyGL, getAdapterInfo };
