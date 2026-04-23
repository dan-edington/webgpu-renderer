import { vec4, Vec4 } from 'wgpu-matrix';
import { Entity, IEntity } from './Entity';
import { Renderer } from './Renderer';
import { errorMessages } from './constants/errorMessages';
import { UniformBuffer } from './UniformBuffer';

interface IScene extends IEntity {
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null;
  sceneUniformsBindGroup: GPUBindGroup | null;
  isInitialized: boolean;
  clearColor: GPUColor;
  ambientLight: {
    color: Vec4;
    intensity: number;
  };
  init(renderer: Renderer): void;
  createSceneUniformsBuffer(): void;
  createSceneUniformsBindGroup(renderer: Renderer): void;
  setClearColor(color: GPUColor | [number, number, number, number] | Vec4): void;
  setAmbientLightColor(color: Vec4 | [number, number, number, number]): void;
  setAmbientLightIntensity(intensity: number): void;
  updateRenderList(): void;
}

class Scene extends Entity implements IScene {
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null = null;
  sceneUniformsBindGroup: GPUBindGroup | null = null;
  isInitialized: boolean;
  clearColor: GPUColor;
  ambientLight: { color: Vec4; intensity: number };

  constructor() {
    super('Scene');
    this.renderList = [];
    this.renderListNeedsUpdate = false;
    this.isInitialized = false;
    this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
    this.ambientLight = {
      color: vec4.create(1, 1, 1, 1),
      intensity: 0.5,
    };
    this.createSceneUniformsBuffer();
  }

  init(renderer: Renderer) {
    if (!this.sceneUniformsBuffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    this.sceneUniformsBuffer.init(renderer);
    this.createSceneUniformsBindGroup(renderer);
    this.isInitialized = true;
  }

  createSceneUniformsBuffer() {
    this.sceneUniformsBuffer = new UniformBuffer({
      ambientLightColor: { type: 'vec4<f32>', value: this.ambientLight.color },
      ambientLightIntensity: { type: 'f32', value: this.ambientLight.intensity },
    });
  }

  createSceneUniformsBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);
    if (!renderer.sceneBindGroupLayout) throw new Error(errorMessages.missingSceneBindGroupLayout);

    if (this.sceneUniformsBuffer?.buffer) {
      this.sceneUniformsBindGroup = renderer.device.createBindGroup({
        layout: renderer.sceneBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.sceneUniformsBuffer.buffer } }],
      });
    }
  }

  setClearColor(color: GPUColor | [number, number, number, number] | Vec4) {
    if (Array.isArray(color) || color instanceof Float32Array) {
      this.clearColor = { r: color[0], g: color[1], b: color[2], a: color[3] };
    } else {
      this.clearColor = color;
    }
  }

  setAmbientLightColor(color: Vec4 | [number, number, number, number]) {
    if (Array.isArray(color) || color instanceof Float32Array) {
      this.ambientLight.color = vec4.fromValues(color[0], color[1], color[2], color[3]);
    } else {
      this.ambientLight.color = color;
    }

    this.sceneUniformsBuffer?.updateUniform({
      ambientLightColor: this.ambientLight.color,
    });
  }

  setAmbientLightIntensity(intensity: number) {
    this.ambientLight.intensity = intensity;

    this.sceneUniformsBuffer?.updateUniform({
      ambientLightIntensity: this.ambientLight.intensity,
    });
  }

  updateRenderList() {
    if (this.renderListNeedsUpdate) {
      this.renderList = [];

      const traverse = (entity: Entity, parentVisible: boolean) => {
        const isVisible = parentVisible && entity.visible;

        if (!isVisible) {
          return;
        }

        if (entity.isRenderable) {
          this.renderList.push(entity);
        }

        entity.children.forEach((child) => {
          traverse(child, isVisible);
        });
      };

      this.children.forEach((child) => {
        traverse(child, true);
      });

      this.renderListNeedsUpdate = false;
    }
  }
}

export { Scene };
