const errorMessages = {
  contextRequest: 'Failed to request a WebGPU context. Ensure WebGPU is supported and enabled in this browser.',
  adapterRequest: 'Failed to request a GPU adapter. Ensure WebGPU is supported and enabled on this device.',
  deviceRequest: 'Failed to request a GPU device. Ensure WebGPU is supported and enabled on this device.',
  presentationFormatRequest:
    'Failed to get the preferred canvas format. Ensure WebGPU is supported and enabled in this browser.',
  missingDevice: 'Renderer device is missing. Ensure the renderer is initialized before calling this method.',
  missingContext: 'WebGPU context is missing. Ensure the renderer is initialized before calling this method.',
  missingCanvasElement: 'Canvas element is missing. Ensure the renderer is initialized before calling this method.',
  missingRendererInstance:
    'Renderer instance is missing. Ensure the renderer is initialized before calling this method.',
  missingPipeline: 'Render pipeline is missing. Ensure the mesh is initialized before rendering.',
  missingCameraBuffer:
    'Camera uniform buffer is missing. Ensure the renderer is initialized before creating camera bind groups.',
  missingCameraBufferLayout:
    'Camera buffer layout is missing. Ensure the renderer is initialized before creating camera bind groups.',
  missingSceneBindGroupLayout:
    'Scene bind group layout is missing. Ensure the renderer is initialized before creating scene bind groups.',
  missingEntityBindGroupLayout:
    'Entity bind group layout is missing. Ensure the renderer is initialized before creating entity bind groups.',
  missingRendererMaterialBindGroupLayouts:
    'Renderer material bind group layouts are missing. Ensure the renderer is initialized before creating material bind groups.',
  missingMaterialTypeBindGroupLayout:
    'Material bind group layout for this material type is missing. Ensure the renderer registers a bind group layout for this material type before creating the material bind group.',
  missingSceneUniformsBuffer: 'Scene uniforms buffer is missing. Ensure the scene is initialized before rendering.',
  missingMaterialShaderModule:
    'Material shader module is missing. Ensure the material is initialized before creating a render pipeline.',
  missingLightUniformsBuffer: 'Light uniforms buffer is missing. Ensure the scene is initialized before rendering.',
  missingDepthTexture: 'Depth texture is missing. Ensure the renderer is initialized before rendering.',
  missingShaderLibrary: 'Shader library is missing. Ensure the renderer is initialized before creating shader modules.',
  missingPassManager: 'Pass manager is missing. Ensure the renderer is initialized before rendering.',
  missingPass: 'Requested pass is missing. Ensure the pass is registered with the pass manager before rendering.',
  missingPassScene: 'Pass manager scene is missing. Ensure a scene is set before running a pass.',
  missingPassCamera: 'Pass manager camera is missing. Ensure a camera is set before running a pass.',
  missingTextureLibraryDeviceOrQueue:
    'Texture library device or queue is missing. Ensure the renderer is initialized before creating textures.',
  missingTextureLibraryFallbacks:
    'Fallback textures are missing. Ensure the texture library initializes fallback textures before requesting fallback textures.',
  missingSamplerLibraryDevice:
    'Sampler library device is missing. Ensure the renderer is initialized before creating samplers.',
  missingShaderCode:
    'Could not find shader code for material. Ensure the shader name is correct and the shader is included in the shader library.',
};

export { errorMessages };
