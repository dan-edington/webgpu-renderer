import { Entity, IEntity } from './Entity';
import { Renderer } from './renderer/Renderer';
import { errorMessages } from './constants/errorMessages';
import { constants } from './constants/constants';
import { UniformBuffer } from './UniformBuffer';
import { Light } from './lights/Light';
import { colorToLinear, srgbToLinear } from './utilities/colorUtilities';

interface IScene extends IEntity {
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null;
  lightUniformsBuffer: UniformBuffer | null;
  sceneUniformsBindGroup: GPUBindGroup | null;
  isInitialized: boolean;
  clearColor: GPUColor;
  ambientLight: {
    color: Float32Array;
    intensity: number;
  };
  lights: Light[];
  lightsNeedUpdate: boolean;
  init(renderer: Renderer): void;
  createSceneUniformsBuffer(): void;
  createSceneUniformsBindGroup(renderer: Renderer): void;
  setClearColor(color: GPUColor | [number, number, number, number] | Float32Array): void;
  setAmbientLight(ambientLight: { color: Float32Array | [number, number, number, number]; intensity: number }): void;
  setAmbientLightColor(color: Float32Array | [number, number, number, number]): void;
  setAmbientLightIntensity(intensity: number): void;
  updateRenderList(): void;
}

class Scene extends Entity implements IScene {
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null = null;
  lightUniformsBuffer: UniformBuffer | null = null;
  sceneUniformsBindGroup: GPUBindGroup | null = null;
  isInitialized: boolean;
  clearColor: GPUColor;
  clearColorSRGB: GPUColor;
  ambientLight: { color: Float32Array; intensity: number };
  lights: Light[];
  lightsNeedUpdate: boolean;
  private rendererInstance: Renderer | null = null;

  constructor() {
    super('Scene');
    this.renderList = [];
    this.renderListNeedsUpdate = false;
    this.isInitialized = false;
    this.clearColorSRGB = { r: 0, g: 0, b: 0, a: 1 };
    this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
    this.ambientLight = {
      color: new Float32Array([1, 1, 1, 1]),
      intensity: 0.0,
    };
    this.lights = [];
    this.lightsNeedUpdate = false;

    this.createLightUniformsBuffer();
    this.createSceneUniformsBuffer();
  }

  init(renderer: Renderer) {
    if (!this.sceneUniformsBuffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    if (!this.lightUniformsBuffer) throw new Error(errorMessages.missingLightUniformsBuffer);

    this.rendererInstance = renderer;
    this.sceneUniformsBuffer.init(renderer);
    this.lightUniformsBuffer.init(renderer);
    this.createSceneUniformsBindGroup(renderer);
    this.isInitialized = true;
  }

  createSceneUniformsBuffer() {
    this.sceneUniformsBuffer = new UniformBuffer({
      ambientLightColor: { type: 'vec4<f32>', value: colorToLinear(this.ambientLight.color) },
      ambientLightIntensity: { type: 'f32', value: this.ambientLight.intensity },
    });
  }

  createLightUniformsBuffer() {
    const maxLights = constants.MAX_LIGHTS;
    const positions = new Float32Array(maxLights * 4);
    const colors = new Float32Array(maxLights * 4);
    const params = new Float32Array(maxLights * 4);
    const flags = new Uint32Array(maxLights);

    const activeLights = this.lights.slice(0, maxLights);

    activeLights.forEach((light, index) => {
      const base = index * 4;

      positions[base + 0] = light.position[0];
      positions[base + 1] = light.position[1];
      positions[base + 2] = light.position[2];
      positions[base + 3] = 1;

      colors[base + 0] = srgbToLinear(light.color[0]);
      colors[base + 1] = srgbToLinear(light.color[1]);
      colors[base + 2] = srgbToLinear(light.color[2]);
      colors[base + 3] = light.color[3];

      params[base + 0] = light.intensity;
      params[base + 1] = light.range;
      params[base + 2] = 0;
      params[base + 3] = 0;

      flags[index] = light.flags;
    });

    this.lightUniformsBuffer = new UniformBuffer(
      {
        count: { type: 'u32', value: activeLights.length },
        positions: { type: `array<vec4<f32>, ${maxLights}>`, value: positions },
        colors: { type: `array<vec4<f32>, ${maxLights}>`, value: colors },
        params: { type: `array<vec4<f32>, ${maxLights}>`, value: params },
        flags: { type: `array<u32, ${maxLights}>`, value: flags },
      },
      { addressSpace: 'storage' },
    );
  }

  createSceneUniformsBindGroup(renderer: Renderer) {
    if (!renderer.sceneBindGroupLayout) throw new Error(errorMessages.missingSceneBindGroupLayout);

    if (this.sceneUniformsBuffer?.buffer && this.lightUniformsBuffer?.buffer) {
      this.sceneUniformsBindGroup = renderer.device.createBindGroup({
        layout: renderer.sceneBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: this.sceneUniformsBuffer.buffer },
          },
          {
            binding: 1,
            resource: { buffer: this.lightUniformsBuffer.buffer },
          },
        ],
      });
    }
  }

  setClearColor(color: GPUColor | [number, number, number, number] | Float32Array) {
    if (Array.isArray(color) || color instanceof Float32Array) {
      this.clearColorSRGB = { r: color[0], g: color[1], b: color[2], a: color[3] };
    } else {
      this.clearColorSRGB = color;
    }
    this.clearColor = {
      r: srgbToLinear(this.clearColorSRGB.r as number),
      g: srgbToLinear(this.clearColorSRGB.g as number),
      b: srgbToLinear(this.clearColorSRGB.b as number),
      a: this.clearColorSRGB.a,
    };
  }

  setAmbientLight(ambientLight: { color: Float32Array | [number, number, number, number]; intensity: number }) {
    this.setAmbientLightColor(ambientLight.color);
    this.setAmbientLightIntensity(ambientLight.intensity);
  }

  setAmbientLightColor(color: Float32Array | [number, number, number, number]) {
    this.ambientLight.color = new Float32Array([color[0], color[1], color[2], color[3]]);

    this.sceneUniformsBuffer?.updateUniform({
      ambientLightColor: colorToLinear(this.ambientLight.color),
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

  rebuildLightsArray() {
    this.lights = [];

    const traverse = (entity: Entity) => {
      if (entity.isLight) {
        this.lights.push(entity as Light);
      }

      entity.children.forEach((child) => {
        traverse(child);
      });
    };

    this.children.forEach((child) => {
      traverse(child);
    });
  }

  updateLights() {
    if (this.lightsNeedUpdate) {
      if (!this.rendererInstance) {
        this.lightsNeedUpdate = false;
        return;
      }

      this.rebuildLightsArray();
      this.createLightUniformsBuffer();
      this.lightUniformsBuffer?.init(this.rendererInstance);
      this.createSceneUniformsBindGroup(this.rendererInstance);
    }

    this.lightsNeedUpdate = false;
  }
}

export { Scene };
