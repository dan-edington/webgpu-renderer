struct LightUniforms {
  count: u32,
  positions: array<vec4f, 64>,
  colors: array<vec4f, 64>,
  directions: array<vec4f, 64>,
  spotlightAngles: array<vec2f, 64>,
  params: array<vec4f, 64>,
  lightFlags: array<u32, 64>,
  ambientLightColor: vec4f,
  ambientLightIntensity: f32,
}

@group(1) @binding(1) var<storage, read> lightUniforms: LightUniforms;