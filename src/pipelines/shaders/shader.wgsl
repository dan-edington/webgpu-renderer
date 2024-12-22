struct CameraStruct {
  uResolution: vec2f,
  uCameraPosition: vec3f,
} 

@group(0) @binding(0) var<uniform> camera: CameraStruct;


@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {

  let pos = array<vec4f, 6>(
    vec4f(-1, -1, 0, 1),
    vec4f(1, 1, 0, 1),
    vec4f(-1, 1, 0, 1),
    vec4f(1, -1, 0, 1),
    vec4f(1, 1, 0, 1),
    vec4f(-1, -1, 0, 1),
  );

  return pos[vertexIndex];
}

@fragment
fn fragment_shader(
  @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4f {
  let focalLength: f32 = 1.0;
  let aspectRatio: f32 = camera.uResolution.x / camera.uResolution.y;

  let ndc: vec3f = vec3f(
    fragCoord.x / camera.uResolution.x * 2.0 - 1.0,
    (fragCoord.y / camera.uResolution.y * 2.0 - 1.0) / aspectRatio,
    focalLength
  );

  let rayDirection: vec3f = vec3f(ndc - camera.uCameraPosition);

  return vec4f(rayColor(rayDirection), 0);
  
}

fn hitSphere(center: vec3f, radius: f32, ray: vec3f) -> bool{
    let oc = ray - center;
    let a = dot(ray, ray);
    let b = 2.0 * dot(oc, ray);
    let c = dot(oc, oc) - radius * radius;
    let discriminant = b * b - 4 * a * c;
    return discriminant > 0.0;
}

fn rayColor(rayDirection: vec3f) -> vec3f {

    if (hitSphere(vec3f(0, 0, -1), 0.5, rayDirection)){
        return vec3f(1.0, 0.0, 0.0);
    }

    let direction = normalize(rayDirection);
    let a = 0.5 * (direction.y + 1.0);
    let rayColor =  (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);

    return rayColor;
}
