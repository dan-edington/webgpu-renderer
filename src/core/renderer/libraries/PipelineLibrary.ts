import type { PipelineClass } from '../pipelines/Pipeline';

interface IPipelineLibrary {
  pipelines: Map<string, PipelineClass>;
}

class PipelineLibrary implements IPipelineLibrary {
  pipelines: Map<string, PipelineClass>;

  constructor() {
    this.pipelines = new Map();
  }

  registerPipeline(key: string, pipeline: PipelineClass) {
    this.pipelines.set(key, pipeline);
  }

  getPipeline(key: string): PipelineClass | null {
    return this.pipelines.get(key) || null;
  }
}

export { PipelineLibrary };
