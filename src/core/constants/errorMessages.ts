const errorMessages = {
  contextRequest: 'Failed to request WebGPU context. Your browser may not support WebGPU or it may be disabled.',
  adapterRequest: 'Failed to request GPU adapter. Your device may not support WebGPU or it may be disabled.',
  deviceRequest: 'Failed to request GPU device. Your device may not support WebGPU or it may be disabled.',
  presentationFormatRequest:
    'Failed to get preferred canvas format. Your browser may not support WebGPU or it may be disabled.',
  missingDevice: 'Renderer device is missing. Ensure the renderer is initialized before calling this method.',
  missingContext: 'WebGPU context is missing. Ensure the renderer is initialized before calling this method.',
  missingPresentationFormat:
    'Presentation format is missing. Ensure the renderer is initialized before calling this method.',
  missingCanvasElement: 'Canvas element is missing. Ensure the renderer is initialized before calling this method.',
  missingPipeline: 'Render pipeline is missing. Ensure the mesh is initialized before rendering.',
  missingCameraBuffer: 'Camera uniform buffer is missing. Ensure the renderer is initialized before rendering.',
  missingCameraBindGroup: 'Camera bind group is missing. Ensure the camera is initialized before rendering.',
  missingCameraBufferLayout: 'Camera buffer layout is missing. Ensure the renderer is initialized before rendering.',
  missingSceneBindGroupLayout:
    'Scene bind group layout is missing. Ensure the renderer is initialized before rendering.',
  missingMaterialBindGroupLayout:
    'Material bind group layout is missing. Ensure the renderer is initialized before rendering.',
  missingEntityBindGroupLayout:
    'Entity bind group layout is missing. Ensure the renderer is initialized before rendering.',
  missingMeshPipelineLayout: 'Mesh pipeline layout is missing. Ensure the renderer is initialized before rendering.',
  missingSceneUniformsBuffer: 'Scene uniforms buffer is missing. Ensure the scene is initialized before rendering.',
};

export { errorMessages };
