import { Renderer } from './Renderer';
import { IGeometry } from './types';
import { padArrayToAlignmentBytes } from './utilities/padArrayToAlignmentBytes';

type GeometryOptions = {
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  topology?: GPUPrimitiveTopology;
};

class Geometry implements IGeometry {
  vertices: Float32Array;
  indices: Uint16Array | Uint32Array;
  isIndexed: boolean;
  indexCount: number;
  indexFormat: GPUIndexFormat;
  topology: GPUPrimitiveTopology;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;

  constructor(options: GeometryOptions) {
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
    this.topology = options.topology || 'triangle-list';
  }

  init(renderer: Renderer) {
    this.createBuffers(renderer);
  }

  protected createBuffers(renderer: Renderer) {
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
  }
}

export { Geometry };
