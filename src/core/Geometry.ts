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
  normals: Float32Array;
  uvs: Float32Array;
  init(renderer: Renderer): void;
}

type GeometryOptions = {
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  normals: Float32Array;
  uvs: Float32Array;
  topology?: GPUPrimitiveTopology;
};

class Geometry implements IGeometry {
  id: uuid;
  name?: string;
  type: string;
  vertices: Float32Array;
  indices: Uint16Array | Uint32Array | undefined;
  normals: Float32Array;
  uvs: Float32Array;
  tangents: Float32Array;
  isIndexed: boolean;
  indexCount: number = 0;
  indexFormat: GPUIndexFormat = 'uint16';
  topology: GPUPrimitiveTopology;
  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;
  normalBuffer: GPUBuffer | null = null;
  tangentBuffer: GPUBuffer | null = null;
  uvBuffer: GPUBuffer | null = null;

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
    this.uvs = padArrayToAlignmentBytes<Float32Array>(options.uvs, { alignmentBytes: 4 }).paddedArray;
    this.tangents = this.generateTangents();
    this.topology = options.topology ?? 'triangle-list';
  }

  init(renderer: Renderer) {
    this.createBuffers(renderer);
  }

  private generateTangents(): Float32Array {
    const vertexCount = this.vertices.length / 3;
    const tAccum = new Float32Array(vertexCount * 3);
    const bAccum = new Float32Array(vertexCount * 3);

    const triCount = this.isIndexed ? this.indexCount / 3 : vertexCount / 3;

    for (let tri = 0; tri < triCount; tri++) {
      let i0: number, i1: number, i2: number;
      if (this.isIndexed && this.indices) {
        i0 = this.indices[tri * 3];
        i1 = this.indices[tri * 3 + 1];
        i2 = this.indices[tri * 3 + 2];
      } else {
        i0 = tri * 3;
        i1 = tri * 3 + 1;
        i2 = tri * 3 + 2;
      }

      const p0x = this.vertices[i0 * 3],
        p0y = this.vertices[i0 * 3 + 1],
        p0z = this.vertices[i0 * 3 + 2];
      const p1x = this.vertices[i1 * 3],
        p1y = this.vertices[i1 * 3 + 1],
        p1z = this.vertices[i1 * 3 + 2];
      const p2x = this.vertices[i2 * 3],
        p2y = this.vertices[i2 * 3 + 1],
        p2z = this.vertices[i2 * 3 + 2];

      const u0 = this.uvs[i0 * 2],
        v0 = this.uvs[i0 * 2 + 1];
      const u1 = this.uvs[i1 * 2],
        v1 = this.uvs[i1 * 2 + 1];
      const u2 = this.uvs[i2 * 2],
        v2 = this.uvs[i2 * 2 + 1];

      const e1x = p1x - p0x,
        e1y = p1y - p0y,
        e1z = p1z - p0z;
      const e2x = p2x - p0x,
        e2y = p2y - p0y,
        e2z = p2z - p0z;

      const du1 = u1 - u0,
        dv1 = v1 - v0;
      const du2 = u2 - u0,
        dv2 = v2 - v0;

      const det = du1 * dv2 - du2 * dv1;
      if (Math.abs(det) < 1e-8) continue;
      const r = 1 / det;

      const tx = (e1x * dv2 - e2x * dv1) * r;
      const ty = (e1y * dv2 - e2y * dv1) * r;
      const tz = (e1z * dv2 - e2z * dv1) * r;

      const bx = (e2x * du1 - e1x * du2) * r;
      const by = (e2y * du1 - e1y * du2) * r;
      const bz = (e2z * du1 - e1z * du2) * r;

      for (const idx of [i0, i1, i2]) {
        tAccum[idx * 3] += tx;
        tAccum[idx * 3 + 1] += ty;
        tAccum[idx * 3 + 2] += tz;
        bAccum[idx * 3] += bx;
        bAccum[idx * 3 + 1] += by;
        bAccum[idx * 3 + 2] += bz;
      }
    }

    const out = new Float32Array(vertexCount * 4);

    for (let i = 0; i < vertexCount; i++) {
      const nx = this.normals[i * 3],
        ny = this.normals[i * 3 + 1],
        nz = this.normals[i * 3 + 2];
      let tx = tAccum[i * 3],
        ty = tAccum[i * 3 + 1],
        tz = tAccum[i * 3 + 2];
      const bx = bAccum[i * 3],
        by = bAccum[i * 3 + 1],
        bz = bAccum[i * 3 + 2];

      // Gram-Schmidt orthogonalize T against N
      const dot = tx * nx + ty * ny + tz * nz;
      tx -= nx * dot;
      ty -= ny * dot;
      tz -= nz * dot;

      const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (len < 1e-8) {
        out[i * 4] = 1;
        out[i * 4 + 1] = 0;
        out[i * 4 + 2] = 0;
        out[i * 4 + 3] = 1;
        continue;
      }
      tx /= len;
      ty /= len;
      tz /= len;

      // Handedness: sign of dot(cross(N, T), B_accum)
      const cx = ny * tz - nz * ty;
      const cy = nz * tx - nx * tz;
      const cz = nx * ty - ny * tx;
      const w = cx * bx + cy * by + cz * bz < 0 ? -1 : 1;

      out[i * 4] = tx;
      out[i * 4 + 1] = ty;
      out[i * 4 + 2] = tz;
      out[i * 4 + 3] = w;
    }

    return out;
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

    this.normalBuffer = renderer.device.createBuffer({
      size: this.normals.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(this.normalBuffer, 0, this.normals.buffer);

    this.uvBuffer = renderer.device.createBuffer({
      size: this.uvs.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(this.uvBuffer, 0, this.uvs.buffer);

    this.tangentBuffer = renderer.device.createBuffer({
      size: this.tangents ? this.tangents.byteLength : 0,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    renderer.device.queue.writeBuffer(this.tangentBuffer, 0, this.tangents.buffer);
  }
}

export { Geometry };
