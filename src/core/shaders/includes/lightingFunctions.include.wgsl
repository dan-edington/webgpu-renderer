fn calculateAmbientLight(ambientColor: vec3f, ambientIntensity: f32, albedo: vec3f) -> vec3f {
    return ambientColor * ambientIntensity * albedo;
}