import { Light, LightFlag, LightOptions } from './Light';

interface IPointLight {}

type PointLightOptions = {} & LightOptions;

class PointLight extends Light implements IPointLight {
  constructor(options?: PointLightOptions) {
    super(options ?? { type: 'PointLight' });
    this.flags |= LightFlag.PointLight;
  }
}

export { PointLight };
