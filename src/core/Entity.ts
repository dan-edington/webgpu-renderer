import { Mat4, Quat, Vec3, vec3, quat, mat4 } from 'wgpu-matrix';
import type { IEntity } from './types';

class Entity implements IEntity {
  type: string;
  id: string;
  name?: string;
  isRenderable: boolean;
  visible: boolean;
  children: IEntity[];
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  quaternion: Quat;
  matrix: Mat4;
  matrixNeedsUpdate: boolean;

  constructor() {
    this.type = 'Entity';
    this.id = crypto.randomUUID();
    this.isRenderable = false;
    this.visible = true;
    this.children = [];
    this.position = vec3.create(0, 0, 0);
    this.scale = vec3.create(1, 1, 1);
    this.rotation = vec3.create(0, 0, 0);
    this.quaternion = quat.create(0, 0, 0, 1);
    this.matrix = mat4.create();
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  add(entity: IEntity) {
    this.children.push(entity);
  }

  remove(entity: IEntity) {
    const index = this.children.findIndex((child) => child.id === entity.id);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  setPosition(x: number, y: number, z: number) {
    this.position.set([x, y, z]);
    this.matrixNeedsUpdate = true;
  }

  setScale(x: number, y: number, z: number) {
    this.scale.set([x, y, z]);
    this.matrixNeedsUpdate = true;
  }

  setRotation(x: number, y: number, z: number) {
    this.rotation.set([x, y, z]);
    this.matrixNeedsUpdate = true;
  }

  setQuaternion(x: number, y: number, z: number, w: number) {
    this.quaternion.set([x, y, z, w]);
    this.matrixNeedsUpdate = true;
  }

  updateMatrix() {
    if (this.matrixNeedsUpdate) {
      // Order: Rotation, Scale, Translation
      quat.fromEuler(this.rotation[0], this.rotation[1], this.rotation[2], 'xyz', this.quaternion);
      mat4.fromQuat(this.quaternion, this.matrix);
      mat4.scale(this.matrix, this.scale, this.matrix);
      mat4.setTranslation(this.matrix, this.position, this.matrix);
      this.matrixNeedsUpdate = false;
    }
  }
}

export { Entity };
