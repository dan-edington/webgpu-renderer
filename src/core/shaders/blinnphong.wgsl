// #include "camera"
// #include "scene"
// #include "lights"
// #include "entity"

struct MaterialUniforms {
  materialFlag: u32,
  color: vec4f,
  shininess: f32,
  specularColor: vec3f,
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
  @location(5) cameraPosition: vec3f,
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
  out.cameraPosition = cameraUniforms.worldPosition;

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

  let viewDir = normalize(in.cameraPosition - in.worldPosition);
  var accumulatedDiffuse = vec3f(0);
  var accumulatedSpecular = vec3f(0);

  // Loop through all lights
  for (var i = 0u; i < lightUniforms.count; i = i + 1) {
    // #include "lightFlags"

    if (shouldSkipLight) {
      continue;
    }

    // Light properties
    let lightPos = lightUniforms.positions[i].xyz;
    let lightColor = lightUniforms.colors[i].xyz;
    let lightIntensity = lightUniforms.params[i].x;
    let lightRange = lightUniforms.params[i].y;
    
    // Calculate light direction and distance
    let lightVector = lightPos - in.worldPosition;
    let distance = length(lightVector);
    
    // Skip this light if beyond range
    if (distance > lightRange) {
      continue;
    }
    
    let lightDir = normalize(lightVector);
    let halfwayDir = normalize(lightDir + viewDir);
    
    // Lambert diffuse
    let ndotl = max(0.0, dot(normal, lightDir));
    
    // 1/distance squared falloff
    let distSq = distance * distance;
    let attenuation = 1.0 / max(distSq, 0.01);

    let lightContribution = lightColor * lightIntensity * ndotl * attenuation;
    accumulatedDiffuse = accumulatedDiffuse + lightContribution;
    
    // Specular (Blinn-Phong)
    if (ndotl > 0.0) {
      let ndoth = dot(normal, halfwayDir);
      let shininess = materialUniforms.shininess * 10;
      let specularStrength = pow(max(ndoth, 0.0), shininess);
      let specular = materialUniforms.specularColor * lightColor * lightIntensity * attenuation * specularStrength;
      accumulatedSpecular = accumulatedSpecular + specular;
    }
  }

  let finalColor =  colorRGB * (ambientLight + accumulatedDiffuse) + accumulatedSpecular;
  let outputFragment = vec4f(finalColor, colorA);

  return outputFragment;
}