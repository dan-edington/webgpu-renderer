var colorRGB = materialUniforms.color.rgb;
var colorA = materialUniforms.color.a;

if (hasAlbedoMap) {
  colorRGB = textureSample(albedoTexture, materialSampler, in.uvs.xy).rgb;
  colorA = 1.0;
}

if (hasAlphaMap) {
  colorA = textureSample(alphaTexture, materialSampler, in.uvs.xy).r;
}