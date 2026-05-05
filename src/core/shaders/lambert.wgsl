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

  var accumulatedLight = ambientLight;
  let n = normalize(in.normal);

  // Loop through all lights
  for (var i = 0u; i < lightUniforms.count; i = i + 1) {
    // Light properties
    let lightPos = lightUniforms.positions[i].xyz;
    let lightColor = lightUniforms.colors[i].xyz;
    let lightIntensity = lightUniforms.params[i].x;
    
    // Calculate light direction and distance
    let lightVector = lightPos - in.worldPosition;
    let distance = length(lightVector);
    let lightDir = normalize(lightVector);
    
    // Lambert diffuse
    let diffuse = max(0.0, dot(lightDir, n));
    
    // 1/distance² falloff
    let distSq = distance * distance;
    let attenuation = 1.0 / max(distSq, 0.01);
    
    // Accumulate contribution
    let contribution = lightColor * lightIntensity * diffuse * attenuation;
    accumulatedLight = accumulatedLight + contribution;
  }

  let finalColor = fragmentColor * accumulatedLight;
  let outputFragment = vec4f(finalColor, fragmentAlpha);

  return outputFragment;
}