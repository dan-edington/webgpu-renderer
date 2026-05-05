import { PerspectiveCamera } from '../PerspectiveCamera';
import { Scene } from '../Scene';
import { errorMessages } from '../constants/errorMessages';
import { Pass, PassOptions, PassRoute } from './passes/Pass';
import { Renderer } from './Renderer';

type PassConstructor = new (options: PassOptions) => Pass;

type RenderTarget = {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
};

export type PassContext = {
  route: PassRoute;
  getRenderTarget: (name: string) => RenderTarget | null;
  getSwapChainView: () => GPUTextureView;
  validateRenderTarget: (name: string, width: number, height: number, format: GPUTextureFormat) => RenderTarget;
  width: number;
  height: number;
};

class PassManager {
  rendererInstance: Renderer;
  scene: Scene | null;
  camera: PerspectiveCamera | null;
  passes: Map<string, Pass>;
  renderTargets: Map<string, RenderTarget>;

  constructor(renderer: Renderer) {
    this.rendererInstance = renderer;
    this.scene = null;
    this.camera = null;
    this.passes = new Map();
    this.renderTargets = new Map();
  }

  registerPass(name: string, passType: PassConstructor, passRoute?: Partial<PassRoute>) {
    const passInstance = new passType({
      name,
      rendererInstance: this.rendererInstance,
      passRoute,
    });

    this.passes.set(name, passInstance);
  }

  runPass(name: string, commandEncoder: GPUCommandEncoder) {
    const pass = this.passes.get(name);

    if (!pass) throw new Error(`${errorMessages.missingPass} Pass name: "${name}".`);
    if (!this.scene) throw new Error(errorMessages.missingPassScene);
    if (!this.camera) throw new Error(errorMessages.missingPassCamera);

    const passContext = {
      route: pass.route,
      getRenderTarget: this.getRenderTarget.bind(this),
      getSwapChainView: () => this.rendererInstance.context.getCurrentTexture().createView(),
      validateRenderTarget: this.validateRenderTarget.bind(this),
      width: this.rendererInstance.canvasManager.canvasElement.width,
      height: this.rendererInstance.canvasManager.canvasElement.height,
    };

    pass.runPass(commandEncoder, this.scene, this.camera, passContext);
  }

  createRenderTarget(name: string, width: number, height: number, format: GPUTextureFormat) {
    if (!this.rendererInstance.device) throw new Error(errorMessages.missingDevice);

    this.getRenderTarget(name)?.texture.destroy();

    const texture = this.rendererInstance.device.createTexture({
      size: { width, height },
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    const view = texture.createView();

    this.renderTargets.set(name, { texture, view, width, height, format });
  }

  getRenderTarget(name: string): RenderTarget | null {
    const target = this.renderTargets.get(name) || null;
    return target;
  }

  validateRenderTarget(name: string, width: number, height: number, format: GPUTextureFormat): RenderTarget {
    const renderTarget = this.renderTargets.get(name);
    if (
      renderTarget &&
      renderTarget.width === width &&
      renderTarget.height === height &&
      renderTarget.format === format
    ) {
      return renderTarget;
    } else {
      this.createRenderTarget(name, width, height, format);
      return this.renderTargets.get(name)!;
    }
  }

  resizeRenderTargets(width: number, height: number) {
    for (const [name, target] of this.renderTargets.entries()) {
      this.createRenderTarget(name, width, height, target.format);
    }
  }

  destroyRenderTargets() {
    for (const target of this.renderTargets.values()) {
      target.texture.destroy();
    }

    this.renderTargets.clear();
  }
}

export { PassManager };
