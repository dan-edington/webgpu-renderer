import { Mat4, Quat, Vec3, Vec4 } from 'wgpu-matrix';
import { Geometry } from './Geometry';
import { Renderer } from './Renderer';
import { ShaderMaterial } from './ShaderMaterial';

export interface IEntity {
  id: string;
  name?: string;
  type: string;
  isRenderable: boolean;
  visible: boolean;
  children: IEntity[];
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  quaternion: Quat;
  matrix: Mat4;
  add(entity: IEntity): void;
  remove(entity: IEntity): void;
}

export interface IScene {
  type: string;
  children: IEntity[];
  renderList: IEntity[];
  renderListNeedsUpdate: boolean;
  clearColor: GPUColor;
  add(entity: IEntity): void;
  updateRenderList(): void;
  setClearColor(color: GPUColor | [number, number, number, number] | Vec4): void;
}

export interface IGeometry {
  type: string;
  isIndexed: boolean;
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
}

export interface IMesh extends IEntity {
  geometry: Geometry;
  material: ShaderMaterial;
  isInitialized: boolean;
  init(renderer: Renderer): void;
}

export interface IShaderMaterial {}
