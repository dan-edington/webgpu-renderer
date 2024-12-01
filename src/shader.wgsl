struct MyStruct {
  color: vec4f,
  scale: f32,
}

@group(0) @binding(0) var<uniform> myStruct: MyStruct;

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {

  let pos = array(
    vec2f(0.5, -0.5),
    vec2f(0, 0.5) ,
    vec2f(-0.5, -0.5),
  );

  return vec4f(pos[vertexIndex] * myStruct.scale, 0, 1);
}

@fragment
fn fragment_shader() -> @location(0) vec4f {
  return myStruct.color;
}