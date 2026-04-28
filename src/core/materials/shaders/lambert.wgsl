// #include "camera"
// #include "scene"
// #include "lights"
// #include "entity"

struct MaterialUniforms {
  materialFlag: u32,
  uColor: vec4f,
};

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var alphaTexture: texture_2d<f32>;
@group(2) @binding(2) var normalTexture: texture_2d<f32>;
@group(2) @binding(3) var albedoTexture: texture_2d<f32>;
@group(2) @binding(4) var materialSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) normal: vec3f,
  @location(2) uvs: vec2f,
  @location(3) tangents: vec4f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec2<f32>,
  @location(3) tangents: vec4<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  out.worldPosition = (entityUniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  out.normal = normalize((entityUniforms.modelMatrix * vec4f(normal, 0.0)).xyz);
  out.uvs = uvs;
  out.tangents = tangents;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  // #include "materialFlags"
  // #include "fragmentColorAndAlpha"
  // #include "ambientLight"

  var accumulatedLight = vec3f(0);

  for (var i = 0u; i < lightUniforms.count; i = i + 1) {
    var lightVector = normalize(lightUniforms.positions[i].xyz - in.worldPosition.xyz);
    var lightColor = lightUniforms.params[i].x * lightUniforms.colors[i].xyz * max(0, dot(lightVector, in.normal));
    accumulatedLight = accumulatedLight + lightColor;
  }

  let finalColor = fragmentColor * accumulatedLight + ambientLight;

  let outputFragment = vec4f(finalColor, fragmentAlpha);

  return outputFragment;
}