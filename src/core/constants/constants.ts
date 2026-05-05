const constants = {
  bindGroupIndices: {
    CAMERA: 0,
    SCENE: 1,
    MATERIAL: 2,
    ENTITY: 3,
  },
  MAX_LIGHTS: 64,
  INTERNAL_COLOR_FORMAT: 'rgba16float' as GPUTextureFormat,
} as const;

export { constants };
