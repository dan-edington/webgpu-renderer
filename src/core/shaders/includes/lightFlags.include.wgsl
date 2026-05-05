let isNotLight = (materialUniforms.materialFlag & (1u << 0u)) != 0u;
let isPointLight = (materialUniforms.materialFlag & (1u << 1u)) != 0u;