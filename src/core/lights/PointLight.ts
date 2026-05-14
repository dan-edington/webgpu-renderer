import { Light, LightFlag, LightOptions } from './Light';

type PointLightOptions = LightOptions;

class PointLight extends Light {
  constructor(options?: PointLightOptions) {
    super(options ?? { type: 'PointLight' });
    this.flags |= LightFlag.PointLight;
  }

  destroy() {}
}

export { PointLight };
