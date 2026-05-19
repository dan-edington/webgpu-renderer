import { mat4, quat, vec3 } from 'wgpu-matrix';
import { uuid } from '../types';
import type { Scene } from './scene';

export type Entity = {
  id: uuid;
  name: string;
  type: string;
  visible: boolean;
  isLight: boolean;
  children: Entity[];
  parent: Entity | Scene | null;
  get position(): Float32Array<ArrayBufferLike>;
  set position(value: ArrayLike<number>);
  get scale(): Float32Array<ArrayBufferLike>;
  set scale(value: ArrayLike<number>);
  get rotation(): Float32Array<ArrayBufferLike>;
  set rotation(value: ArrayLike<number>);
  get quaternion(): Float32Array<ArrayBufferLike>;
  set quaternion(value: ArrayLike<number>);
  matrix: Float32Array<ArrayBufferLike>;
  matrixWorld: Float32Array<ArrayBufferLike>;
  matrixNeedsUpdate: boolean;
  add(entity: Entity | Entity[]): void;
  remove(entity: Entity): void;
  updateMatrix: () => void;
  destroy(): void;
  markSceneAsDirty(dirtyType: 'lights' | 'renderlist'): void;
};

export type EntityOptions = {
  name?: string;
  type: string;
  visible?: boolean;
  isLight?: boolean;
  position?: Float32Array<ArrayBufferLike>;
  scale?: Float32Array<ArrayBufferLike>;
  rotation?: Float32Array<ArrayBufferLike>;
  quaternion?: Float32Array<ArrayBufferLike>;
};

function createEntity(options: EntityOptions): Entity {
  let entity: Entity;

  const id = crypto.randomUUID();
  const type = options.type;
  const isLight = options.isLight ?? false;

  let name = options.name ?? '';
  let visible = options.visible ?? true;
  let parent: Entity | Scene | null = null;
  let children: Entity[] = [];
  let matrixNeedsUpdate = true;
  let matrixWorld = mat4.create();
  let matrix = mat4.create();

  let _position = options.position ?? vec3.create(0, 0, 0);
  let _scale = options.scale ?? vec3.create(1, 1, 1);
  let _rotation = options.rotation ?? vec3.create(0, 0, 0);
  let _quaternion = options.quaternion ?? quat.create(0, 0, 0, 1);

  function add(childrenToAdd: Entity | Entity[]) {
    if (Array.isArray(childrenToAdd)) {
      childrenToAdd.forEach((child) => {
        children.push(child);
        child.parent = entity;
        if (child.isLight) markSceneAsDirty('lights');
      });
    } else {
      children.push(childrenToAdd);
      childrenToAdd.parent = entity;
      if (childrenToAdd.isLight) markSceneAsDirty('lights');
    }

    markSceneAsDirty('renderlist');
  }

  function remove(childToRemove: Entity) {
    const index = children.findIndex((child) => child.id === childToRemove.id);

    if (index !== -1) {
      children.splice(index, 1);
      markSceneAsDirty('renderlist');
      if (childToRemove.isLight) markSceneAsDirty('lights');
    }

    childToRemove.parent = null;
    childToRemove.destroy();
  }

  function markSceneAsDirty(dirtyType: 'lights' | 'renderlist'): void {
    let currentNode: Entity | Scene | null = entity;

    // Walk back up the scene graph to the Scene and set appropriate dirty flags
    while (currentNode) {
      if ('isScene' in currentNode && currentNode.isScene && 'lightManager' in currentNode) {
        if (dirtyType === 'lights') {
          (currentNode as Scene).lightManager.lightsNeedUpdate = true;
        } else if (dirtyType === 'renderlist') {
          currentNode.renderListNeedsUpdate = true;
        }
        return;
      }

      currentNode = currentNode.parent;
    }
  }

  function updateMatrix() {
    if (!matrixNeedsUpdate) {
      return;
    }

    // Order: Rotation, Scale, Translation
    quat.fromEuler(_rotation[0], _rotation[1], _rotation[2], 'xyz', _quaternion);
    mat4.fromQuat(_quaternion, matrix);
    mat4.scale(matrix, _scale, matrix);
    mat4.setTranslation(matrix, _position, matrix);

    if (parent) {
      mat4.multiply(parent.matrixWorld, matrix, matrixWorld);
    } else {
      mat4.copy(matrix, matrixWorld);
    }

    children.forEach((child) => {
      child.matrixNeedsUpdate = true;
      child.updateMatrix();
    });

    matrixNeedsUpdate = false;

    onMatrixUpdated();
  }

  function onMatrixUpdated(): void {}

  function destroy(): void {}

  entity = {
    id,
    name,
    type,
    visible,
    isLight,
    children,
    parent,
    get position() {
      return _position;
    },
    set position(value) {
      _position.set(value);
      matrixNeedsUpdate = true;
      updateMatrix();
    },
    get rotation() {
      return _rotation;
    },
    set rotation(value) {
      _rotation.set(value);
      matrixNeedsUpdate = true;
      updateMatrix();
    },
    get scale() {
      return _scale;
    },
    set scale(value) {
      _scale.set(value);
      matrixNeedsUpdate = true;
      updateMatrix();
    },
    get quaternion() {
      return _quaternion;
    },
    set quaternion(value) {
      _quaternion.set(value);
      matrixNeedsUpdate = true;
      updateMatrix();
    },
    matrix,
    matrixWorld,
    matrixNeedsUpdate,
    add,
    remove,
    updateMatrix,
    destroy,
    markSceneAsDirty,
  };

  return entity;
}

export { createEntity };
