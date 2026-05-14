import { Entity, IEntity } from './Entity';
import { Renderer } from '../renderer/Renderer';
import { errorMessages } from '../constants/errorMessages';
import { UniformBuffer } from '../renderer/UniformBuffer';
import { LightManager } from './LightManager';
import { srgbToLinear } from '../utilities/colorUtilities';

interface IScene extends IEntity {
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null;
  sceneUniformsBindGroup: GPUBindGroup | null;
  isInitialized: boolean;
  clearColor: GPUColor;
  lightManager: LightManager;
  isScene: boolean;
  init(rendererInstance: Renderer): void;
  setClearColor(color: GPUColor | [number, number, number, number] | Float32Array): void;
  setAmbientLightColor(color: Float32Array | [number, number, number, number]): void;
  setAmbientLightIntensity(intensity: number): void;
  updateRenderList(): void;
  updateLights(): void;
  destroy(): void;
}

class Scene extends Entity implements IScene {
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null = null;
  sceneUniformsBindGroup: GPUBindGroup | null = null;
  isInitialized: boolean;
  clearColor: GPUColor;
  clearColorSRGB: GPUColor;
  lightManager: LightManager;
  isScene: boolean = true;

  constructor() {
    super('Scene');
    this.renderList = [];
    this.renderListNeedsUpdate = false;
    this.isInitialized = false;
    this.clearColorSRGB = { r: 0, g: 0, b: 0, a: 1 };
    this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
    this.lightManager = new LightManager();

    this.createSceneUniformsBuffer();
  }

  init(rendererInstance: Renderer) {
    if (!this.sceneUniformsBuffer) throw new Error(errorMessages.missingSceneUniformsBuffer);

    this.sceneUniformsBuffer.init(rendererInstance);
    this.lightManager.init(rendererInstance);
    this.createSceneUniformsBindGroup(rendererInstance);
    this.isInitialized = true;
  }

  createSceneUniformsBuffer() {
    this.sceneUniformsBuffer = new UniformBuffer({
      _padding: { type: 'u32', value: 0 },
    });
  }

  private createSceneUniformsBindGroup(rendererInstance: Renderer) {
    if (!rendererInstance.sceneBindGroupLayout) throw new Error(errorMessages.missingSceneBindGroupLayout);
    if (!this.sceneUniformsBuffer?.buffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    if (!this.lightManager.lightUniformsBuffer?.buffer) throw new Error('Missing light uniforms buffer');

    this.sceneUniformsBindGroup = rendererInstance.device.createBindGroup({
      layout: rendererInstance.sceneBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.sceneUniformsBuffer.buffer },
        },
        {
          binding: 1,
          resource: { buffer: this.lightManager.lightUniformsBuffer.buffer },
        },
      ],
    });
  }

  setClearColor(color: GPUColor | [number, number, number, number] | Float32Array) {
    if (Array.isArray(color) || color instanceof Float32Array) {
      this.clearColorSRGB = { r: color[0], g: color[1], b: color[2], a: color[3] };
    } else if ('r' in color) {
      // Object with r, g, b, a properties
      this.clearColorSRGB = color as { r: number; g: number; b: number; a: number };
    } else {
      // Iterable form (less common)
      const arr = Array.from(color as any) as number[];
      this.clearColorSRGB = { r: arr[0], g: arr[1], b: arr[2], a: arr[3] };
    }
    this.clearColor = {
      r: srgbToLinear(this.clearColorSRGB.r as number),
      g: srgbToLinear(this.clearColorSRGB.g as number),
      b: srgbToLinear(this.clearColorSRGB.b as number),
      a: this.clearColorSRGB.a,
    };
  }

  setAmbientLightColor(color: Float32Array | [number, number, number, number]) {
    this.lightManager.setAmbientLightColor(color);
  }

  setAmbientLightIntensity(intensity: number) {
    this.lightManager.setAmbientLightIntensity(intensity);
  }

  updateRenderList() {
    if (this.renderListNeedsUpdate) {
      this.renderList = [];

      const traverse = (entity: Entity, parentVisible: boolean) => {
        const isVisible = parentVisible && entity.visible;

        if (!isVisible) {
          return;
        }

        this.renderList.push(entity);

        entity.children.forEach((child) => {
          traverse(child, isVisible);
        });
      };

      this.children.forEach((child) => {
        traverse(child, this.visible);
      });

      this.renderListNeedsUpdate = false;
    }
  }

  updateLights() {
    this.lightManager.updateLights(this);
  }

  destroy() {
    this.lightManager.destroy();
    this.sceneUniformsBuffer?.destroy();
  }
}

export { Scene };
