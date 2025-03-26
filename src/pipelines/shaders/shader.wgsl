struct CameraStruct {
  uResolution: vec2f,
  uCameraPosition: vec3f,
} 

@group(0) @binding(0) var<uniform> camera: CameraStruct;

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {

  let pos = array<vec4f, 6>(
    vec4f(-1, -1, 0, 1),
    vec4f(1, 1, 0, 1),
    vec4f(-1, 1, 0, 1),
    vec4f(1, -1, 0, 1),
    vec4f(1, 1, 0, 1),
    vec4f(-1, -1, 0, 1),
  );

  return pos[vertexIndex];
}

@fragment
fn fragment_shader(
  @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4f {
  return vec4f(fragCoord.xy / camera.uResolution, 0, 1);
}