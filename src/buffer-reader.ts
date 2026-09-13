/**
 * Sequential, forward-only reader over a fixed Buffer.
 * Tracks a current read position and exposes typed read methods that
 * advance it, throwing when a read would run past the end of the buffer.
 */
export class BufferReader {
  protected _position = 0;
  /**
   * The buffer being read from. Exposed directly so callers can inspect or
   * patch its bytes directly (e.g. `buffer.writeUInt32BE(...)` to backpatch
   * a value at an earlier offset) without going through the read cursor.
   */
  buffer: Buffer;

  /**
   * @param buffer - The buffer to read from.
   */
  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  /**
   * Length of the underlying buffer in bytes.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Current read position in the buffer. Settable, like SmartBuffer's
   * `offset` - assigning to it is equivalent to calling `moveTo()`, so the
   * value is clamped to [0, size] rather than accepted as-is.
   */
  get position(): number {
    return this._position;
  }

  /**
   * @param pos - Target position, clamped to [0, size].
   */
  set position(pos: number) {
    this.moveTo(pos);
  }

  /**
   * Reads a signed 8-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 1
   * byte remains at the current position.
   */
  readInt8(): number {
    this._checkReadable(1);
    const val = this.buffer.readInt8(this._position);
    this._position += 1;
    return val;
  }

  /**
   * Reads an unsigned 8-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 1
   * byte remains at the current position.
   */
  readUInt8(): number {
    this._checkReadable(1);
    const val = this.buffer.readUInt8(this._position);
    this._position += 1;
    return val;
  }

  /**
   * Reads a signed, big-endian 16-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 2
   * bytes remain at the current position.
   */
  readInt16BE(): number {
    this._checkReadable(2);
    const val = this.buffer.readInt16BE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads an unsigned, big-endian 16-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 2
   * bytes remain at the current position.
   */
  readUInt16BE(): number {
    this._checkReadable(2);
    const val = this.buffer.readUInt16BE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads a signed, little-endian 16-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 2
   * bytes remain at the current position.
   */
  readInt16LE(): number {
    this._checkReadable(2);
    const val = this.buffer.readInt16LE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads an unsigned, little-endian 16-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 2
   * bytes remain at the current position.
   */
  readUInt16LE(): number {
    this._checkReadable(2);
    const val = this.buffer.readUInt16LE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads a signed, big-endian 32-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 4
   * bytes remain at the current position.
   */
  readInt32BE(): number {
    this._checkReadable(4);
    const val = this.buffer.readInt32BE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads an unsigned, big-endian 32-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 4
   * bytes remain at the current position.
   */
  readUInt32BE(): number {
    this._checkReadable(4);
    const val = this.buffer.readUInt32BE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a signed, little-endian 32-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 4
   * bytes remain at the current position.
   */
  readInt32LE(): number {
    this._checkReadable(4);
    const val = this.buffer.readInt32LE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads an unsigned, little-endian 32-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 4
   * bytes remain at the current position.
   */
  readUInt32LE(): number {
    this._checkReadable(4);
    const val = this.buffer.readUInt32LE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a signed, big-endian 64-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 8
   * bytes remain at the current position.
   */
  readBigInt64BE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigInt64BE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads an unsigned, big-endian 64-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 8
   * bytes remain at the current position.
   */
  readBigUInt64BE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigUInt64BE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads a signed, little-endian 64-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 8
   * bytes remain at the current position.
   */
  readBigInt64LE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigInt64LE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads an unsigned, little-endian 64-bit integer.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 8
   * bytes remain at the current position.
   */
  readBigUInt64LE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigUInt64LE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads a 32-bit, big-endian float.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 4
   * bytes remain at the current position.
   */
  readFloatBE(): number {
    this._checkReadable(4);
    const val = this.buffer.readFloatBE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a 32-bit, little-endian float.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 4
   * bytes remain at the current position.
   */
  readFloatLE(): number {
    this._checkReadable(4);
    const val = this.buffer.readFloatLE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a 64-bit, big-endian double.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 8
   * bytes remain at the current position.
   */
  readDoubleBE(): number {
    this._checkReadable(8);
    const val = this.buffer.readDoubleBE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads a 64-bit, little-endian double.
   *
   * @returns The decoded value.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if fewer than 8
   * bytes remain at the current position.
   */
  readDoubleLE(): number {
    this._checkReadable(8);
    const val = this.buffer.readDoubleLE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads and returns a slice of the buffer, advancing the position past it.
   *
   * @param len - Number of bytes to read. If omitted, reads through the end
   * of the buffer.
   * @returns A `Buffer` view over the read bytes (not a copy).
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if `len` is given
   * and that many bytes aren't available.
   */
  readBytes(len?: number): Buffer {
    if (len) this._checkReadable(len);
    const end = len !== undefined ? this._position + len : this.size;
    const buf = this.buffer.subarray(this._position, end);
    this._position = end;
    return buf;
  }

  /**
   * Reads a fixed-length string, advancing the position past it.
   *
   * @param len - Number of bytes to read. A negative length reads nothing
   * and returns an empty string.
   * @param encoding - Text encoding used to decode the bytes.
   * @returns The decoded string.
   * @throws An error with code 'ERR_BUFFER_OUT_OF_BOUNDS' if `len` is
   * non-negative and that many bytes aren't available.
   */
  readString(len: number, encoding?: BufferEncoding): string {
    if (len < 0) return '';
    this._checkReadable(len);
    const v = this.buffer.toString(
      encoding,
      this._position,
      this._position + len,
    );
    this._position += len;
    return v;
  }

  /**
   * Moves the position by a relative offset, clamped to [0, size].
   *
   * @param n - Number of bytes to move by. Negative values move backward.
   */
  moveBy(n: number): this {
    return this.moveTo(this._position + n);
  }

  /**
   * Moves the position to an absolute offset, clamped to [0, size].
   *
   * @param pos - Target position.
   */
  moveTo(pos: number): this {
    if (pos > this.size) pos = this.size;
    if (pos < 0) pos = 0;
    this._position = pos;
    return this;
  }

  /** Throws if fewer than `size` bytes remain to be read from the current position. */
  private _checkReadable(size: number): void {
    if (this._position + size - 1 >= this.size) {
      const err: any = new Error('Eof in buffer detected');
      err.code = 'ERR_BUFFER_OUT_OF_BOUNDS';
      throw err;
    }
  }
}
