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
  // #include "fragmentColorAndAlpha"
  // #include "normals"
  // #include "ambientLight"

  var accumulatedLight = ambientLight;

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
    let diffuse = max(0.0, dot(lightDir, normal));
    
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