import type { PipelineClass } from '../pipelines/Pipeline';
import type { OpaquePipelineOptions } from '../pipelines/OpaquePipeline';
import type { AlphaPipelineOptions } from '../pipelines/AlphaPipeline';
import type { PostProcessingPipelineOptions } from '../pipelines/PostProcessingPipeline';

type PipelineOptionsMap = {
  opaque: OpaquePipelineOptions;
  alpha: AlphaPipelineOptions;
  postprocessing: PostProcessingPipelineOptions;
};

type PipelineKey = keyof PipelineOptionsMap;
type RegisteredPipelineClass = {
  [K in PipelineKey]: PipelineClass<PipelineOptionsMap[K]>;
};

interface IPipelineLibrary {
  pipelines: Map<PipelineKey, RegisteredPipelineClass[PipelineKey]>;
}

class PipelineLibrary implements IPipelineLibrary {
  pipelines: Map<PipelineKey, RegisteredPipelineClass[PipelineKey]>;

  constructor() {
    this.pipelines = new Map();
  }

  registerPipeline<K extends PipelineKey>(key: K, pipeline: RegisteredPipelineClass[K]) {
    this.pipelines.set(key, pipeline);
  }

  getPipeline<K extends PipelineKey>(key: K): RegisteredPipelineClass[K] | null {
    return (this.pipelines.get(key) as RegisteredPipelineClass[K] | undefined) || null;
  }
}

export { PipelineLibrary };
