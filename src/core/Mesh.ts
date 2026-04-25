import type { Renderer } from './renderer/Renderer';
import { Entity, IEntity } from './Entity';
import { Geometry } from './Geometry';
import { Material } from './materials/Material';
import { constants } from './constants/constants';
import { errorMessages } from './constants/errorMessages';
import { UniformBuffer } from './UniformBuffer';

interface IMesh extends IEntity {
  geometry: Geometry;
  material: Material;
  pipeline: GPURenderPipeline | null;
  isInitialized: boolean;
  entityBuffer: UniformBuffer | null;
  entityUniformsBindGroup: GPUBindGroup | null;
  init(renderer: Renderer): void;
  draw(pass: GPURenderPassEncoder, renderer: Renderer): void;
}

class Mesh extends Entity implements IMesh {
  geometry: Geometry;
  material: Material;
  pipeline: GPURenderPipeline | null = null;
  isInitialized: boolean;
  entityBuffer: UniformBuffer | null = null;
  entityUniformsBindGroup: GPUBindGroup | null = null;

  constructor(geometry: Geometry, material: Material) {
    super('Mesh');
    this.isInitialized = false;
    this.geometry = geometry;
    this.material = material;
  }

  init(renderer: Renderer) {
    this.geometry.init(renderer);
    this.material.init(renderer);
    this.createEntityBuffer(renderer);
    this.createPipeline(renderer);

    if (this.entityBuffer) {
      this.entityBuffer.init(renderer);
      this.createEntityBufferBindGroup(renderer);
    }

    this.isInitialized = true;
  }

  private createPipeline(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);
    const pipelineName = this.material.transparent ? 'transparent' : 'opaque';
    const Pipeline = renderer.pipelineLibrary?.getPipeline(pipelineName);
    if (!Pipeline) throw new Error(errorMessages.missingPipeline);

    this.pipeline = Pipeline.createPipeline({
      renderer,
      material: this.material,
      geometry: this.geometry,
    });
  }

  private createEntityBuffer(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    this.entityBuffer = new UniformBuffer({
      modelMatrix: { type: 'mat4x4<f32>', value: this.matrixWorld },
    });
  }

  private createEntityBufferBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);
    if (!renderer.entityBindGroupLayout) throw new Error(errorMessages.missingEntityBindGroupLayout);

    if (this.entityBuffer?.buffer && this.pipeline) {
      this.entityUniformsBindGroup = renderer.device.createBindGroup({
        layout: renderer.entityBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.entityBuffer.buffer } }],
      });
    }
  }

  protected override onMatrixUpdated() {
    if (this.entityBuffer) {
      this.entityBuffer.updateUniform({
        modelMatrix: this.matrixWorld,
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
    pass.setVertexBuffer(1, this.geometry.normalBuffer);

    if (this.material.materialUniformsBuffer) {
      this.material.materialUniformsBuffer.writeUpdatedBufferData();
    }

    if (this.entityBuffer) {
      this.entityBuffer.writeUpdatedBufferData();
    }

    if (this.entityUniformsBindGroup) {
      pass.setBindGroup(constants.bindGroupIndices.ENTITY, this.entityUniformsBindGroup);
    }

    if (this.material.materialUniformsBindGroup) {
      pass.setBindGroup(constants.bindGroupIndices.MATERIAL, this.material.materialUniformsBindGroup);
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
