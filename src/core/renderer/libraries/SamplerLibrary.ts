import { errorMessages } from '../../constants/errorMessages';
import type { SamplerDescriptorKey } from '../../types';

interface SamplerConfig {
  magFilter?: GPUFilterMode;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUMipmapFilterMode;
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  compare?: GPUCompareFunction;
}

class SamplerLibrary {
  private device: GPUDevice | null = null;
  private samplers: Map<SamplerDescriptorKey, GPUSampler> = new Map();

  constructor(device: GPUDevice) {
    this.device = device;
    this.initializeDefaultSamplers();
  }

  private initializeDefaultSamplers() {
    if (!this.device) throw new Error(errorMessages.missingDevice);

    // Linear interpolation, repeat wrapping
    this.createSampler('linearRepeat', {
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });

    // Linear interpolation, clamp wrapping
    this.createSampler('linearClamp', {
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    // Nearest neighbor, repeat wrapping
    this.createSampler('nearestRepeat', {
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });

    // Nearest neighbor, clamp wrapping
    this.createSampler('nearestClamp', {
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
  }

  createSampler(key: SamplerDescriptorKey, config: SamplerConfig): GPUSampler {
    if (!this.device) throw new Error('SamplerLibrary device not initialized');

    if (this.samplers.has(key)) throw new Error(`Sampler with key "${key}" already exists in the library`);

    const sampler = this.device.createSampler({
      magFilter: config.magFilter ?? 'linear',
      minFilter: config.minFilter ?? 'linear',
      mipmapFilter: config.mipmapFilter,
      addressModeU: config.addressModeU ?? 'repeat',
      addressModeV: config.addressModeV ?? 'repeat',
      compare: config.compare,
    });

    this.samplers.set(key, sampler);
    return sampler;
  }

  getSampler(key: SamplerDescriptorKey): GPUSampler | undefined {
    return this.samplers.get(key);
  }
}

export { SamplerLibrary };
