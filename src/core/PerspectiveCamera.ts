import { Mat4, mat4 } from 'wgpu-matrix';
import { Entity } from './Entity';
import { UniformBuffer } from './UniformBuffer';
import { Renderer } from './renderer/Renderer';
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
  updateProjectionMatrix(): void;
}

type PerspectiveCameraOptions = {
  near?: number;
  far?: number;
  fov?: number;
  aspect?: number;
};

class PerspectiveCamera extends Entity implements IPerspectiveCamera {
  private _near: number;
  private _far: number;
  private _fov: number;
  private _aspect: number;
  projectionMatrix: Mat4 | null = null;
  viewMatrix: Mat4;
  viewProjectionMatrix: Mat4;
  cameraUniformBuffer: UniformBuffer | null = null;
  cameraBindGroup: GPUBindGroup | null = null;
  isInitialized: boolean;

  constructor(options: PerspectiveCameraOptions) {
    super('PerspectiveCamera');
    const { near = 0.1, far = 1000, fov = 75, aspect = 1 } = options;
    this._near = near;
    this._far = far;
    this._fov = fov;
    this._aspect = aspect;
    this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
    this.viewMatrix = mat4.inverse(this.matrix);
    this.viewProjectionMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
    this.createCameraUniformBuffer();
    this.isInitialized = false;
  }

  get near() {
    return this._near;
  }

  set near(value: number) {
    if (this._near === value) return;
    this._near = value;
    this.updateProjectionMatrix();
  }

  get far() {
    return this._far;
  }

  set far(value: number) {
    if (this._far === value) return;
    this._far = value;
    this.updateProjectionMatrix();
  }

  get fov() {
    return this._fov;
  }

  set fov(value: number) {
    if (this._fov === value) return;
    this._fov = value;
    this.updateProjectionMatrix();
  }

  get aspect() {
    return this._aspect;
  }

  set aspect(value: number) {
    if (this._aspect === value) return;
    this._aspect = value;
    this.updateProjectionMatrix();
  }

  init(renderer: Renderer) {
    if (this.cameraUniformBuffer) {
      this.cameraUniformBuffer.init(renderer);
      this.createCameraBindGroup(renderer);
    }

    this.isInitialized = true;
  }

  private createCameraBindGroup(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);
    if (!renderer.cameraBindGroupLayout) throw new Error(errorMessages.missingCameraBufferLayout);
    if (!this.cameraUniformBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);

    this.cameraBindGroup = renderer.device.createBindGroup({
      layout: renderer.cameraBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.cameraUniformBuffer.buffer } }],
    });
  }

  private createCameraUniformBuffer() {
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
