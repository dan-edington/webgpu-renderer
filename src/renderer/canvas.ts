interface CanvasOptions {
  className?: string;
  dpr?: number;
}

type Canvas = {
  device: GPUDevice;
  presentationFormat: GPUTextureFormat;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
};

async function initCanvas(options: CanvasOptions = {}): Promise<Canvas | null> {
  const { className = "", dpr = 2 } = options;

  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  const presentationFormat = navigator.gpu?.getPreferredCanvasFormat();

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
      const w = width * dpr;
      const h = height * dpr;
      canvasElement.width = Math.max(1, Math.min(w, device.limits.maxTextureDimension2D));
      canvasElement.height = Math.max(1, Math.min(h, device.limits.maxTextureDimension2D));
    }
  });

  observer.observe(canvasElement);

  return { device, presentationFormat, canvasElement, context };
}

export { initCanvas };
export type { CanvasOptions, Canvas };
