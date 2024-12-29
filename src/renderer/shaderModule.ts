class ShaderModule {
  #device: GPUDevice;
  #shaderModule: GPUShaderModule;

  constructor(device: GPUDevice, descriptor: GPUShaderModuleDescriptor) {
    this.#device = device;
    this.#shaderModule = this.#device.createShaderModule(descriptor);
  }

  get module() {
    return this.#shaderModule;
  }
}

export { ShaderModule };
