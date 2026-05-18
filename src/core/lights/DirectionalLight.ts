import { Light, LightFlag, LightOptions } from './Light';

type DirectionalLightOptions = Omit<
  LightOptions & {
    direction?: ArrayLike<number>;
  },
  'type'
>;

class DirectionalLight extends Light {
  private _direction: Float32Array;

  constructor(options?: DirectionalLightOptions) {
    const lightOptions: LightOptions = { type: 'DirectionalLight' };
    Object.assign(lightOptions, options);

    super(lightOptions);

    this.flags |= LightFlag.DirectionalLight;
    this._direction = new Float32Array(options?.direction ?? [0, 1, 0]);
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

export { DirectionalLight };
