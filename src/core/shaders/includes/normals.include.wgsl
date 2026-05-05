var normal = normalize(in.normal);

if (hasNormalMap) {
  let T = normalize(in.tangent);
  let B = normalize(in.bitangent);
  let tbn = mat3x3f(T, B, normal);
  let normalMapSample = textureSample(normalTexture, materialSampler, in.uvs).rgb;
  let normalMapNormal = normalMapSample * 2.0 - 1.0;
  normal = normalize(tbn * normalMapNormal);
}