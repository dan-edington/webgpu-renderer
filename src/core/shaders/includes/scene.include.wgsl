struct SceneUniforms {
  ambientLightColor: vec4f,
  ambientLightIntensity: f32,
};

@group(1) @binding(0) var<uniform> sceneUniforms: SceneUniforms;