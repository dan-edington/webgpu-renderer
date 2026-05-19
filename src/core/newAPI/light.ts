import { LightFlag } from '../lights/Light';
import { createEntity, Entity, EntityOptions } from './entity';

export type Light = Entity & {
  isLight: boolean;
  flags: LightFlag;
  get color();
  set color(value: ArrayLike<number>);
  get intensity();
  set intensity(value: number);
  get range();
  set range(value: number);
};

export type LightOptions = EntityOptions & {
  color?: ArrayLike<number>;
  intensity?: number;
  range?: number;
};

function createLight(options: LightOptions): Light {
  const entity = createEntity({
    ...options,
    type: 'Light',
  });

  const isLight = true;
  const flags = LightFlag.None;

  let _color = new Float32Array(options.color ?? [1, 1, 1, 1]);
  let _intensity = options.intensity ?? 1;
  let _range = options.range ?? 10;

  const lightProperies = {
    isLight,
    flags,
    get intensity(): number {
      return _intensity;
    },
    set intensity(value: number) {
      if (_intensity === value) return;
      _intensity = value;
      entity.markSceneAsDirty('lights');
    },
    get color(): Float32Array {
      return _color;
    },
    set color(value: ArrayLike<number>) {
      if (_color[0] === value[0] && _color[1] === value[1] && _color[2] === value[2] && _color[3] === value[3]) {
        return;
      }

      _color.set(value);
      entity.markSceneAsDirty('lights');
    },
    get range(): number {
      return _range;
    },
    set range(value: number) {
      if (_range === value) return;
      _range = value;
      entity.markSceneAsDirty('lights');
    },
  };

  const light: Light = Object.assign(entity, lightProperies);

  return light;
}

export { createLight };
