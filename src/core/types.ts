import { Geometry } from './Geometry';
import { Renderer } from './Renderer';
import { ShaderMaterial } from './ShaderMaterial';

export interface IEntity {
  id: string;
  name?: string;
  isRenderable: boolean;
  visible: boolean;
  children: IEntity[];
}

export interface IScene {
  children: IEntity[];
  renderList: IEntity[];
  renderListNeedsUpdate: boolean;
  add(entity: IEntity): void;
  updateRenderList(): void;
}

export interface IGeometry {
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
