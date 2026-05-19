import { cameraBindGroupLayoutDescriptor } from '../renderer/bindGroupLayouts/camera';
import { entityBindGroupLayoutDescriptor } from '../renderer/bindGroupLayouts/entity';
import { materialBindGroupLayoutDescriptors } from '../renderer/bindGroupLayouts/materials';
import { sceneBindGroupLayoutDescriptor } from '../renderer/bindGroupLayouts/scene';
import { MaterialType } from '../types';
import { Renderer } from './configureRenderer';

function initializeBindGroupLayouts(renderer: Renderer) {
  const cameraBindGroupLayout = renderer.device.createBindGroupLayout(cameraBindGroupLayoutDescriptor);
  const sceneBindGroupLayout = renderer.device.createBindGroupLayout(sceneBindGroupLayoutDescriptor);
  const entityBindGroupLayout = renderer.device.createBindGroupLayout(entityBindGroupLayoutDescriptor);
  const materialBindGroupLayouts = new Map<MaterialType, GPUBindGroupLayout>();

  for (const [materialType, layoutDescriptor] of materialBindGroupLayoutDescriptors.entries()) {
    const layout = renderer.device.createBindGroupLayout(layoutDescriptor);
    materialBindGroupLayouts.set(materialType, layout);
  }

  return {
    cameraBindGroupLayout,
    sceneBindGroupLayout,
    entityBindGroupLayout,
    materialBindGroupLayouts,
  };
}

export { initializeBindGroupLayouts };
