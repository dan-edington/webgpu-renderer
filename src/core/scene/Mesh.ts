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
  init(rendererInstance: Renderer): void;
  draw(pass: GPURenderPassEncoder, rendererInstance: Renderer): void;
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

  init(rendererInstance: Renderer) {
    this.geometry.init(rendererInstance);
    this.material.init(rendererInstance);
    this.createEntityBuffer();
    this.createRenderPipeline(rendererInstance);

    if (this.entityUniformsBuffer) {
      this.entityUniformsBuffer.init(rendererInstance);
      this.createEntityBindGroup(rendererInstance);
    }

    this.isInitialized = true;
  }

  private createRenderPipeline(rendererInstance: Renderer) {
    const shaderModule = rendererInstance.shaderLibrary?.getShader(this.material.shader)?.shaderModule;
    const materialBindGroupLayout = rendererInstance.materialBindGroupLayouts?.get(this.material.type);

    if (!rendererInstance.depthTexture) throw new Error(errorMessages.missingDepthTexture);
    if (!shaderModule) throw new Error(errorMessages.missingMaterialShaderModule);
    if (!materialBindGroupLayout)
      throw new Error(`${errorMessages.missingMaterialTypeBindGroupLayout} Material type: '${this.material.type}'.`);

    if (!rendererInstance.cameraBindGroupLayout) throw new Error(errorMessages.missingCameraBufferLayout);
    if (!rendererInstance.sceneBindGroupLayout) throw new Error(errorMessages.missingSceneBindGroupLayout);
    if (!rendererInstance.entityBindGroupLayout) throw new Error(errorMessages.missingEntityBindGroupLayout);

    this.pipeline =
      rendererInstance.pipelineManager?.getOrCreateRenderPipeline({
        label: `MeshPipeline_${this.material.type}`,
        shaderModule,
        topology: this.geometry.topology,
        format: constants.INTERNAL_COLOR_FORMAT,
        cullMode: this.material.doubleSided ? 'none' : 'back',
        vertexBuffers: [
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
        bindGroupLayouts: [
          rendererInstance.cameraBindGroupLayout,
          rendererInstance.sceneBindGroupLayout,
          materialBindGroupLayout,
          rendererInstance.entityBindGroupLayout,
        ],
        depthStencilState: {
          format: rendererInstance.depthTexture.format,
          depthWriteEnabled: this.material.transparent ? false : this.material.depthWrite,
          depthCompare: 'less',
        },
        blendState: this.material.transparent
          ? {
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
            }
          : undefined,
      }) || null;
  }

  private createEntityBuffer() {
    this.entityUniformsBuffer = new UniformBuffer({
      modelMatrix: { type: 'mat4x4<f32>', value: this.matrixWorld },
    });
  }

  private createEntityBindGroup(rendererInstance: Renderer) {
    if (!rendererInstance.entityBindGroupLayout) throw new Error(errorMessages.missingEntityBindGroupLayout);

    if (this.entityUniformsBuffer?.buffer && this.pipeline) {
      this.entityUniformsBindGroup = rendererInstance.device.createBindGroup({
        layout: rendererInstance.entityBindGroupLayout,
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

  draw(pass: GPURenderPassEncoder, _rendererInstance: Renderer) {
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
