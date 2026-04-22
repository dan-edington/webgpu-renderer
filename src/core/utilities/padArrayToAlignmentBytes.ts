import { BigIntTypedArray, NumericTypedArray } from '../types';

function padArrayToAlignmentBytes<T>(
  arrayToPad: NumericTypedArray,
  options?: { alignmentBytes?: number; padWith?: number },
): { paddedArray: T; unpaddedLength: number };
function padArrayToAlignmentBytes<T>(
  arrayToPad: BigIntTypedArray,
  options?: { alignmentBytes?: number; padWith?: bigint },
): { paddedArray: T; unpaddedLength: number };
function padArrayToAlignmentBytes<T>(arrayToPad: any, options: any = {}): any {
  const { alignmentBytes = 4 } = options;
  let padWith = options.padWith;

  if (padWith === undefined) {
    if (arrayToPad instanceof BigInt64Array || arrayToPad instanceof BigUint64Array) {
      padWith = 0n;
    } else {
      padWith = 0;
    }
  }
  const unpaddedLength = arrayToPad.length;
  let bytesPerElement: number;

  if (arrayToPad instanceof Int8Array || arrayToPad instanceof Uint8Array || arrayToPad instanceof Uint8ClampedArray) {
    bytesPerElement = 1;
  } else if (arrayToPad instanceof Int16Array || arrayToPad instanceof Uint16Array) {
    bytesPerElement = 2;
  } else if (
    arrayToPad instanceof Int32Array ||
    arrayToPad instanceof Uint32Array ||
    arrayToPad instanceof Float32Array
  ) {
    bytesPerElement = 4;
  } else if (
    arrayToPad instanceof Float64Array ||
    arrayToPad instanceof BigInt64Array ||
    arrayToPad instanceof BigUint64Array
  ) {
    bytesPerElement = 8;
  } else {
    throw new Error('Unsupported array type');
  }

  const totalBytes = unpaddedLength * bytesPerElement;
  const isAligned = totalBytes % alignmentBytes === 0;

  if (isAligned) {
    return { paddedArray: arrayToPad as T, unpaddedLength };
  } else {
    const paddingBytes = alignmentBytes - (totalBytes % alignmentBytes);
    const paddingElements = Math.ceil(paddingBytes / bytesPerElement);
    const paddedLength = unpaddedLength + paddingElements;

    let paddedArray;

    if (arrayToPad instanceof Int8Array) {
      paddedArray = new Int8Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Uint8Array) {
      paddedArray = new Uint8Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Uint8ClampedArray) {
      paddedArray = new Uint8ClampedArray(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Int16Array) {
      paddedArray = new Int16Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Uint16Array) {
      paddedArray = new Uint16Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Int32Array) {
      paddedArray = new Int32Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Uint32Array) {
      paddedArray = new Uint32Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Float32Array) {
      paddedArray = new Float32Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof Float64Array) {
      paddedArray = new Float64Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof BigInt64Array) {
      paddedArray = new BigInt64Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    } else if (arrayToPad instanceof BigUint64Array) {
      paddedArray = new BigUint64Array(paddedLength).fill(padWith);
      paddedArray.set(arrayToPad);
    }

    return { paddedArray, unpaddedLength };
  }
}

export { padArrayToAlignmentBytes };
