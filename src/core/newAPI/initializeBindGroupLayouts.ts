import { cameraBindGroupLayoutDescriptor } from '../renderer/bindGroupLayouts/camera';
import { entityBindGroupLayoutDescriptor } from '../renderer/bindGroupLayouts/entity';
import { materialBindGroupLayoutDescriptors } from '../renderer/bindGroupLayouts/materials';
import { sceneBindGroupLayoutDescriptor } from '../renderer/bindGroupLayouts/scene';
import { MaterialType } from '../types';

function initializeBindGroupLayouts(device: GPUDevice) {
  const cameraBindGroupLayout = device.createBindGroupLayout(cameraBindGroupLayoutDescriptor);
  const sceneBindGroupLayout = device.createBindGroupLayout(sceneBindGroupLayoutDescriptor);
  const entityBindGroupLayout = device.createBindGroupLayout(entityBindGroupLayoutDescriptor);
  const materialBindGroupLayouts = new Map<MaterialType, GPUBindGroupLayout>();

  for (const [materialType, layoutDescriptor] of materialBindGroupLayoutDescriptors.entries()) {
    const layout = device.createBindGroupLayout(layoutDescriptor);
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
