import { Mat4, mat4 } from 'wgpu-matrix';
import { Entity } from './Entity';
import { UniformBuffer } from './UniformBuffer';
import { Renderer } from './Renderer';
import { errorMessages } from './constants/errorMessages';

interface IPerspectiveCamera {
  near: number;
  far: number;
  fov: number;
  aspect: number;
  projectionMatrix: Mat4 | null;
  viewMatrix: Mat4;
  viewProjectionMatrix: Mat4;
  cameraUniformBuffer: UniformBuffer | null;
  cameraBindGroup: GPUBindGroup | null;
  isInitialized: boolean;
  init(renderer: Renderer): void;
  createCameraBindGroup(renderer: Renderer): void;
  createCameraUniformBuffer(): void;
}

type PerspectiveCameraOptions = {
  near?: number;
  far?: number;
  fov?: number;
  aspect?: number;
};

class PerspectiveCamera extends Entity implements IPerspectiveCamera {
  near: number;
  far: number;
  fov: number;
  aspect: number;
  projectionMatrix: Mat4 | null = null;
  viewMatrix: Mat4;
  viewProjectionMatrix: Mat4;
  cameraUniformBuffer: UniformBuffer | null = null;
  cameraBindGroup: GPUBindGroup | null = null;
  isInitialized: boolean;

  constructor(options: PerspectiveCameraOptions) {
    super('PerspectiveCamera');
    const { near = 0.1, far = 1000, fov = 75, aspect = 1 } = options;
    this.near = near;
    this.far = far;
    this.fov = fov;
    this.aspect = aspect;
    this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
    this.viewMatrix = mat4.inverse(this.matrix);
    this.viewProjectionMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
    this.createCameraUniformBuffer();
    this.isInitialized = false;
  }

  init(renderer: Renderer) {
    if (this.cameraUniformBuffer) {
      this.cameraUniformBuffer.init(renderer);
      this.createCameraBindGroup(renderer);
    }

    this.isInitialized = true;
  }

  createCameraBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);
    if (!renderer.cameraBindGroupLayout) throw new Error(errorMessages.missingCameraBufferLayout);
    if (!this.cameraUniformBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);

    this.cameraBindGroup = renderer.device.createBindGroup({
      layout: renderer.cameraBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.cameraUniformBuffer.buffer } }],
    });
  }

  createCameraUniformBuffer() {
    this.cameraUniformBuffer = new UniformBuffer({
      viewProjectionMatrix: { type: 'mat4x4<f32>', value: this.viewProjectionMatrix },
    });
  }

  updateProjectionMatrix() {
    if (!this.projectionMatrix) {
      return;
    }

    this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
    this.viewProjectionMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);

    if (this.cameraUniformBuffer) {
      this.cameraUniformBuffer.updateUniform({
        viewProjectionMatrix: this.viewProjectionMatrix,
      });
    }
  }

  protected override onMatrixUpdated() {
    if (!this.projectionMatrix) {
      return;
    }

    this.viewMatrix = mat4.inverse(this.matrix);
    this.viewProjectionMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);

    if (this.cameraUniformBuffer) {
      this.cameraUniformBuffer.updateUniform({
        viewProjectionMatrix: this.viewProjectionMatrix,
      });
    }
  }
}

export { PerspectiveCamera };
