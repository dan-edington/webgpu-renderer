import { Entity, IEntity } from '../Entity';

interface ILight extends IEntity {
  intensity: number;
  color: Float32Array;
  range: number;
  isLight: boolean;
}

export type LightOptions = {
  type: string;
  color?: Float32Array;
  intensity?: number;
  range?: number;
};

abstract class Light extends Entity implements ILight {
  intensity: number;
  color: Float32Array;
  range: number;
  isLight: boolean;

  constructor(options: LightOptions) {
    super(options.type);
    this.isLight = true;
    this.intensity = options.intensity ?? 1;
    this.color = options.color ?? new Float32Array([1, 1, 1, 1]);
    this.range = options.range ?? 10;
  }

  protected override onMatrixUpdated() {
    super.onMatrixUpdated();
    this.markSceneAsDirty('lights');
  }
}

export { Light };
