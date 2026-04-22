import { errorMessages } from './constants/errorMessages';
import { Renderer } from './Renderer';
import type { IShaderMaterial } from './types';
import { UniformBuffer } from './UniformBuffer';
import { UniformValue } from './utilities/computeBufferLayout';

type ShaderMaterialOptions = {
  shader: string;
  uniforms?: Record<string, UniformValue>;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
};

class ShaderMaterial implements IShaderMaterial {
  type: string;
  shader: string;
  shaderModule: GPUShaderModule | null = null;
  uniforms?: Record<string, UniformValue>;
  uniformBuffer?: UniformBuffer;
  pipelineDescriptor: GPURenderPipelineDescriptor | null = null;
  shaderEntryPoints: {
    vertex: string;
    fragment: string;
  };

  constructor(options: ShaderMaterialOptions) {
    this.type = 'ShaderMaterial';
    this.shader = options.shader;
    this.shaderEntryPoints = options.shaderEntryPoints || {
      vertex: 'vertex_shader',
      fragment: 'fragment_shader',
    };
    this.uniforms = options.uniforms;
    if (this.uniforms) {
      this.uniformBuffer = new UniformBuffer(this.uniforms);
    }
  }

  init(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    this.createShaderModule(renderer.device);
  }

  protected createShaderModule(device: GPUDevice) {
    this.shaderModule = device.createShaderModule({
      code: this.shader,
    });
  }
}

export { ShaderMaterial };
