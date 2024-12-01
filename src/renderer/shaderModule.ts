function createShaderModule(device: GPUDevice) {
  return function (descriptor: GPUShaderModuleDescriptor) {
    const shaderModule = device.createShaderModule(descriptor);

    return shaderModule;
  };
}

export { createShaderModule };
