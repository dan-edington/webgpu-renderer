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
  cameraUniformsBuffer: UniformBuffer | null;
  cameraUniformsBindGroup: GPUBindGroup | null;
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
  cameraUniformsBuffer: UniformBuffer | null = null;
  cameraUniformsBindGroup: GPUBindGroup | null = null;
  isInitialized: boolean;

  constructor(options: PerspectiveCameraOptions) {
    super('PerspectiveCamera');
    const { near = 0.1, far = 1000, fov = 75, aspect = 1 } = options;
    this._near = near;
    this._far = far;
    this._fov = fov;
    this._aspect = aspect;
    this.projectionMatrix = mat4.perspective<Float32Array>(this.fov, this.aspect, this.near, this.far);
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

  lookAt(target: Float32Array, up: Float32Array = new Float32Array([0, 1, 0])) {
    mat4.lookAt(this.position, target, up, this.viewMatrix);
    mat4.inverse(this.viewMatrix, this.matrix);
    this.viewProjectionMatrix = mat4.multiply(this.projectionMatrix!, this.viewMatrix);

    if (this.cameraUniformsBuffer) {
      this.cameraUniformsBuffer.updateUniform({
        viewProjectionMatrix: this.viewProjectionMatrix,
      });
    }
  }

  init(renderer: Renderer) {
    if (this.cameraUniformsBuffer) {
      this.cameraUniformsBuffer.init(renderer);
      this.createCameraBindGroup(renderer);
    }

    this.isInitialized = true;
  }

  destroy() {
    this.cameraUniformsBuffer?.destroy();
  }

  updateProjectionMatrix() {
    if (!this.projectionMatrix) {
      return;
    }

    mat4.perspective<Float32Array>(this.fov, this.aspect, this.near, this.far, this.projectionMatrix);
    mat4.multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);

    if (this.cameraUniformsBuffer) {
      this.cameraUniformsBuffer.updateUniform({
        viewProjectionMatrix: this.viewProjectionMatrix,
      });
    }
  }

  private createCameraBindGroup(renderer: Renderer) {
    if (!renderer.cameraBindGroupLayout) throw new Error(errorMessages.missingCameraBufferLayout);
    if (!this.cameraUniformsBuffer?.buffer) throw new Error(errorMessages.missingCameraBuffer);

    this.cameraUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.cameraBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.cameraUniformsBuffer.buffer } }],
    });
  }

  private createCameraUniformBuffer() {
    this.cameraUniformsBuffer = new UniformBuffer({
      viewProjectionMatrix: { type: 'mat4x4<f32>', value: this.viewProjectionMatrix },
    });
  }

  protected override onMatrixUpdated() {
    if (!this.projectionMatrix) {
      return;
    }

    mat4.inverse(this.matrix, this.viewMatrix);
    mat4.multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);

    if (this.cameraUniformsBuffer) {
      this.cameraUniformsBuffer.updateUniform({
        viewProjectionMatrix: this.viewProjectionMatrix,
      });
    }
  }
}

export { PerspectiveCamera };
