import type { Renderer } from './Renderer';
import { Entity } from './Entity';
import { Geometry } from './Geometry';
import { ShaderMaterial } from './ShaderMaterial';
import type { IMesh } from './types';

class Mesh extends Entity implements IMesh {
  geometry: Geometry;
  material: ShaderMaterial;
  pipeline: GPURenderPipeline;
  isInitialized: boolean;

  constructor(geometry: Geometry, material: ShaderMaterial) {
    super();
    this.isRenderable = true;
    this.isInitialized = false;
    this.geometry = geometry;
    this.material = material;
  }

  init(renderer: Renderer) {
    this.geometry.init(renderer);
    this.material.init(renderer);
    this.createPipeline(renderer);
    this.isInitialized = true;
  }

  createPipeline(renderer: Renderer) {
    const pipelineDescriptor = {
      layout: 'auto',
      vertex: {
        module: this.material.shaderModule,
        entryPoint: this.material.shaderEntryPoints.vertex,
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
        ],
      },
      fragment: {
        module: this.material.shaderModule,
        entryPoint: this.material.shaderEntryPoints.fragment,
        targets: [
          {
            format: renderer.presentationFormat,
          },
        ],
      },
      primitive: {
        topology: this.geometry.topology,
        cullMode: 'back',
      },
    } as GPURenderPipelineDescriptor;

    this.pipeline = renderer.device.createRenderPipeline(pipelineDescriptor);
  }

  draw(pass: GPURenderPassEncoder, renderer: Renderer) {
    if (!this.isInitialized) {
      this.init(renderer);
    }

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.geometry.vertexBuffer);

    if (this.geometry.isIndexed && this.geometry.indexBuffer) {
      pass.setIndexBuffer(this.geometry.indexBuffer, this.geometry.indexFormat);
      pass.drawIndexed(this.geometry.indexCount);
    } else {
      pass.draw(this.geometry.vertices.length / 3);
    }
  }
}

export { Mesh };
