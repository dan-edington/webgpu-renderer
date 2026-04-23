import { vec4, Vec4 } from 'wgpu-matrix';
import { Entity, IEntity } from '../Entity';

interface ILight extends IEntity {
  intensity: number;
  color: Vec4;
  range: number;
  isLight: boolean;
}

export type LightOptions = {
  type: string;
  color?: Vec4;
  intensity?: number;
  range?: number;
};

class Light extends Entity implements ILight {
  intensity: number;
  color: Vec4;
  range: number;
  isLight: boolean;

  constructor(options: LightOptions) {
    super(options.type);
    this.isLight = true;
    this.intensity = options.intensity ?? 1;
    this.color = options.color ?? vec4.create(1, 1, 1, 1);
    this.range = options.range ?? 10;
  }

  protected override onMatrixUpdated() {
    super.onMatrixUpdated();
    this.markSceneAsDirty('lights');
  }
}

export { Light };
