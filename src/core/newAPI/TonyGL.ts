import { getAdapterInfo } from './getAdapterInfo';
import { configureRenderer, Renderer } from './configureRenderer';
import { setupRendererEventListeners } from './setupRendererEventListeners';
import { pipelineManager } from './pipelineManager';
import { initializeBindGroupLayouts } from './initializeBindGroupLayouts';
import { createLight, Light, LightOptions } from './light';
import { _createGeometry, Geometry, GeometryOptions } from './geometry';
import { _createUniformBuffer, UniformBufferOptions, UniformObject, UniformBuffer } from './uniformBuffer';
import { _createScene, Scene, SceneOptions } from './scene';

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
  createScene: (options?: SceneOptions) => Scene;
  createLight: (options: LightOptions) => Light;
  createGeometry: (options: GeometryOptions) => Geometry;
  createUniformBuffer: (uniformObject: UniformObject, options?: UniformBufferOptions) => UniformBuffer;
  destroy: () => void;
};

async function TonyGL(options: RendererOptions): Promise<Tony> {
  const renderer = await configureRenderer(options);
  const createScene = _createScene(renderer);
  const createGeometry = _createGeometry(renderer);
  const createUniformBuffer = _createUniformBuffer(renderer);

  const { rendererEventsAbortController } = setupRendererEventListeners(renderer);
  const { getOrCreateRenderPipeline, clearPipelineCache } = pipelineManager(renderer);

  function destroy() {
    rendererEventsAbortController.abort();
    renderer.depthTexture.texture.destroy();
    renderer.multiSampleTexture.texture.destroy();
    clearPipelineCache();
  }

  return {
    renderer,
    createScene,
    createLight,
    createGeometry,
    createUniformBuffer,
    destroy,
  };
}

export { TonyGL, getAdapterInfo };
