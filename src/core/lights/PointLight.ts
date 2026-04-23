import { Light, LightOptions } from './Light';

interface IPointLight {}

type PointLightOptions = {} & LightOptions;

class PointLight extends Light implements IPointLight {
  constructor(options?: PointLightOptions) {
    super(options ?? { type: 'PointLight' });
  }
}

export { PointLight };
