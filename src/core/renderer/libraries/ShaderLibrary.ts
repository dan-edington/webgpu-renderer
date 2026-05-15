import { uuid } from '../../types';
import type { Renderer } from '../Renderer';

const shaderIncludes: Record<string, string> = import.meta.glob('../../shaders/includes/**/*.wgsl', {
  query: '?raw',
  eager: true,
  import: 'default',
});
const shaders: Record<string, string> = import.meta.glob('../../shaders/*.wgsl', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const INCLUDE_REGEX = /^\s*\/\/\s*#include\s*(['"])([^'"\r\n]+)\1\s*$/gm;

type CachedShader = {
  code: string;
  shaderModule: GPUShaderModule;
};

type IncludeStack = string[];

class ShaderLibrary {
  private readonly rendererInstance: Renderer;
  private readonly shaderCache: Map<string, CachedShader>;
  private readonly includeCache: Map<string, string>;

  constructor(rendererInstance: Renderer) {
    this.rendererInstance = rendererInstance;
    this.shaderCache = new Map();
    this.includeCache = new Map();
    this.buildIncludeCache();
    this.buildShaderCache();
  }

  private buildIncludeCache() {
    const basePath = '../../shaders/includes/';

    for (const key in shaderIncludes) {
      const includeContent = shaderIncludes[key];
      const includePath = this.normalizePath(`includes/${key.replace(basePath, '')}`);
      this.includeCache.set(includePath, includeContent);
    }
  }

  private normalizePath(path: string): string {
    const segments = path.replace(/\\/g, '/').split('/');
    const normalizedSegments: string[] = [];

    for (const segment of segments) {
      if (!segment || segment === '.') continue;

      if (segment === '..') {
        if (normalizedSegments.length > 0) normalizedSegments.pop();
        continue;
      }

      normalizedSegments.push(segment);
    }

    return normalizedSegments.join('/');
  }

  private getDirectoryPath(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const lastSlashIndex = normalizedPath.lastIndexOf('/');

    if (lastSlashIndex === -1) return '';

    return normalizedPath.slice(0, lastSlashIndex);
  }

  private normalizeIncludeRequest(includePath: string, sourcePath: string): string {
    const normalizedRequest = includePath.trim().replace(/\\/g, '/');
    const includePathWithExtension = normalizedRequest.endsWith('.wgsl')
      ? normalizedRequest
      : `${normalizedRequest}.wgsl`;

    if (includePathWithExtension.startsWith('./') || includePathWithExtension.startsWith('../')) {
      const directoryPath = this.getDirectoryPath(sourcePath);
      return this.normalizePath(`${directoryPath}/${includePathWithExtension}`);
    }

    if (includePathWithExtension.startsWith('/')) {
      return this.normalizePath(includePathWithExtension.slice(1));
    }

    if (includePathWithExtension.startsWith('includes/')) {
      return this.normalizePath(includePathWithExtension);
    }

    return this.normalizePath(`includes/${includePathWithExtension}`);
  }

  private resolveInclude(includePath: string, sourcePath: string, includeStack: IncludeStack): string {
    const resolvedIncludePath = this.normalizeIncludeRequest(includePath, sourcePath);
    const includeContent = this.includeCache.get(resolvedIncludePath);

    if (!includeContent) {
      console.warn(`Missing shader include: ${includePath} from ${sourcePath}`);
      return '';
    }

    if (includeStack.includes(resolvedIncludePath)) {
      console.warn(`Circular shader include detected: ${[...includeStack, resolvedIncludePath].join(' -> ')}`);
      return '';
    }

    return this.resolveIncludes(includeContent, resolvedIncludePath, [...includeStack, resolvedIncludePath]);
  }

  private resolveIncludes(source: string, sourcePath: string, includeStack: IncludeStack = []): string {
    return source.replace(INCLUDE_REGEX, (_match, _quote, includePath: string) => {
      return this.resolveInclude(includePath, sourcePath, includeStack);
    });
  }

  private buildShaderCache() {
    const basePath = '../../shaders/';

    for (const key in shaders) {
      const shaderName = key.replace(basePath, '').replace('.wgsl', '');
      const shaderPath = key.replace(basePath, '');
      const shaderContent = shaders[key];
      const resolvedShaderContent = this.resolveIncludes(shaderContent, shaderPath);
      const shaderModule = this.rendererInstance.device.createShaderModule({
        label: `ShaderModule_${shaderName}`,
        code: resolvedShaderContent,
      });

      this.shaderCache.set(shaderName, {
        code: resolvedShaderContent,
        shaderModule,
      });
    }
  }

  buildCustomShader(options: { shader: string; id: uuid; label?: string }): string {
    const { shader, id, label } = options;

    if (this.shaderCache.has(id)) return id;

    const finalShader = `
      // #include "./includes/uniforms/cameraUniforms"
      // #include "./includes/uniforms/sceneUniforms"
      // #include "./includes/uniforms/lightUniforms"
      // #include "./includes/uniforms/entityUniforms"
      
      ${shader}
    `;

    const resolvedShader = this.resolveIncludes(finalShader, '__custom__.wgsl');
    const shaderModule = this.rendererInstance.device.createShaderModule({
      label: `ShaderModule_${label ?? `custom_${id}`}`,
      code: resolvedShader,
    });

    this.shaderCache.set(id, {
      code: resolvedShader,
      shaderModule,
    });

    return id;
  }

  getShader(shaderName: string) {
    return this.shaderCache.get(shaderName);
  }
}

export { ShaderLibrary };
