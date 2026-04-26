import { PerspectiveCamera } from '../PerspectiveCamera';
import { Scene } from '../Scene';
import { errorMessages } from '../constants/errorMessages';
import { Pass, PassOptions } from './passes/Pass';
import { Renderer } from './Renderer';

type PassConstructor = new (options: PassOptions) => Pass;

class PassManager {
  rendererInstance: Renderer;
  scene: Scene | null;
  camera: PerspectiveCamera | null;
  passes: Map<string, Pass>;

  constructor(renderer: Renderer) {
    this.rendererInstance = renderer;
    this.scene = null;
    this.camera = null;
    this.passes = new Map();
  }

  registerPass(name: string, passType: PassConstructor) {
    const passInstance = new passType({
      name,
      rendererInstance: this.rendererInstance,
    });

    this.passes.set(name, passInstance);
  }

  runPass(name: string, commandEncoder: GPUCommandEncoder) {
    const pass = this.passes.get(name);

    if (!pass) throw new Error(`${errorMessages.missingPass} Pass name: "${name}".`);
    if (!this.scene) throw new Error(errorMessages.missingPassScene);
    if (!this.camera) throw new Error(errorMessages.missingPassCamera);

    pass.runPass(commandEncoder, this.scene, this.camera);
  }
}

export { PassManager };
