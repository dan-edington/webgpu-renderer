import { Geometry } from '../../Geometry';
import { constants } from '../../constants/constants';
import { errorMessages } from '../../constants/errorMessages';
import { Material } from '../../materials/Material';
import { Renderer } from '../Renderer';
import { Pipeline } from './Pipeline';

export type AlphaPipelineOptions = {
  renderer: Renderer;
  material: Material;
  geometry: Geometry;
};

class AlphaPipeline extends Pipeline {
  constructor() {
    super();
  }

  static createPipeline(options: AlphaPipelineOptions): GPURenderPipeline {
    const { renderer, material, geometry } = options;

    if (!renderer.depthTexture) throw new Error(errorMessages.missingDepthTexture);
    if (!material.shaderModule) throw new Error(errorMessages.missingMaterialShaderModule);
    if (!renderer.materialBindGroupLayouts) throw new Error(errorMessages.missingRendererMaterialBindGroupLayouts);

    const materialBindGroupLayout = renderer.materialBindGroupLayouts.get(material.type);

    if (!materialBindGroupLayout)
      throw new Error(`${errorMessages.missingMaterialTypeBindGroupLayout} Material type: '${material.type}'.`);

    const pipelineLayout = renderer.device.createPipelineLayout({
      bindGroupLayouts: [
        renderer.cameraBindGroupLayout,
        renderer.sceneBindGroupLayout,
        materialBindGroupLayout,
        renderer.entityBindGroupLayout,
      ],
    });

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: `AlphaPipeline_${material.type}`,
      layout: pipelineLayout,
      vertex: {
        module: material.shaderModule,
        entryPoint: material.shaderEntryPoints.vertex,
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
          {
            arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
              {
                shaderLocation: 3,
                offset: 0,
                format: 'float32x4',
              },
            ],
          },
        ],
      },
      fragment: {
        module: material.shaderModule,
        entryPoint: material.shaderEntryPoints.fragment,
        targets: [
          {
            format: constants.INTERNAL_COLOR_FORMAT,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {
        topology: geometry.topology,
        cullMode: 'back',
      },
      depthStencil: {
        format: renderer.depthTexture.format,
        depthWriteEnabled: false,
        depthCompare: 'less',
      },
      multisample: {
        count: renderer.multiSampling,
      },
    };

    const pipeline = renderer.device.createRenderPipeline(pipelineDescriptor);

    return pipeline;
  }
}

export { AlphaPipeline };
