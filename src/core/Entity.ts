import { Mat4, Quat, Vec3, vec3, quat, mat4 } from 'wgpu-matrix';
import type { uuid } from './types';
import { Scene } from './Scene';

export interface IEntity {
  id: uuid;
  name?: string;
  type: string;
  isRenderable: boolean;
  visible: boolean;
  children: Entity[];
  parent: Entity | Scene | null;
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  quaternion: Quat;
  matrix: Mat4;
  matrixNeedsUpdate: boolean;
  add(entity: Entity): void;
  remove(entity: Entity): void;
  setPosition(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
  setRotation(x: number, y: number, z: number): void;
  setQuaternion(x: number, y: number, z: number, w: number): void;
  updateMatrix(): void;
}

class Entity implements IEntity {
  type: string;
  id: uuid;
  name?: string;
  isRenderable: boolean;
  visible: boolean;
  children: Entity[];
  parent: Entity | Scene | null;
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  quaternion: Quat;
  matrix: Mat4;
  matrixNeedsUpdate: boolean;

  constructor(type: string = 'Entity') {
    this.type = type;
    this.id = crypto.randomUUID();
    this.isRenderable = false;
    this.visible = true;
    this.children = [];
    this.parent = null;
    this.position = vec3.create(0, 0, 0);
    this.scale = vec3.create(1, 1, 1);
    this.rotation = vec3.create(0, 0, 0);
    this.quaternion = quat.create(0, 0, 0, 1);
    this.matrix = mat4.create();
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  add(entity: Entity) {
    this.children.push(entity);
    entity.parent = this;
  }

  remove(entity: Entity) {
    const index = this.children.findIndex((child) => child.id === entity.id);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    entity.parent = null;
  }

  setPosition(x: number, y: number, z: number) {
    this.position.set([x, y, z]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  setScale(x: number, y: number, z: number) {
    this.scale.set([x, y, z]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  setRotation(x: number, y: number, z: number) {
    this.rotation.set([x, y, z]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  setQuaternion(x: number, y: number, z: number, w: number) {
    this.quaternion.set([x, y, z, w]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  updateMatrix() {
    if (!this.matrixNeedsUpdate) {
      return;
    }

    // Order: Rotation, Scale, Translation
    quat.fromEuler(this.rotation[0], this.rotation[1], this.rotation[2], 'xyz', this.quaternion);
    mat4.fromQuat(this.quaternion, this.matrix);
    mat4.scale(this.matrix, this.scale, this.matrix);
    mat4.setTranslation(this.matrix, this.position, this.matrix);
    this.matrixNeedsUpdate = false;
    this.onMatrixUpdated();
  }

  protected onMatrixUpdated(): void {}
}

export { Entity };
