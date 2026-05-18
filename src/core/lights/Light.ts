import { Entity, IEntity } from '../scene/Entity';

export const enum LightFlag {
  None = 0,
  Visible = 1 << 0,
  PointLight = 1 << 1,
  DirectionalLight = 1 << 2,
  SpotLight = 1 << 3,
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
  position?: ArrayLike<number>;
  color?: ArrayLike<number>;
  intensity?: number;
  range?: number;
};

abstract class Light extends Entity implements ILight {
  private _intensity: number;
  private _color: Float32Array;
  private _range: number;
  isLight: boolean;
  flags: LightFlag;

  constructor(options: LightOptions) {
    super(options.type);
    this.isLight = true;
    this._intensity = options.intensity ?? 1;
    this._color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    this._range = options.range ?? 10;
    this.flags = LightFlag.None;
  }

  get intensity(): number {
    return this._intensity;
  }

  set intensity(value: number) {
    if (this._intensity === value) return;
    this._intensity = value;
    this.markSceneAsDirty('lights');
  }

  get color(): Float32Array {
    return this._color;
  }

  set color(value: ArrayLike<number>) {
    if (
      this._color[0] === value[0] &&
      this._color[1] === value[1] &&
      this._color[2] === value[2] &&
      this._color[3] === value[3]
    ) {
      return;
    }

    this._color.set(value);
    this.markSceneAsDirty('lights');
  }

  get range(): number {
    return this._range;
  }

  set range(value: number) {
    if (this._range === value) return;
    this._range = value;
    this.markSceneAsDirty('lights');
  }

  protected override onMatrixUpdated() {
    super.onMatrixUpdated();
    this.markSceneAsDirty('lights');
  }
}

export { Light };
