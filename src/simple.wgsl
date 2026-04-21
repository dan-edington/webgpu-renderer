struct MeshUniforms {
  uColor: vec4f,
};

@group(2) @binding(0) var<uniform> meshUniforms: MeshUniforms;

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) pos: vec3<f32>
) -> @builtin(position) vec4f {

  return vec4f(pos, 1);
}

@fragment
fn fragment_shader(
  @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4f {

  return meshUniforms.uColor;
}



