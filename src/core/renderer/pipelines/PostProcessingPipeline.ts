import { errorMessages } from '../../constants/errorMessages';
import { Renderer } from '../Renderer';
import { Pipeline } from './Pipeline';
import { postProcessingBindGroupLayoutDescriptor } from '../bindGroupLayouts/postprocessing';

export type PostProcessingPipelineOptions = {
  renderer: Renderer;
};

class PostProcessingPipeline extends Pipeline {
  constructor() {
    super();
  }

  static createPipeline(options: PostProcessingPipelineOptions): GPURenderPipeline {
    const { renderer } = options;

    if (!renderer.shaderLibrary) throw new Error(errorMessages.missingShaderLibrary);

    const shaderCode = renderer.shaderLibrary.getShader('postprocessing');

    if (!shaderCode) throw new Error(errorMessages.missingShaderCode);
    const shaderModule = renderer.device.createShaderModule({ code: shaderCode });

    const pipelineLayout = renderer.device.createPipelineLayout({
      bindGroupLayouts: [renderer.device.createBindGroupLayout(postProcessingBindGroupLayoutDescriptor)],
    });

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: `Post Processing Pipeline`,
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertex_shader',
        buffers: [
          {
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
          {
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
          {
            arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              {
                shaderLocation: 2,
                offset: 0,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragment_shader',
        targets: [
          {
            format: renderer.presentationFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    };

    const pipeline = renderer.device.createRenderPipeline(pipelineDescriptor);

    return pipeline;
  }
}

export { PostProcessingPipeline };
