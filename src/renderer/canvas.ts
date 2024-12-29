import type { CanvasOptions, ResizeFunction, ICanvas } from "../types";

class Canvas implements ICanvas {
  className: string;
  dpr: number;
  adapter: GPUAdapter | null;
  device: GPUDevice | undefined;
  presentationFormat: GPUTextureFormat | undefined;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext | null;
  onResize: ResizeFunction;

  constructor(options: CanvasOptions) {
    const { className = "", dpr = 2 } = options;
    this.className = className;
    this.dpr = dpr;
    this.adapter = null;
    this.presentationFormat = undefined;
    this.canvasElement = document.createElement("canvas");
    this.context = this.canvasElement.getContext("webgpu");
    this.onResize = (_w, _h) => {};
  }

  async init() {
    this.adapter = await navigator.gpu?.requestAdapter();
    this.device = await this.adapter?.requestDevice();
    this.presentationFormat = navigator.gpu?.getPreferredCanvasFormat();

    if (!this.context || !this.device || !this.presentationFormat) {
      throw new Error("WebGPU not supported or something.");
    }

    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
    });

    const container = document.getElementById("app") || document.body;
    container.appendChild(this.canvasElement);
    this.canvasElement.classList.add(this.className);

    this.#initResizeObserver();
  }

  #initResizeObserver() {
    const observer = new ResizeObserver((entries) => {
      if (this.device) {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const w = Math.max(1, Math.min(width * this.dpr, this.device.limits.maxTextureDimension2D));
          const h = Math.max(1, Math.min(height * this.dpr, this.device.limits.maxTextureDimension2D));
          this.canvasElement.width = w;
          this.canvasElement.height = h;

          if (this.onResize) {
            this.onResize(w, h);
          }
        }
      }
    });

    observer.observe(this.canvasElement);
  }
}

export { Canvas };
