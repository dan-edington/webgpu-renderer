// #include "camera"
// #include "scene"
// #include "entity"

struct MaterialUniforms {
  materialFlag: u32
};

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var normalTexture: texture_2d<f32>;
@group(2) @binding(2) var materialSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) normal: vec3f,
  @location(2) uvs: vec2f,
  @location(3) tangent: vec3f,
  @location(4) bitangent: vec3f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec2<f32>,
  @location(3) tangent: vec4<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  let t = normalize((entityUniforms.modelMatrix * vec4f(tangent.xyz, 0.0)).xyz);
  let n = normalize((entityUniforms.modelMatrix * vec4f(normal, 0.0)).xyz);
  let b = cross(n, t) * tangent.w;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  out.worldPosition = (entityUniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  out.normal = n;
  out.tangent = t;
  out.bitangent = b;
  out.uvs = uvs;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  // #include "materialFlags"
  // #include "normals"

  return vec4f(normal * 0.5 + 0.5, 1.0);
}