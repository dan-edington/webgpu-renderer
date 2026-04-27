// #include "camera"
// #include "scene"
// #include "entity"

struct MaterialUniforms {
  uColor: vec4f,
};

@group(2) @binding(0) var normalTexture: texture_2d<f32>;
@group(2) @binding(1) var materialSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(1) normal: vec3f,
  @location(2) uvs: vec3f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec3<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  out.normal = normalize((entityUniforms.modelMatrix * vec4f(normal, 0.0)).xyz);
  out.uvs = uvs; 

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  return vec4f(in.normal * 0.5 + 0.5, 1.0);
}