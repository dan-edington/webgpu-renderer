const postProcessingBindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: { type: 'filtering' },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float', viewDimension: '2d', multisampled: false },
    },
  ],
};

export { postProcessingBindGroupLayoutDescriptor };
