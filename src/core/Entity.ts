import { Mat4, Quat, Vec3, vec3, quat, mat4 } from 'wgpu-matrix';
import type { uuid } from './types';
import type { Scene } from './Scene';

export interface IEntity {
  id: uuid;
  name?: string;
  type: string;
  isLight: boolean;
  children: Entity[];
  parent: Entity | Scene | null;
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  quaternion: Quat;
  matrix: Mat4;
  matrixNeedsUpdate: boolean;
  add(entity: Entity | Entity[]): void;
  remove(entity: Entity): void;
  setPosition(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
  setRotation(x: number, y: number, z: number): void;
  setQuaternion(x: number, y: number, z: number, w: number): void;
}

class Entity implements IEntity {
  type: string;
  id: uuid;
  name?: string;
  isLight: boolean;
  private _visible: boolean;
  children: Entity[];
  parent: Entity | Scene | null;
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  quaternion: Quat;
  matrix: Mat4;
  matrixWorld: Mat4;
  matrixNeedsUpdate: boolean;

  constructor(type: string = 'Entity') {
    this.type = type;
    this.id = crypto.randomUUID();
    this.isLight = false;
    this._visible = true;
    this.children = [];
    this.parent = null;
    this.position = vec3.create(0, 0, 0);
    this.scale = vec3.create(1, 1, 1);
    this.rotation = vec3.create(0, 0, 0);
    this.quaternion = quat.create(0, 0, 0, 1);
    this.matrix = mat4.create();
    this.matrixWorld = mat4.create();
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  public add(entity: Entity | Entity[]) {
    if (Array.isArray(entity)) {
      entity.forEach((e) => {
        this.children.push(e);
        e.parent = this;
        if (this.isLightEntity(e)) {
          this.markSceneAsDirty('lights');
        }
      });
    } else {
      this.children.push(entity);
      entity.parent = this;
      if (this.isLightEntity(entity)) {
        this.markSceneAsDirty('lights');
      }
    }

    this.markSceneAsDirty('renderlist');
  }

  public remove(entity: Entity) {
    const index = this.children.findIndex((child) => child.id === entity.id);

    if (index !== -1) {
      this.children.splice(index, 1);
      this.markSceneAsDirty('renderlist');
      if (this.isLightEntity(entity)) {
        this.markSceneAsDirty('lights');
      }
    }

    entity.parent = null;
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set([x, y, z]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  public setScale(x: number, y: number, z: number) {
    this.scale.set([x, y, z]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  public setRotation(x: number, y: number, z: number) {
    this.rotation.set([x, y, z]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  public setQuaternion(x: number, y: number, z: number, w: number) {
    this.quaternion.set([x, y, z, w]);
    this.matrixNeedsUpdate = true;
    this.updateMatrix();
  }

  protected updateMatrix() {
    if (!this.matrixNeedsUpdate) {
      return;
    }

    // Order: Rotation, Scale, Translation
    quat.fromEuler(this.rotation[0], this.rotation[1], this.rotation[2], 'xyz', this.quaternion);
    mat4.fromQuat(this.quaternion, this.matrix);
    mat4.scale(this.matrix, this.scale, this.matrix);
    mat4.setTranslation(this.matrix, this.position, this.matrix);

    if (this.parent) {
      mat4.multiply(this.parent.matrixWorld, this.matrix, this.matrixWorld);
    } else {
      mat4.copy(this.matrix, this.matrixWorld);
    }

    this.children.forEach((child) => {
      child.matrixNeedsUpdate = true;
      child.updateMatrix();
    });

    this.matrixNeedsUpdate = false;

    this.onMatrixUpdated();
  }

  set visible(value: boolean) {
    if (this._visible !== value) {
      this._visible = value;
      if (this.isLightEntity(this)) {
        this.markSceneAsDirty('lights');
      } else {
        this.markSceneAsDirty('renderlist');
      }
    }
  }

  get visible() {
    return this._visible;
  }

  protected onMatrixUpdated(): void {}

  private isLightEntity(entity: Entity): boolean {
    return entity.isLight;
  }

  protected markSceneAsDirty(dirtyType: 'lights' | 'renderlist'): void {
    let currentNode: Entity | Scene | null = this;

    // Walk back up the scene graph to the Scene and set renderListNeedsUpdate to true
    while (currentNode) {
      if (currentNode.type === 'Scene' && 'renderListNeedsUpdate' in currentNode) {
        if (dirtyType === 'lights') {
          currentNode.lightsNeedUpdate = true;
        } else if (dirtyType === 'renderlist') {
          currentNode.renderListNeedsUpdate = true;
        }
        return;
      }

      currentNode = currentNode.parent;
    }
  }
}

export { Entity };
