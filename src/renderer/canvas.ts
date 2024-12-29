import type { CanvasOptions, Canvas, ResizeFunction } from "../types";

async function initCanvas(options: CanvasOptions = {}): Promise<Canvas | null> {
  const { className = "", dpr = 2 } = options;
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  const presentationFormat = navigator.gpu?.getPreferredCanvasFormat();
  let onResize: ResizeFunction;

  if (!device || !presentationFormat) {
    return null;
  }

  const canvasElement = document.createElement("canvas");
  const context = canvasElement.getContext("webgpu");

  if (!context) {
    return null;
  }

  context.configure({
    device,
    format: presentationFormat,
  });

  const container = document.getElementById("app") || document.body;
  container.appendChild(canvasElement);
  canvasElement.classList.add(className);

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      const w = Math.max(1, Math.min(width * dpr, device.limits.maxTextureDimension2D));
      const h = Math.max(1, Math.min(height * dpr, device.limits.maxTextureDimension2D));
      canvasElement.width = w;
      canvasElement.height = h;

      if (onResize) {
        onResize(w, h);
      }
    }
  });

  observer.observe(canvasElement);

  function setOnResize(resizeFunction: ResizeFunction) {
    onResize = resizeFunction;
  }

  return { device, presentationFormat, canvasElement, context, setOnResize };
}

export { initCanvas };
export type { CanvasOptions, Canvas };
