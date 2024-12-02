struct MyStruct {
  color: vec4f,
  scale: f32,
  projectionMatrix: mat4x4f,
  viewMatrix: mat4x4f,
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> myStruct: MyStruct;

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {

  let pos = array<vec4f, 3>(
    vec4f(0.5, -0.5, 0, 1),
    vec4f(0, 0.5, 0, 1),
    vec4f(-0.5, -0.5, 0, 1),
  );

  var transformedPos = myStruct.projectionMatrix * myStruct.viewMatrix * myStruct.modelMatrix * pos[vertexIndex];

  return transformedPos; // Return the transformed position
}

@fragment
fn fragment_shader() -> @location(0) vec4f {
  return myStruct.color; // Use the uniform color
}
