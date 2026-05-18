import { Light, LightFlag, LightOptions } from './Light';

type PointLightOptions = Omit<LightOptions, 'type'>;

class PointLight extends Light {
  constructor(options?: PointLightOptions) {
    const lightOptions: LightOptions = { type: 'PointLight' };
    Object.assign(lightOptions, options);
    super(lightOptions);

    this.flags |= LightFlag.PointLight;
  }

  destroy() {}
}

export { PointLight };
