import { errorMessages } from '../constants/errorMessages';
import { createDepthTexture, createMultiSampleTexture } from './internalTextures';
import type { RendererOptions } from './TonyGL';

export type TextureAndView = {
  texture: GPUTexture;
  view: GPUTextureView;
};

export type Renderer = {
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
  adapter: GPUAdapter;
  presentationFormat: GPUTextureFormat;
  canvasTexture: GPUTexture;
  multiSampleTexture: TextureAndView;
  depthTexture: TextureAndView;
  msaa: number;
  alpha: boolean;
  dpr: number;
};

async function configureRenderer(options: RendererOptions): Promise<Renderer> {
  const containerElement = options.containerElement ?? document.body;
  const dpr = options.dpr ?? window.devicePixelRatio;
  const alpha = options.alpha ?? false;
  const msaa = options.multiSampling ?? 4;

  const canvasElement = document.createElement('canvas');
  containerElement.appendChild(canvasElement);

  const context = canvasElement.getContext('webgpu');
  if (!context) throw new Error(errorMessages.contextRequest);

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error(errorMessages.adapterRequest);

  const device = await adapter.requestDevice({
    requiredFeatures: options.requiredFeatures,
    requiredLimits: options.requiredLimits,
  });
  if (!device) throw new Error(errorMessages.deviceRequest);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  if (!presentationFormat) throw new Error(errorMessages.presentationFormatRequest);

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: alpha ? 'premultiplied' : 'opaque',
  });

  const canvasTexture = context.getCurrentTexture();
  const multiSampleTexture = createMultiSampleTexture(device, canvasTexture, msaa);
  const depthTexture = createDepthTexture(device, canvasTexture, msaa);

  return {
    containerElement,
    canvasElement,
    context,
    device,
    adapter,
    presentationFormat,
    canvasTexture,
    multiSampleTexture,
    depthTexture,
    msaa,
    alpha,
    dpr,
  };
}

export { configureRenderer };
