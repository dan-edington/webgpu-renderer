import { errorMessages } from './constants/errorMessages';
import { Renderer } from './renderer/Renderer';
import { uuid } from './types';
import { padArrayToAlignmentBytes } from './utilities/padArrayToAlignmentBytes';

interface IGeometry {
  id: uuid;
  name?: string;
  type: string;
  isIndexed: boolean;
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  init(renderer: Renderer): void;
}

type GeometryOptions = {
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  normals: Float32Array;
  topology?: GPUPrimitiveTopology;
};

class Geometry implements IGeometry {
  id: uuid;
  name?: string;
  type: string;
  vertices: Float32Array;
  indices: Uint16Array | Uint32Array | undefined;
  normals: Float32Array;
  isIndexed: boolean;
  indexCount: number = 0;
  indexFormat: GPUIndexFormat = 'uint16';
  topology: GPUPrimitiveTopology;
  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;
  normalBuffer: GPUBuffer | null = null;

  constructor(options: GeometryOptions) {
    this.id = crypto.randomUUID();
    this.type = 'Geometry';
    if (options.indices) {
      this.isIndexed = true;
      const { paddedArray: paddedIndices, unpaddedLength } = padArrayToAlignmentBytes<Uint16Array | Uint32Array>(
        options.indices,
        { alignmentBytes: 4 },
      );
      this.indices = paddedIndices;
      this.indexCount = unpaddedLength;
      this.indexFormat = options.indices instanceof Uint16Array ? 'uint16' : 'uint32';
    } else {
      this.isIndexed = false;
    }

    this.vertices = padArrayToAlignmentBytes<Float32Array>(options.vertices, { alignmentBytes: 4 }).paddedArray;
    this.normals = padArrayToAlignmentBytes<Float32Array>(options.normals, { alignmentBytes: 4 }).paddedArray;
    this.topology = options.topology ?? 'triangle-list';
  }

  init(renderer: Renderer) {
    this.createBuffers(renderer);
  }

  protected createBuffers(renderer: Renderer) {
    if (!renderer.device) throw new Error(errorMessages.missingDevice);

    this.vertexBuffer = renderer.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices.buffer);

    if (this.isIndexed && this.indices) {
      this.indexBuffer = renderer.device.createBuffer({
        size: this.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });

      renderer.device.queue.writeBuffer(this.indexBuffer, 0, this.indices.buffer);
    }

    this.normalBuffer = renderer.device.createBuffer({
      size: this.normals.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(this.normalBuffer, 0, this.normals.buffer);
  }
}

export { Geometry };
