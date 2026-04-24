import { PerspectiveCamera } from '../../PerspectiveCamera';
import { Scene } from '../../Scene';
import { Renderer } from '../Renderer';

export type PassOptions = {
  name: string;
  rendererInstance: Renderer;
};

abstract class Pass {
  name: string;
  rendererInstance: Renderer;

  constructor(options: PassOptions) {
    this.name = options.name;
    this.rendererInstance = options.rendererInstance;
  }

  abstract buildRenderPassDescriptor(scene: Scene): GPURenderPassDescriptor;

  abstract runPass(commandEncoder: GPUCommandEncoder, scene: Scene, camera: PerspectiveCamera): void;
}

export { Pass };
