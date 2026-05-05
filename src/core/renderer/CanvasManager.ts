import { errorMessages } from '../constants/errorMessages';
import { Renderer } from './Renderer';

interface ICanvasManager {
  rendererInstance: Renderer | null;
  canvasElement: HTMLCanvasElement;
  containerElement: HTMLElement;
  updateCanvasSize(): void;
}

type CanvasManagerOptions = {
  renderer?: Renderer;
  containerElement?: HTMLElement;
};

class CanvasManager implements ICanvasManager {
  rendererInstance: Renderer | null = null;
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement;

  constructor(options: CanvasManagerOptions) {
    this.rendererInstance = options.renderer ?? null;
    this.containerElement = options.containerElement ?? document.body;

    if (this.containerElement instanceof HTMLElement) {
      this.canvasElement = document.createElement('canvas');
      this.containerElement.appendChild(this.canvasElement);
    } else {
      throw new Error('Invalid container element');
    }

    window.addEventListener('resize', () => this.updateCanvasSize.call(this));
  }

  updateCanvasSize() {
    if (!this.canvasElement) throw new Error(errorMessages.missingCanvasElement);
    if (!this.rendererInstance) throw new Error(errorMessages.missingRendererInstance);

    this.canvasElement.width = Math.floor(this.containerElement.clientWidth * this.rendererInstance.dpr);
    this.canvasElement.height = Math.floor(this.containerElement.clientHeight * this.rendererInstance.dpr);

    this.rendererInstance.contextManager.resize(
      this.canvasElement.width,
      this.canvasElement.height,
      this.rendererInstance.multiSampling,
    );

    this.rendererInstance.depthTexture?.resize(this.canvasElement.width, this.canvasElement.height);
    this.rendererInstance.passManager?.resizeRenderTargets(this.canvasElement.width, this.canvasElement.height);
  }
}

export { CanvasManager };
