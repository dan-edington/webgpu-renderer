struct LightUniforms {
  count: u32,
  positions: array<vec4f, 64>,
  colors: array<vec4f, 64>,
  params: array<vec4f, 64>,
}

@group(1) @binding(1) var<storage, read> lightUniforms: LightUniforms;