let isVisibleLight = (lightUniforms.lightFlags[i] & (1u << 0u)) != 0u;
let isPointLight = (lightUniforms.lightFlags[i] & (1u << 1u)) != 0u;
let shouldSkipLight = !isVisibleLight || !isPointLight;