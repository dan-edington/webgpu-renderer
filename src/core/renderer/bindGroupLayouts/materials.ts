import { LambertMaterial } from '../../materials/LambertMaterial';
import { UnlitMaterial } from '../../materials/UnlitMaterial';
import { NormalMaterial } from '../../materials/NormalMaterial';
import type { MaterialType } from '../../types';

type MaterialBindGroupLayoutDescriptorList = Map<MaterialType, GPUBindGroupLayoutDescriptor>;

const materialBindGroupLayoutDescriptors: MaterialBindGroupLayoutDescriptorList = new Map([
  ['unlit', UnlitMaterial.getMaterialLayoutDescriptor()],
  ['lambert', LambertMaterial.getMaterialLayoutDescriptor()],
  ['normal', NormalMaterial.getMaterialLayoutDescriptor()],
]);

export { materialBindGroupLayoutDescriptors };
