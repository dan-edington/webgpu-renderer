import { errorMessages } from '../constants/errorMessages';
import { Renderer } from './Renderer';

type CanvasManagerOptions = {
  renderer: Renderer;
  containerElement?: HTMLElement;
};

class CanvasManager {
  rendererInstance: Renderer;
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement;

  constructor(options: CanvasManagerOptions) {
    this.rendererInstance = options.renderer;
    this.containerElement = options.containerElement ?? document.body;

    if (this.containerElement instanceof HTMLElement) {
      this.canvasElement = document.createElement('canvas');
      this.containerElement.appendChild(this.canvasElement);
    } else {
      throw new Error('Invalid container element');
    }

    window.addEventListener('resize', this.updateCanvasSize);
  }

  updateCanvasSize() {
    if (!this.canvasElement) throw new Error(errorMessages.missingCanvasElement);

    this.canvasElement.width = Math.floor(this.containerElement.clientWidth * this.rendererInstance.dpr);
    this.canvasElement.height = Math.floor(this.containerElement.clientHeight * this.rendererInstance.dpr);
    this.rendererInstance.depthTexture?.resize(this.canvasElement.width, this.canvasElement.height);
  }
}

export { CanvasManager };
