import type { PipelineClass } from '../pipelines/Pipeline';
import type { OpaquePipelineOptions } from '../pipelines/OpaquePipeline';
import type { AlphaPipelineOptions } from '../pipelines/AlphaPipeline';
import type { PostProcessingPipelineOptions } from '../pipelines/PostProcessingPipeline';
import { Renderer } from '../Renderer';
import { Material } from '../../materials/Material';
import { Geometry } from '../../Geometry';

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
  pipelineContructors: Map<PipelineKey, RegisteredPipelineClass[PipelineKey]>;
}

class PipelineLibrary implements IPipelineLibrary {
  pipelineContructors: Map<PipelineKey, RegisteredPipelineClass[PipelineKey]>;
  pipelineCache: Map<string, GPURenderPipeline>;

  constructor() {
    this.pipelineContructors = new Map();
    this.pipelineCache = new Map();
  }

  registerPipelineConstructor<K extends PipelineKey>(key: K, pipeline: RegisteredPipelineClass[K]) {
    this.pipelineContructors.set(key, pipeline);
  }

  getPipelineContructor<K extends PipelineKey>(key: K): RegisteredPipelineClass[K] | null {
    return (this.pipelineContructors.get(key) as RegisteredPipelineClass[K] | undefined) || null;
  }

  getOrCreatePipeline<K extends PipelineKey>(
    key: K,
    material: Material,
    geometry: Geometry,
    renderer: Renderer,
  ): GPURenderPipeline {
    const cacheKey = `${key}_${material.type}_${geometry.topology}`;
    let pipeline = this.pipelineCache.get(cacheKey);

    if (pipeline) {
      return pipeline;
    }

    const PipelineConstructor = this.getPipelineContructor(key);

    if (!PipelineConstructor) {
      throw new Error(`Pipeline constructor for key '${key}' not found.`);
    }

    pipeline = PipelineConstructor.createPipeline({
      renderer,
      material,
      geometry,
    });

    this.pipelineCache.set(cacheKey, pipeline);

    return pipeline;
  }
}

export { PipelineLibrary };
