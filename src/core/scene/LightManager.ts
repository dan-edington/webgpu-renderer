import { constants } from '../constants/constants';
import { Entity } from './Entity';
import { Light, LightFlag } from '../lights/Light';
import { Renderer } from '../renderer/Renderer';
import { UniformBuffer } from '../renderer/UniformBuffer';
import { colorToLinear, srgbToLinear } from '../utilities/colorUtilities';

type DirectionalLightLike = Light & {
  direction: ArrayLike<number>;
};

function isDirectionalLight(light: Light): light is DirectionalLightLike {
  return (light.flags & LightFlag.DirectionalLight) !== 0 && light.type === 'DirectionalLight';
}

interface ILightManager {
  rendererInstance: Renderer | null;
  lightUniformsBuffer: UniformBuffer | null;
  ambientLight: {
    color: Float32Array;
    intensity: number;
  };
  lights: Light[];
  lightsNeedUpdate: boolean;
  sceneUniformsBindGroup: GPUBindGroup | null;
  init(rendererInstance: Renderer): void;
  setAmbientLightColor(color: Float32Array | [number, number, number, number]): void;
  setAmbientLightIntensity(intensity: number): void;
  setAmbientLight(ambientLight: { color: Float32Array | [number, number, number, number]; intensity: number }): void;
  updateLights(rootEntity: Entity): void;
  createSceneUniformsBindGroup(rendererInstance: Renderer): void;
  destroy(): void;
}

class LightManager implements ILightManager {
  rendererInstance: Renderer | null = null;
  lightUniformsBuffer: UniformBuffer | null = null;
  ambientLight: {
    color: Float32Array;
    intensity: number;
  };
  lights: Light[] = [];
  lightsNeedUpdate: boolean = false;
  sceneUniformsBindGroup: GPUBindGroup | null = null;

  constructor() {
    this.ambientLight = {
      color: new Float32Array([1, 1, 1, 1]),
      intensity: 0.0,
    };
    this.createLightUniforms();
  }

  init(rendererInstance: Renderer) {
    this.rendererInstance = rendererInstance;
    if (this.lightUniformsBuffer) {
      this.lightUniformsBuffer.init(rendererInstance);
    }
  }

  private gatherLightingData() {
    const maxLights = constants.MAX_LIGHTS;
    const positions = new Float32Array(maxLights * 4);
    const colors = new Float32Array(maxLights * 4);
    const params = new Float32Array(maxLights * 4);
    const directions = new Float32Array(maxLights * 4);
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

      if (isDirectionalLight(light)) {
        directions[base + 0] = light.direction[0] ?? 0;
        directions[base + 1] = light.direction[1] ?? 0;
        directions[base + 2] = light.direction[2] ?? 0;
      }

      flags[index] = (light.visible ? LightFlag.Visible : LightFlag.None) | light.flags;
    });

    return { count: activeLights.length, maxLights, positions, colors, params, directions, flags };
  }

  private createLightUniforms() {
    const { count, maxLights, positions, colors, params, directions, flags } = this.gatherLightingData();

    this.lightUniformsBuffer = new UniformBuffer(
      {
        count: { type: 'u32', value: count },
        positions: { type: `array<vec4<f32>, ${maxLights}>`, value: positions },
        colors: { type: `array<vec4<f32>, ${maxLights}>`, value: colors },
        directions: { type: `array<vec4<f32>, ${maxLights}>`, value: directions },
        params: { type: `array<vec4<f32>, ${maxLights}>`, value: params },
        flags: { type: `array<u32, ${maxLights}>`, value: flags },
        ambientLightColor: { type: 'vec4<f32>', value: colorToLinear(this.ambientLight.color) },
        ambientLightIntensity: { type: 'f32', value: this.ambientLight.intensity },
      },
      { addressSpace: 'storage' },
    );
  }

  private updateLightUniforms() {
    if (!this.lightUniformsBuffer) return;

    const { count, positions, colors, params, directions, flags } = this.gatherLightingData();

    this.lightUniformsBuffer.updateUniform({
      count,
      positions,
      colors,
      params,
      directions,
      flags,
    });
  }

  setAmbientLightColor(color: Float32Array | [number, number, number, number]) {
    this.ambientLight.color = new Float32Array([color[0], color[1], color[2], color[3]]);

    this.lightUniformsBuffer?.updateUniform({
      ambientLightColor: colorToLinear(this.ambientLight.color),
    });
  }

  setAmbientLightIntensity(intensity: number) {
    this.ambientLight.intensity = intensity;

    this.lightUniformsBuffer?.updateUniform({
      ambientLightIntensity: this.ambientLight.intensity,
    });
  }

  setAmbientLight(ambientLight: { color: Float32Array | [number, number, number, number]; intensity: number }) {
    this.setAmbientLightColor(ambientLight.color);
    this.setAmbientLightIntensity(ambientLight.intensity);
  }

  private rebuildLightsArray(rootEntity: Entity) {
    this.lights = [];

    const traverse = (entity: Entity) => {
      if (entity.isLight) {
        this.lights.push(entity as Light);
      }

      entity.children.forEach((child) => {
        traverse(child);
      });
    };

    rootEntity.children.forEach((child) => {
      traverse(child);
    });
  }

  updateLights(rootEntity: Entity) {
    if (this.lightsNeedUpdate) {
      this.rebuildLightsArray(rootEntity);
      this.updateLightUniforms();
    }

    this.lightsNeedUpdate = false;
  }

  createSceneUniformsBindGroup(rendererInstance: Renderer) {
    if (!rendererInstance.sceneBindGroupLayout) return;
    if (!this.lightUniformsBuffer?.buffer) return;

    this.sceneUniformsBindGroup = rendererInstance.device.createBindGroup({
      layout: rendererInstance.sceneBindGroupLayout,
      entries: [
        {
          binding: 1,
          resource: { buffer: this.lightUniformsBuffer.buffer },
        },
      ],
    });
  }

  destroy() {
    this.lightUniformsBuffer?.destroy();
    this.lightUniformsBuffer = null;
    this.sceneUniformsBindGroup = null;
  }
}

export { LightManager };
export type { ILightManager };
