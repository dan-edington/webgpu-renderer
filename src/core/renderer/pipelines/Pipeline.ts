import type { Geometry } from '../../Geometry';
import type { Material } from '../../materials/Material';
import type { Renderer } from '../Renderer';

type PipelineOptions = {
  renderer: Renderer;
  material: Material;
  geometry: Geometry;
};

interface PipelineClass<TOptions extends PipelineOptions = PipelineOptions> {
  new (...args: unknown[]): Pipeline;
  createPipeline(options: TOptions): GPURenderPipeline;
}

abstract class Pipeline {
  constructor() {}
}

export type { PipelineClass, PipelineOptions };
export { Pipeline };
