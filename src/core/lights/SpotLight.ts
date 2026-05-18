import { Light, LightFlag, LightOptions } from './Light';

type SpotLightLightOptions = Omit<
  LightOptions & {
    direction?: ArrayLike<number>;
    angle?: number;
    penumbra?: number;
  },
  'type'
>;

class SpotLight extends Light {
  private _direction: Float32Array;
  private _angle: number;
  private _penumbra: number;

  constructor(options?: SpotLightLightOptions) {
    const lightOptions: LightOptions = { type: 'SpotLight' };
    Object.assign(lightOptions, options);

    super(lightOptions);

    this.flags |= LightFlag.SpotLight;
    this._direction = new Float32Array(options?.direction ?? [0, 1, 0]);
    this._angle = options?.angle ?? Math.PI / 5;
    this._penumbra = options?.penumbra ?? 0.2;
  }

  get angle() {
    return this._angle;
  }

  set angle(value: number) {
    this._angle = value;
    this.markSceneAsDirty('lights');
  }

  get penumbra() {
    return this._penumbra;
  }

  set penumbra(value: number) {
    this._penumbra = Math.max(0, Math.min(1, value));
    this.markSceneAsDirty('lights');
  }

  get direction() {
    return this._direction;
  }

  set direction(direction: ArrayLike<number>) {
    this._direction.set(direction);
    this.markSceneAsDirty('lights');
  }

  destroy() {}
}

export { SpotLight };
