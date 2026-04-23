struct CameraUniforms {
  viewProjectionMatrix: mat4x4<f32>,
};

struct SceneUniforms {
  ambientLightColor: vec4f,
  ambientLightIntensity: f32,
};

struct LightUniforms {
  count: u32,
  positions: array<vec4f, 64>,
  colors: array<vec4f, 64>,
  params: array<vec4f, 64>,
}

struct MaterialUniforms {
  uColor: vec4f,
};

struct EntityUniforms {
  modelMatrix: mat4x4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) normal: vec3f,
};

@group(0) @binding(0) var<uniform> cameraUniforms: CameraUniforms;

@group(1) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(1) var<storage, read> lightUniforms: LightUniforms;

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var albedoTexture: texture_2d<f32>;
@group(2) @binding(2) var normalTexture: texture_2d<f32>;
@group(2) @binding(3) var materialSampler: sampler;

@group(3) @binding(0) var<uniform> entityUniforms: EntityUniforms;

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  out.worldPosition = (entityUniforms.modelMatrix * vec4f(pos, 1.0)).xyz;
  out.normal = normalize((entityUniforms.modelMatrix * vec4f(normal, 0.0)).xyz);

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  var accumulatedLight = vec4f(0.0);

  for (var i = 0u; i < lightUniforms.count; i = i + 1) {
    var lightVector = normalize(lightUniforms.positions[i].xyz - in.worldPosition);
    var color = lightUniforms.params[i].x * lightUniforms.colors[i].xyz * max(0, dot(lightVector, in.normal));
    accumulatedLight = accumulatedLight + vec4f(color, 1.0);
  }

  var ambientLight = sceneUniforms.ambientLightIntensity * sceneUniforms.ambientLightColor;
  var finalColor = materialUniforms.uColor * accumulatedLight + ambientLight;

  return finalColor;
}