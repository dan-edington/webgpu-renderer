var fragmentColor = materialUniforms.color.rgb;
var fragmentAlpha = materialUniforms.color.a;

if (hasAlbedoMap) {
  fragmentColor = textureSample(albedoTexture, materialSampler, in.uvs.xy).rgb;
  fragmentAlpha = 1.0;
}

if (hasAlphaMap) {
  fragmentAlpha = textureSample(alphaTexture, materialSampler, in.uvs.xy).r;
}