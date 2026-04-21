import { Renderer } from './Renderer';
import type { IShaderMaterial } from './types';

type ShaderMaterialOptions = {
  shader: string;
  uniforms?: Record<string, any>;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
};

class ShaderMaterial implements IShaderMaterial {
  shader: string;
  uniforms: Record<string, any>;
  shaderModule: GPUShaderModule;
  pipelineDescriptor: GPURenderPipelineDescriptor;
  shaderEntryPoints: {
    vertex: string;
    fragment: string;
  };

  constructor(options: ShaderMaterialOptions) {
    this.shader = options.shader;
    this.uniforms = options.uniforms || {};
    this.shaderEntryPoints = options.shaderEntryPoints || {
      vertex: 'vertex_shader',
      fragment: 'fragment_shader',
    };
  }

  init(renderer: Renderer) {
    this.createShaderModule(renderer.device);
  }

  protected createShaderModule(device: GPUDevice) {
    this.shaderModule = device.createShaderModule({
      code: this.shader,
    });
  }
}

export { ShaderMaterial };
