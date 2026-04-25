import { MaterialType } from '../../types';
import { NormalMaterial } from '../NormalMaterial';
import { LambertMaterial } from '../LambertMaterial';
import { UnlitMaterial } from '../UnlitMaterial';

class MaterialLayoutLibrary {
  private materialLayoutLibrary: Map<MaterialType, GPUBindGroupLayoutDescriptor>;

  constructor() {
    this.materialLayoutLibrary = new Map<MaterialType, GPUBindGroupLayoutDescriptor>();

    this.materialLayoutLibrary.set('unlit', UnlitMaterial.getMaterialLayoutDescriptor());
    this.materialLayoutLibrary.set('lambert', LambertMaterial.getMaterialLayoutDescriptor());
    this.materialLayoutLibrary.set('normal', NormalMaterial.getMaterialLayoutDescriptor());
  }

  getMaterialLayoutDescriptor(materialType: MaterialType): GPUBindGroupLayoutDescriptor | undefined {
    return this.materialLayoutLibrary.get(materialType);
  }
}

export { MaterialLayoutLibrary };
