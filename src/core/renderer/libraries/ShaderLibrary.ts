import { uuid } from '../../types';
import type { Renderer } from '../Renderer';

const shaderIncludes: Record<string, string> = import.meta.glob('../../shaders/includes/*.wgsl', {
  query: '?raw',
  eager: true,
  import: 'default',
});
const shaders: Record<string, string> = import.meta.glob('../../shaders/*.wgsl', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const INCLUDE_REGEX = /^\s*\/\/\s*#include\s*(['"])([a-zA-Z0-9/]+)\1\s*$/gm;

type CachedShader = {
  code: string;
  shaderModule: GPUShaderModule;
};

class ShaderLibrary {
  rendererInstance: Renderer;
  private shaderCache: Map<string, CachedShader>;
  private includeCache: Map<string, string>;

  constructor(renderer: Renderer) {
    this.rendererInstance = renderer;
    this.shaderCache = new Map();
    this.includeCache = new Map();
    this.buildIncludeCache();
    this.buildShaderCache();
  }

  private buildIncludeCache() {
    const basePath = '../../shaders/includes/';

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

  private buildShaderCache() {
    const basePath = '../../shaders/';

    for (const key in shaders) {
      const shaderName = key.replace(basePath, '').replace('.wgsl', '');
      const shaderContent = shaders[key];
      const resolvedShaderContent = this.resolveIncludes(shaderContent);
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
      // #include "camera"
      // #include "scene"
      // #include "lights"
      // #include "entity"
      
      ${shader}
    `;

    const resolvedShader = this.resolveIncludes(finalShader);
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
