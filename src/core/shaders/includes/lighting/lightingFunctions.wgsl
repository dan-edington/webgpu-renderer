fn calculateAmbientLight(ambientColor: vec3f, ambientIntensity: f32, albedo: vec3f) -> vec3f {
    return ambientColor * ambientIntensity * albedo;
}

fn calculateLighting(material: Material, worldPosition: vec3f, N: vec3f, V: vec3f) -> vec3f {
    var result = vec3f(0.0);

    result += calculateAmbientLight(lightUniforms.ambientLightColor.xyz, lightUniforms.ambientLightIntensity, material.albedo);

    for (var i = 0u; i < lightUniforms.count; i = i + 1) {
        // #include "./lightFlags"
        
        if (!isVisibleLight) {
            continue;
        }

        // Light properties
        let lightPos = lightUniforms.positions[i].xyz;
        let lightColor = lightUniforms.colors[i].xyz;
        let lightIntensity = lightUniforms.params[i].x;
        let lightRange = lightUniforms.params[i].y;

        // Calculate light direction and distance
        let lightVector = lightPos - worldPosition;
        let distance = length(lightVector);
        
        // Skip this light if beyond range
        if (distance > lightRange) {
            continue;
        }

        var L: vec3f;
        var attenuation: f32;

        if(isDirectionalLight) {
            L = normalize(lightUniforms.directions[i].xyz);
            attenuation = 1.0;
        } else {
            L = normalize(lightVector);
            // Caclulate attenuation: 1/distance squared falloff (disabled from directional light)
            let distSq = distance * distance;
            attenuation = 1.0 / max(distSq, 0.01);
        }

        let lightRadiance = lightColor * lightIntensity * attenuation;

        let NdotL = max(dot(N, L), 0.0);

        let brdf = calculateBRDF(material, N, L, V);

        result += lightRadiance * brdf * NdotL;
    }

    return result;
}

