import { Material, MaterialOptions } from './Material';

type CustomMaterialOptions = Omit<MaterialOptions, 'materialFlags' | 'type'>;

// CustomMaterial's uniforms will be placed in bind group 2

class CustomMaterial extends Material {
  constructor(options: CustomMaterialOptions) {
    super({
      ...options,
      type: 'custom',
      materialFlags: 0,
    });
  }

  protected override getBindGroupEntries(): GPUBindGroupEntry[] {
    if (!this.materialUniformsBuffer?.buffer) return [];

    return [{ binding: 0, resource: { buffer: this.materialUniformsBuffer.buffer } }];
  }

  static override getMaterialLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
    return {
      label: 'Custom Material Bind Group Layout',
      entries: [
        // Custom uniforms go here
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    };
  }
}

export { CustomMaterial };
