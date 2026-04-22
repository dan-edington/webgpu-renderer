struct CameraUniforms {
  viewProjectionMatrix: mat4x4<f32>,
};

struct MaterialUniforms {
  uColor: vec4f,
};

struct EntityUniforms {
  modelMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> cameraUniforms: CameraUniforms;
@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(3) @binding(0) var<uniform> entityUniforms: EntityUniforms;

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex: u32,
  @location(0) pos: vec3<f32>
) -> @builtin(position) vec4f {

  let position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  return position;
}

@fragment
fn fragment_shader(
  @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4f {

  return materialUniforms.uColor;
}



