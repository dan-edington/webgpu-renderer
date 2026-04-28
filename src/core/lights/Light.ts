import { Entity, IEntity } from '../Entity';

export const enum LightFlag {
  None = 0,
  PointLight = 1 << 0,
}

interface ILight extends IEntity {
  intensity: number;
  color: Float32Array;
  range: number;
  isLight: boolean;
  flags: LightFlag;
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
  flags: LightFlag;

  constructor(options: LightOptions) {
    super(options.type);
    this.isLight = true;
    this.intensity = options.intensity ?? 1;
    this.color = options.color ?? new Float32Array([1, 1, 1, 1]);
    this.range = options.range ?? 10;
    this.flags = LightFlag.None;
  }

  protected override onMatrixUpdated() {
    super.onMatrixUpdated();
    this.markSceneAsDirty('lights');
  }
}

export { Light };
