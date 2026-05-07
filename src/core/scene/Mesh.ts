import type { Renderer } from '../renderer/Renderer';
import { Entity, IEntity } from './Entity';
import { Geometry } from './Geometry';
import { Material } from '../materials/Material';
import { constants } from '../constants/constants';
import { errorMessages } from '../constants/errorMessages';
import { UniformBuffer } from '../renderer/UniformBuffer';

interface IMesh extends IEntity {
  geometry: Geometry;
  material: Material;
  pipeline: GPURenderPipeline | null;
  isInitialized: boolean;
  entityUniformsBuffer: UniformBuffer | null;
  entityUniformsBindGroup: GPUBindGroup | null;
  init(renderer: Renderer): void;
  draw(pass: GPURenderPassEncoder, renderer: Renderer): void;
}

class Mesh extends Entity implements IMesh {
  geometry: Geometry;
  material: Material;
  pipeline: GPURenderPipeline | null = null;
  isInitialized: boolean;
  entityUniformsBuffer: UniformBuffer | null = null;
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
    this.createEntityBuffer();
    this.createRenderPipeline(renderer);

    if (this.entityUniformsBuffer) {
      this.entityUniformsBuffer.init(renderer);
      this.createEntityBindGroup(renderer);
    }

    this.isInitialized = true;
  }

  private createRenderPipeline(renderer: Renderer) {
    const pipelineName = this.material.usesAlphaPipeline ? 'alpha' : 'opaque';
    this.pipeline =
      renderer.pipelineLibrary?.getOrCreatePipeline(pipelineName, this.material, this.geometry, renderer) || null;
  }

  private createEntityBuffer() {
    this.entityUniformsBuffer = new UniformBuffer({
      modelMatrix: { type: 'mat4x4<f32>', value: this.matrixWorld },
    });
  }

  private createEntityBindGroup(renderer: Renderer) {
    if (!renderer.entityBindGroupLayout) throw new Error(errorMessages.missingEntityBindGroupLayout);

    if (this.entityUniformsBuffer?.buffer && this.pipeline) {
      this.entityUniformsBindGroup = renderer.device.createBindGroup({
        layout: renderer.entityBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.entityUniformsBuffer.buffer } }],
      });
    }
  }

  protected override onMatrixUpdated() {
    if (this.entityUniformsBuffer) {
      this.entityUniformsBuffer.updateUniform({
        modelMatrix: this.matrixWorld,
      });
    }
  }

  draw(pass: GPURenderPassEncoder, _renderer: Renderer) {
    if (!this.isInitialized) throw new Error(errorMessages.meshNotInitialized);

    if (!this.pipeline) throw new Error(errorMessages.missingPipeline);

    pass.setPipeline(this.pipeline);

    pass.setVertexBuffer(0, this.geometry.vertexBuffer);
    pass.setVertexBuffer(1, this.geometry.normalBuffer);
    pass.setVertexBuffer(2, this.geometry.uvBuffer);
    pass.setVertexBuffer(3, this.geometry.tangentBuffer);

    if (this.material.materialUniformsBuffer) {
      this.material.materialUniformsBuffer.writeUpdatedBufferData();
    }

    if (this.entityUniformsBuffer) {
      this.entityUniformsBuffer.writeUpdatedBufferData();
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

  destroy() {
    this.geometry.destroy();
    this.material.destroy();
    this.entityUniformsBuffer?.destroy();
  }
}

export { Mesh };
