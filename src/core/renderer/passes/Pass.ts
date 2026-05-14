import { PerspectiveCamera } from '../../camera/PerspectiveCamera';
import { Scene } from '../../scene/Scene';
import { PassContext } from '../PassManager';
import { Renderer } from '../Renderer';

export type PassOptions = {
  name: string;
  rendererInstance: Renderer;
  passRoute?: Partial<PassRoute>;
};

export type PassRoute = {
  input: string | null;
  output: string | null;
  renderToSwapchain: boolean;
};

abstract class Pass {
  readonly name: string;
  readonly rendererInstance: Renderer;
  route: PassRoute;

  constructor(options: PassOptions) {
    this.name = options.name;
    this.rendererInstance = options.rendererInstance;
    this.route = {
      input: options.passRoute?.input ?? null,
      output: options.passRoute?.output ?? null,
      renderToSwapchain: options.passRoute?.renderToSwapchain ?? false,
    };
  }

  abstract runPass(
    commandEncoder: GPUCommandEncoder,
    scene: Scene,
    camera: PerspectiveCamera,
    passContext: PassContext,
  ): void;
}

export { Pass };
