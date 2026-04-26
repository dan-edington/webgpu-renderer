import { Geometry } from '../../Geometry';
import { Material } from '../../materials/Material';
import { Renderer } from '../Renderer';
import { Pipeline } from './Pipeline';

type OpaquePipelineOptions = {
  renderer: Renderer;
  material: Material;
  geometry: Geometry;
};

class OpaquePipeline extends Pipeline {
  constructor() {
    super();
  }

  static createPipeline(options: OpaquePipelineOptions): GPURenderPipeline {
    const { renderer, material, geometry } = options;

    if (!renderer.device || !renderer.depthTexture || !renderer.presentationFormat)
      throw new Error('Renderer device is not initialized.');
    if (!material.shaderModule) throw new Error('Material shader module is not initialized.');
    if (!renderer.materialBindGroupLayouts) throw new Error('Renderer material bind group layouts are missing.');
    const materialBindGroupLayout = renderer.materialBindGroupLayouts.get(material.type);
    if (!materialBindGroupLayout)
      throw new Error(
        `No bind group layout found for material type '${material.type}'. Ensure the renderer has a bind group layout for this material type.`,
      );
    const pipelineLayout = renderer.device.createPipelineLayout({
      bindGroupLayouts: [
        renderer.cameraBindGroupLayout,
        renderer.sceneBindGroupLayout,
        materialBindGroupLayout,
        renderer.entityBindGroupLayout,
      ],
    });

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
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
        ],
      },
      fragment: {
        module: material.shaderModule,
        entryPoint: material.shaderEntryPoints.fragment,
        targets: [
          {
            format: renderer.presentationFormat,
          },
        ],
      },
      primitive: {
        topology: geometry.topology,
        cullMode: 'back',
      },
      depthStencil: {
        format: renderer.depthTexture.format,
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    };

    const pipeline = renderer.device.createRenderPipeline(pipelineDescriptor);

    return pipeline;
  }
}

export { OpaquePipeline };
