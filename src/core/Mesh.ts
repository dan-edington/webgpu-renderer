import type { Renderer } from './Renderer';
import { Entity, IEntity } from './Entity';
import { Geometry } from './Geometry';
import { ShaderMaterial } from './ShaderMaterial';
import { constants } from './constants/constants';
import { errorMessages } from './constants/errorMessages';
import { UniformBuffer } from './UniformBuffer';

interface IMesh extends IEntity {
  geometry: Geometry;
  material: ShaderMaterial;
  pipeline: GPURenderPipeline | null;
  isInitialized: boolean;
  entityBuffer: UniformBuffer | null;
  entityUniformsBindGroup: GPUBindGroup | null;
  materialUniformsBindGroup: GPUBindGroup | null;
  init(renderer: Renderer): void;
  createPipeline(renderer: Renderer): void;
  createMaterialUniformsBindGroup(renderer: Renderer): void;
  draw(pass: GPURenderPassEncoder, renderer: Renderer): void;
}

class Mesh extends Entity implements IMesh {
  geometry: Geometry;
  material: ShaderMaterial;
  pipeline: GPURenderPipeline | null = null;
  isInitialized: boolean;
  entityBuffer: UniformBuffer | null = null;
  entityUniformsBindGroup: GPUBindGroup | null = null;
  materialUniformsBindGroup: GPUBindGroup | null = null;

  constructor(geometry: Geometry, material: ShaderMaterial) {
    super('Mesh');
    this.isRenderable = true;
    this.isInitialized = false;
    this.geometry = geometry;
    this.material = material;
  }

  init(renderer: Renderer) {
    this.geometry.init(renderer);
    this.material.init(renderer);
    this.createEntityBuffer(renderer);
    this.createPipeline(renderer);

    if (this.material.materialUniformsBuffer) {
      this.material.materialUniformsBuffer.init(renderer);
      this.createMaterialUniformsBindGroup(renderer);
    }

    if (this.entityBuffer) {
      this.entityBuffer.init(renderer);
      this.createEntityBufferBindGroup(renderer);
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

  createEntityBuffer(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    this.entityBuffer = new UniformBuffer({
      modelMatrix: { type: 'mat4x4<f32>', value: this.matrix },
    });
  }

  createEntityBufferBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    if (this.entityBuffer?.buffer && this.pipeline) {
      this.entityUniformsBindGroup = renderer.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(constants.bindGroupIndices.ENTITY),
        entries: [{ binding: 0, resource: { buffer: this.entityBuffer.buffer } }],
      });
    }
  }

  createMaterialUniformsBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    if (this.material.materialUniformsBuffer?.buffer && this.pipeline) {
      this.materialUniformsBindGroup = renderer.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(constants.bindGroupIndices.MATERIAL),
        entries: [{ binding: 0, resource: { buffer: this.material.materialUniformsBuffer.buffer } }],
      });
    }
  }

  protected override onMatrixUpdated() {
    if (this.entityBuffer) {
      this.entityBuffer.updateUniform({
        modelMatrix: this.matrix,
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

    if (this.material.materialUniformsBuffer) {
      this.material.materialUniformsBuffer.writeUpdatedBufferData();
    }

    if (this.entityBuffer) {
      this.entityBuffer.writeUpdatedBufferData();
    }

    if (this.entityUniformsBindGroup) {
      pass.setBindGroup(constants.bindGroupIndices.ENTITY, this.entityUniformsBindGroup);
    }

    if (this.materialUniformsBindGroup) {
      pass.setBindGroup(constants.bindGroupIndices.MATERIAL, this.materialUniformsBindGroup);
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
