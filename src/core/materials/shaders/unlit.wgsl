// #include "camera"
// #include "scene"
// #include "lights"
// #include "entity"

struct MaterialUniforms {
  uColor: vec4f,
};

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var alphaTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uvs: vec3f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec3<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  out.uvs = uvs;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  return materialUniforms.uColor;
}