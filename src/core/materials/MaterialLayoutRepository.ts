import { MaterialType } from '../types';

class MaterialLayoutRepository {
  private materialLayoutRepository: Map<MaterialType, GPUBindGroupLayoutDescriptor>;

  constructor() {
    this.materialLayoutRepository = new Map<MaterialType, GPUBindGroupLayoutDescriptor>();

    this.createNormalMaterialLayoutDescriptor();
    this.createLambertMaterialLayoutDescriptor();
    this.createUnlitMaterialLayoutDescriptor();
  }

  createNormalMaterialLayoutDescriptor() {
    const normalMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
      entries: [
        // binding 0: material uniforms (color, etc.)
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 1: sampler for color textures
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    };

    this.materialLayoutRepository.set('normal', normalMaterialLayoutDescriptor);
  }

  createLambertMaterialLayoutDescriptor() {
    const lambertMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
      entries: [
        // binding 0: material uniforms (color, etc.)
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        // binding 1: albedo/color texture
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 2: normal map texture
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 3: sampler for color textures
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    };

    this.materialLayoutRepository.set('lambert', lambertMaterialLayoutDescriptor);
  }

  createUnlitMaterialLayoutDescriptor() {
    const unlitMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
      entries: [
        // binding 0: material uniforms (color, etc.)
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        // binding 1: alpha texture
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        // binding 2: sampler for color textures
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
      ],
    };

    this.materialLayoutRepository.set('unlit', unlitMaterialLayoutDescriptor);
  }

  getMaterialLayoutDescriptor(materialType: MaterialType): GPUBindGroupLayoutDescriptor | undefined {
    return this.materialLayoutRepository.get(materialType);
  }
}

export { MaterialLayoutRepository };
