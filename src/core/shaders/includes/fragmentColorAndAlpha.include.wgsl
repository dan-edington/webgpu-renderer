var fragmentColor = materialUniforms.uColor.rgb;
var fragmentAlpha = materialUniforms.uColor.a;

if (hasAlbedoMap) {
  fragmentColor = textureSample(albedoTexture, materialSampler, in.uvs.xy).rgb;
  fragmentAlpha = 1.0;
}

if (hasAlphaMap) {
  fragmentAlpha = textureSample(alphaTexture, materialSampler, in.uvs.xy).r;
}