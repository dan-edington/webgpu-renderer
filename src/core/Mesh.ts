import type { Renderer } from './Renderer';
import { Entity } from './Entity';
import { Geometry } from './Geometry';
import { ShaderMaterial } from './ShaderMaterial';
import type { IMesh } from './types';
import { UniformBuffer } from './UniformBuffer';
import { constants } from './constants/constants';
import { errorMessages } from './constants/errorMessages';

class Mesh extends Entity implements IMesh {
  geometry: Geometry;
  material: ShaderMaterial;
  pipeline: GPURenderPipeline | null = null;
  isInitialized: boolean;
  uniformBuffer?: UniformBuffer;
  uniformBindGroup?: GPUBindGroup;

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
    if (this.material.uniformBuffer) {
      this.material.uniformBuffer.init(renderer);
      this.createMeshUniformBindGroup(renderer);
    }
    this.isInitialized = true;
  }

  createPipeline(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

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

  createMeshUniformBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    if (this.material.uniformBuffer?.buffer && this.pipeline) {
      this.uniformBindGroup = renderer.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(constants.bindGroupIndices.MATERIAL),
        entries: [{ binding: 0, resource: { buffer: this.material.uniformBuffer.buffer } }],
      });
    }
  }

  draw(pass: GPURenderPassEncoder, renderer: Renderer) {
    if (!this.isInitialized) {
      this.init(renderer);
    }

    if (!this.pipeline) throw new Error(errorMessages.missingPipeline);

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.geometry.vertexBuffer);

    if (this.material.uniformBuffer) {
      this.material.uniformBuffer.writeUpdatedBufferData();
    }

    if (this.uniformBindGroup) {
      pass.setBindGroup(constants.bindGroupIndices.MATERIAL, this.uniformBindGroup);
    }

    if (this.geometry.isIndexed && this.geometry.indexBuffer) {
      pass.setIndexBuffer(this.geometry.indexBuffer, this.geometry.indexFormat);
      pass.drawIndexed(this.geometry.indexCount);
    } else {
      pass.draw(this.geometry.vertices.length / 3);
    }
  }
}

export { Mesh };
