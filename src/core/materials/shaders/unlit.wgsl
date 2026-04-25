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
  @location(0) worldPosition: vec3f,
  @location(1) normal: vec3f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>
) -> @builtin(position) vec4f {

  return cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
}

@fragment
fn fragment_shader(
  @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4f {

  return materialUniforms.uColor;
}