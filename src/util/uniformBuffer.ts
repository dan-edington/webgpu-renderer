type UniformDataTypeScalar = "f32" | "u32" | "i32" | "f16";

type UniformDataTypeVector =
  | "vec2<f16>"
  | "vec3<f16>"
  | "vec4<f16>"
  | "vec2<i32>"
  | "vec3<i32>"
  | "vec4<i32>"
  | "vec2<u32>"
  | "vec3<u32>"
  | "vec4<u32>"
  | "vec2<f32>"
  | "vec3<f32>"
  | "vec4<f32>";

type UniformDataTypeMatrix =
  | "mat2x2<f16>"
  | "mat2x3<f16>"
  | "mat2x4<f16>"
  | "mat3x2<f16>"
  | "mat3x3<f16>"
  | "mat3x4<f16>"
  | "mat4x2<f16>"
  | "mat4x3<f16>"
  | "mat4x4<f16>"
  | "mat2x2<i32>"
  | "mat2x3<i32>"
  | "mat2x4<i32>"
  | "mat3x2<i32>"
  | "mat3x3<i32>"
  | "mat3x4<i32>"
  | "mat4x2<i32>"
  | "mat4x3<i32>"
  | "mat4x4<i32>"
  | "mat2x2<u32>"
  | "mat2x3<u32>"
  | "mat2x4<u32>"
  | "mat3x2<u32>"
  | "mat3x3<u32>"
  | "mat3x4<u32>"
  | "mat4x2<u32>"
  | "mat4x3<u32>"
  | "mat4x4<u32>"
  | "mat2x2<f32>"
  | "mat2x3<f32>"
  | "mat2x4<f32>"
  | "mat3x2<f32>"
  | "mat3x3<f32>"
  | "mat3x4<f32>"
  | "mat4x2<f32>"
  | "mat4x3<f32>"
  | "mat4x4<f32>";

type UniformDataType = UniformDataTypeScalar | UniformDataTypeVector | UniformDataTypeMatrix;

type UniformValue<T extends UniformDataType> = T extends UniformDataTypeScalar
  ? number
  : T extends UniformDataTypeVector | UniformDataTypeMatrix
  ? number[]
  : never;

interface UniformBufferOptions {
  device: GPUDevice;
  uniforms: Record<string, { type: UniformDataType; value: UniformValue<UniformDataType> }>;
}

type UniformBuffer = {
  uniformBuffer: GPUBuffer;
  values: any;
};

const dataTypeByteSizes: Record<UniformDataType, number> = {
  // Scalars
  f32: 4,
  u32: 4,
  i32: 4,
  f16: 2,
  // Vectors
  "vec2<f16>": 4,
  "vec3<f16>": 6,
  "vec4<f16>": 8,
  "vec2<i32>": 8,
  "vec3<i32>": 12,
  "vec4<i32>": 16,
  "vec2<u32>": 8,
  "vec3<u32>": 12,
  "vec4<u32>": 16,
  "vec2<f32>": 8,
  "vec3<f32>": 12,
  "vec4<f32>": 16,
  // Matrices
  "mat2x2<f16>": 8,
  "mat2x3<f16>": 12,
  "mat2x4<f16>": 16,
  "mat3x2<f16>": 12,
  "mat3x3<f16>": 18,
  "mat3x4<f16>": 24,
  "mat4x2<f16>": 16,
  "mat4x3<f16>": 24,
  "mat4x4<f16>": 32,
  "mat2x2<i32>": 16,
  "mat2x3<i32>": 24,
  "mat2x4<i32>": 32,
  "mat3x2<i32>": 24,
  "mat3x3<i32>": 36,
  "mat3x4<i32>": 48,
  "mat4x2<i32>": 32,
  "mat4x3<i32>": 48,
  "mat4x4<i32>": 64,
  "mat2x2<u32>": 16,
  "mat2x3<u32>": 24,
  "mat2x4<u32>": 32,
  "mat3x2<u32>": 24,
  "mat3x3<u32>": 36,
  "mat3x4<u32>": 48,
  "mat4x2<u32>": 32,
  "mat4x3<u32>": 48,
  "mat4x4<u32>": 64,
  "mat2x2<f32>": 16,
  "mat2x3<f32>": 24,
  "mat2x4<f32>": 32,
  "mat3x2<f32>": 24,
  "mat3x3<f32>": 36,
  "mat3x4<f32>": 48,
  "mat4x2<f32>": 32,
  "mat4x3<f32>": 48,
  "mat4x4<f32>": 64,
};

function createUniformValue(value: number | number[], offset: number) {
  const typedArray = Array.isArray(value) ? new Float32Array(value) : new Float32Array([value]);
  return { offset, typedArray };
}

function alignOffset(offset: number, alignment: number): number {
  return Math.ceil(offset / alignment) * alignment;
}

function calculateBufferSize(
  uniforms: Record<string, { type: UniformDataType; value: UniformValue<UniformDataType> }>
): number {
  let offset = 0;

  for (const key in uniforms) {
    const { type } = uniforms[key];
    const alignment = Math.max(16, dataTypeByteSizes[type]); // Ensure at least 16-byte alignment
    offset = alignOffset(offset, alignment);
    offset += dataTypeByteSizes[type];
  }

  // Align the final buffer size to a multiple of 16 bytes
  return alignOffset(offset, 16);
}

function createUniformBuffer(options: UniformBufferOptions): UniformBuffer {
  const { device, uniforms } = options;

  // Calculate the size of the buffer
  const bufferSize = calculateBufferSize(uniforms);

  // Create an ArrayBuffer for staging
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(arrayBuffer);

  // Store offsets and typed arrays for dynamic updates
  const values: Record<string, { offset: number; typedArray: Float32Array }> = {};

  let offset = 0;

  for (const key in uniforms) {
    const { type, value } = uniforms[key];

    const alignment = Math.max(16, dataTypeByteSizes[type]); // Align to the larger of 16 or type size
    offset = alignOffset(offset, alignment); // Align current offset

    // Write initial values to the ArrayBuffer
    if (Array.isArray(value)) {
      const typedArray = new Float32Array(value); // Assuming `value` is compatible
      new Float32Array(arrayBuffer, offset, typedArray.length).set(typedArray);
    } else {
      dataView.setFloat32(offset, value as number, true); // Assuming scalar value
    }

    // Store the uniform value's offset and typed array for later updates
    values[key] = {
      offset,
      typedArray: new Float32Array(arrayBuffer, offset, Array.isArray(value) ? value.length : 1),
    };

    offset += dataTypeByteSizes[type];
  }

  // Align the buffer size to a multiple of 16 bytes
  const uniformBuffer = device.createBuffer({
    size: alignOffset(bufferSize, 16),
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Write data to GPU buffer
  device.queue.writeBuffer(uniformBuffer, 0, arrayBuffer);

  return {
    uniformBuffer,
    values: new Proxy(values, {
      set(target, key: string, { value }: { value: number | number[] }) {
        const entry = target[key];
        if (!entry) {
          throw new Error(`Uniform ${key} does not exist.`);
        }

        // Update the typed array dynamically
        if (Array.isArray(value)) {
          entry.typedArray.set(value as number[]);
        } else {
          entry.typedArray[0] = value as number;
        }

        // Update GPU buffer
        device.queue.writeBuffer(uniformBuffer, entry.offset, entry.typedArray.buffer);

        return true;
      },
    }),
  };
}

export { createUniformBuffer };
