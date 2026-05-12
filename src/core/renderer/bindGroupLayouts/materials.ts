import { LambertMaterial } from '../../materials/LambertMaterial';
import { UnlitMaterial } from '../../materials/UnlitMaterial';
import { NormalMaterial } from '../../materials/NormalMaterial';
import type { MaterialType } from '../../types';
import { BlinnPhongMaterial } from '../../materials/BlinnPhongMaterial';
import { CustomMaterial } from '../../materials/CustomMaterial';

type MaterialBindGroupLayoutDescriptorList = Map<MaterialType, GPUBindGroupLayoutDescriptor>;

const materialBindGroupLayoutDescriptors: MaterialBindGroupLayoutDescriptorList = new Map([
  ['unlit', UnlitMaterial.getMaterialLayoutDescriptor()],
  ['lambert', LambertMaterial.getMaterialLayoutDescriptor()],
  ['normal', NormalMaterial.getMaterialLayoutDescriptor()],
  ['blinnphong', BlinnPhongMaterial.getMaterialLayoutDescriptor()],
  ['custom', CustomMaterial.getMaterialLayoutDescriptor()],
]);

export { materialBindGroupLayoutDescriptors };
