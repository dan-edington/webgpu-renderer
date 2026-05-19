import { errorMessages } from '../constants/errorMessages';
import { srgbToLinear } from '../utilities/colorUtilities';
import { Renderer } from './configureRenderer';
import { createEntity, Entity, EntityOptions } from './entity';
import { createLightManager, LightManager } from './lightManager';
import { _createUniformBuffer, UniformBuffer } from './uniformBuffer';

export type SceneOptions = Omit<EntityOptions, 'type'> & {};

export type Scene = Entity & {
  isScene: boolean;
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null;
  sceneUniformsBindGroup: GPUBindGroup | null;
  clearColor: GPUColor;
  clearColorSRGB: GPUColor;
  lightManager: LightManager;
  setClearColor(color: ArrayLike<number>): void;
  setAmbientLightColor(color: ArrayLike<number>): void;
  setAmbientLightIntensity(intensity: number): void;
  updateRenderList(): void;
  updateLights(): void;
  destroy(): void;
};

function _createScene(renderer: Renderer) {
  return function createScene(options?: SceneOptions): Scene {
    const createUniformBuffer = _createUniformBuffer(renderer);
    const entity = createEntity({
      ...options,
      type: 'Scene',
    });

    const isScene = true;
    let renderList: Entity[] = [];
    let renderListNeedsUpdate = true;
    let sceneUniformsBuffer: UniformBuffer | null = null;
    let sceneUniformsBindGroup: GPUBindGroup | null = null;
    let clearColorSRGB = { r: 0, g: 0, b: 0, a: 1 };
    let clearColor = { r: 0, g: 0, b: 0, a: 1 };
    const lightManager = createLightManager(renderer);

    sceneUniformsBuffer = createUniformBuffer({
      _padding: { type: 'u32', value: 0 },
    });

    if (!sceneUniformsBuffer?.buffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    if (!lightManager.lightUniformsBuffer?.buffer) throw new Error(errorMessages.missingLightUniformsBuffer);

    sceneUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.sceneBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: sceneUniformsBuffer.buffer },
        },
        {
          binding: 1,
          resource: { buffer: lightManager.lightUniformsBuffer.buffer },
        },
      ],
    });

    function setClearColor(color: ArrayLike<number>) {
      clearColorSRGB = { r: color[0], g: color[1], b: color[2], a: color[3] };
      clearColor = {
        r: srgbToLinear(clearColorSRGB.r as number),
        g: srgbToLinear(clearColorSRGB.g as number),
        b: srgbToLinear(clearColorSRGB.b as number),
        a: clearColorSRGB.a,
      };
    }

    function setAmbientLightColor(color: ArrayLike<number>) {
      lightManager.setAmbientLightColor(color);
    }

    function setAmbientLightIntensity(intensity: number) {
      lightManager.setAmbientLightIntensity(intensity);
    }

    function updateRenderList() {
      if (renderListNeedsUpdate) {
        renderList = [];

        const traverse = (entity: Entity, parentVisible: boolean) => {
          const isVisible = parentVisible && entity.visible;

          if (!isVisible) {
            return;
          }

          renderList.push(entity);

          entity.children.forEach((child) => {
            traverse(child, isVisible);
          });
        };

        entity.children.forEach((child) => {
          traverse(child, entity.visible);
        });

        renderListNeedsUpdate = false;
      }
    }

    function updateLights() {
      lightManager.updateLights(scene);
    }

    function destroy() {
      lightManager.destroy();
      sceneUniformsBuffer?.destroy();
    }

    const sceneProperties = {
      isScene,
      renderList,
      renderListNeedsUpdate,
      sceneUniformsBindGroup,
      sceneUniformsBuffer,
      clearColor,
      clearColorSRGB,
      lightManager,
      setClearColor,
      setAmbientLightColor,
      setAmbientLightIntensity,
      updateRenderList,
      updateLights,
      destroy,
    };

    const scene: Scene = Object.assign(entity, sceneProperties);

    return scene;
  };
}

export { _createScene };
