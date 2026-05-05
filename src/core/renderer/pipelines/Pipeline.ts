import type { Renderer } from '../Renderer';

export type PipelineOptions = {
  renderer: Renderer;
};

export interface PipelineClass<TOptions extends PipelineOptions = PipelineOptions> {
  new (...args: unknown[]): Pipeline;
  createPipeline(options: TOptions): GPURenderPipeline;
}

abstract class Pipeline {
  constructor() {}
}

export { Pipeline };
