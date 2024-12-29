struct Ray {
  origin: vec3f,
  direction: vec3f,
};

fn createRay(origin: vec3f, direction: vec3f) -> Ray {
  return Ray(origin, normalize(direction));
}

fn getRayPoint(ray: Ray, t: f32) -> vec3f {
  return ray.origin + t * ray.direction;
}

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
  let ray = createRay(camera.uCameraPosition, rayDirection);

  return vec4f(rayColor(ray), 1);
}

fn hitSphere(center: vec3f, radius: f32, ray: Ray) -> f32 {
    let oc = center - ray.origin;
    let a = length(ray.direction) * length(ray.direction);
    let h = dot(ray.direction, oc);
    let c = length(oc) * length(oc) - radius * radius;
    let discriminant = h * h - a * c;

    if (discriminant < 0){
      return -1;
    } else {
      return -h + sqrt(discriminant) / a;
    }
}

fn rayColor(ray: Ray) -> vec3f {
    let sphereRadius: f32 = 0.5;
    let sphereCenter: vec3f = vec3f(0, 0, -1);

    let t = hitSphere(sphereCenter, sphereRadius, ray);

    if (t > 0) {
        let normal: vec3f = normalize(getRayPoint(ray, t) - vec3f(0, 0, -1));
        return 0.5 * vec3f(normal.x + 1, normal.y + 1, normal.z + 1);
    }

    let direction = normalize(ray.direction);
    let a = 0.5 * (direction.y + 1.0);
    let rayColor =  (1.0 - a) * vec3f(1.0, 1.0, 1.0) + a * vec3f(0.5, 0.7, 1.0);

    return rayColor;
}

