const shaderIncludes: Record<string, string> = import.meta.glob('../../materials/shaders/includes/*.wgsl', {
  query: 'raw',
  eager: true,
});
const shaders: Record<string, string> = import.meta.glob('../../materials/shaders/*.wgsl', {
  query: 'raw',
  eager: true,
});

const INCLUDE_REGEX = /^\s*\/\/\s*#include\s*(['"])([a-z0-9/]+)\1\s*$/gm;

class ShaderLibrary {
  private shaders: Map<string, string>;
  private includeCache: Map<string, string>;

  constructor() {
    this.shaders = new Map();
    this.includeCache = new Map();
    this.generateIncludeCache();
    this.generateShaders();
  }

  private generateIncludeCache() {
    const basePath = '../../materials/shaders/includes/';

    for (const key in shaderIncludes) {
      const includeContent = shaderIncludes[key];
      const includeName = key.replace(basePath, '').replace('.include.wgsl', '');
      this.includeCache.set(includeName, includeContent);
    }
  }

  private resolveIncludes(source: string): string {
    return source.replace(INCLUDE_REGEX, (_match, _quote, includeName: string) => {
      const includeContent = this.includeCache.get(includeName);
      if (!includeContent) console.warn(`Missing shader include: ${includeName}`);
      return includeContent ?? '';
    });
  }

  private generateShaders() {
    const basePath = '../../materials/shaders/';

    for (const key in shaders) {
      const shaderName = key.replace(basePath, '').replace('.wgsl', '');
      const shaderContent = shaders[key];
      const resolvedShaderContent = this.resolveIncludes(shaderContent);
      this.shaders.set(shaderName, resolvedShaderContent);
    }
  }

  getShader(shaderName: string) {
    return this.shaders.get(shaderName);
  }
}

export { ShaderLibrary };
