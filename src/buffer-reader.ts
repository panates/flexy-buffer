export class BufferReader {
  protected _position = 0;
  buffer: Buffer;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  get size(): number {
    return this.buffer.length;
  }

  get position(): number {
    return this._position;
  }

  /**
   * Reads a signed 8-bit integer
   */
  readInt8(): number {
    this._checkReadable(1);
    const val = this.buffer.readInt8(this._position);
    this._position += 1;
    return val;
  }

  /**
   * Reads an unsigned 8-bit integer
   */
  readUInt8(): number {
    this._checkReadable(1);
    const val = this.buffer.readUInt8(this._position);
    this._position += 1;
    return val;
  }

  /**
   * Reads a signed, big-endian 16-bit integer
   */
  readInt16BE(): number {
    this._checkReadable(2);
    const val = this.buffer.readInt16BE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads an unsigned, big-endian 16-bit integer
   */
  readUInt16BE(): number {
    this._checkReadable(2);
    const val = this.buffer.readUInt16BE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads a signed, little-endian 16-bit integer
   */
  readInt16LE(): number {
    this._checkReadable(2);
    const val = this.buffer.readInt16LE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads an unsigned, little-endian 16-bit integer
   */
  readUInt16LE(): number {
    this._checkReadable(2);
    const val = this.buffer.readUInt16LE(this._position);
    this._position += 2;
    return val;
  }

  /**
   * Reads a signed, big-endian 32-bit integer
   */
  readInt32BE(): number {
    this._checkReadable(4);
    const val = this.buffer.readInt32BE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads an unsigned, big-endian 32-bit integer
   */
  readUInt32BE(): number {
    this._checkReadable(4);
    const val = this.buffer.readUInt32BE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a signed, little-endian 32-bit integer
   */
  readInt32LE(): number {
    this._checkReadable(4);
    const val = this.buffer.readInt32LE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads an unsigned, little-endian 32-bit integer
   */
  readUInt32LE(): number {
    this._checkReadable(4);
    const val = this.buffer.readUInt32LE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a signed, big-endian 64-bit integer
   */
  readBigInt64BE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigInt64BE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads an unsigned, big-endian 64-bit integer
   */
  readBigUInt64BE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigUInt64BE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads a signed, little-endian 64-bit integer
   */
  readBigInt64LE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigInt64LE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads an unsigned, little-endian 64-bit integer
   */
  readBigUInt64LE(): BigInt {
    this._checkReadable(8);
    const val = this.buffer.readBigUInt64LE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads a 32-bit, big-endian float
   */
  readFloatBE(): number {
    this._checkReadable(4);
    const val = this.buffer.readFloatBE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a 32-bit, little-endian float
   */
  readFloatLE(): number {
    this._checkReadable(4);
    const val = this.buffer.readFloatLE(this._position);
    this._position += 4;
    return val;
  }

  /**
   * Reads a 64-bit, little-endian double
   */
  readDoubleBE(): number {
    this._checkReadable(8);
    const val = this.buffer.readDoubleBE(this._position);
    this._position += 8;
    return val;
  }

  /**
   * Reads a 64-bit, big-endian double
   */
  readDoubleLE(): number {
    this._checkReadable(8);
    const val = this.buffer.readDoubleLE(this._position);
    this._position += 8;
    return val;
  }

  readBytes(len?: number): Buffer {
    if (len) this._checkReadable(len);
    const end = len !== undefined ? this._position + len : this.size;
    const buf = this.buffer.subarray(this._position, end);
    this._position = end;
    return buf;
  }

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

  moveBy(n: number): this {
    return this.moveTo(this._position + n);
  }

  moveTo(pos: number): this {
    if (pos > this.size) pos = this.size;
    if (pos < 0) pos = 0;
    this._position = pos;
    return this;
  }

  private _checkReadable(size: number): void {
    if (this._position + size - 1 >= this.size) {
      const err: any = new Error('Eof in buffer detected');
      err.code = 'ERR_BUFFER_OUT_OF_BOUNDS';
      throw err;
    }
  }
}
