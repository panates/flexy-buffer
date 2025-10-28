import { BufferReader } from './buffer-reader.js';

export interface FlexBufferConfig {
  minPages?: number;
  pageSize?: number;
  maxLength?: number;
  houseKeepMs?: number;
}

export class FlexyBuffer extends BufferReader {
  static DEFAULT_PAGE_SIZE = 4096;
  static DEFAULT_HOUSE_KEEP_MS = 5000;
  static DEFAULT_MAX_SIZE = 1024 * 1024 * 10; // 10 MB;

  private _houseKeepMs: number;
  private _houseKeepTimer?: NodeJS.Timeout;
  private _length = 0;
  readonly minPages: number;
  readonly pageSize: number;
  readonly maxSize: number;

  constructor(cfg?: FlexBufferConfig) {
    super(null as any);
    this._length = 0;
    this.pageSize = cfg?.pageSize || FlexyBuffer.DEFAULT_PAGE_SIZE;
    this.minPages = Math.max(cfg?.minPages || 1, 1);
    this.maxSize = cfg?.maxLength || FlexyBuffer.DEFAULT_MAX_SIZE;
    this._houseKeepMs = cfg?.houseKeepMs || FlexyBuffer.DEFAULT_HOUSE_KEEP_MS;
    this.buffer = Buffer.allocUnsafe(this.pageSize * this.minPages);
  }

  get houseKeepMs(): number {
    return this._houseKeepMs;
  }

  set houseKeepMs(value: number) {
    this._houseKeepMs = value;
    if (this._houseKeepTimer) this._startHouseKeepTimer();
  }

  get capacity(): number {
    return this.buffer.length;
  }

  get size(): number {
    return this._length;
  }

  get eof(): boolean {
    return this._position >= this.size;
  }

  growSize(len: number): this {
    return this.setSize(this.size + len);
  }

  setSize(len: number): this {
    const newPages = Math.ceil(len / this.pageSize);
    const maxPages = Math.ceil(this.maxSize / this.pageSize);
    if (newPages > maxPages) {
      const err: any = new Error('Buffer limit exceeded.');
      err.code = 'EBUFFLIMIT';
      throw err;
    }
    const curPages = Math.ceil(this.capacity / this.pageSize);
    if (newPages > curPages) {
      const newCapacity = this.pageSize * newPages;
      const newBuffer = Buffer.allocUnsafe(newCapacity);
      this.buffer.copy(newBuffer);
      this.buffer = newBuffer;
      this._startHouseKeepTimer(true);
    } else this._startHouseKeepTimer();
    this._length = len;
    if (this._position > len) this._position = len;
    return this;
  }

  toBuffer(): Buffer {
    return this.buffer.subarray(0, this.size);
  }

  reset(shrinkCapacity?: boolean): void {
    this._length = 0;
    this._position = 0;
    if (shrinkCapacity) {
      this._houseKeep();
    }
  }

  fill(value = 0, len = 1): this {
    this._ensureSize(len);
    this.buffer.fill(value, this._position, this._position + len);
    this._position += len;
    return this;
  }

  insertBytes(buffer: Buffer | number[]): number {
    const actual = buffer.length - Math.min(this.size - this._position, 0);
    if (actual > 0) this.growSize(actual);
    // Shift bytes
    if (this._position < this.size)
      this.buffer.copyWithin(this._position + buffer.length, this._position);
    this.writeBytes(buffer);
    return actual;
  }

  delete(deleteCount: number): number {
    const actual = Math.min(
      deleteCount,
      Math.max(this.size - this._position, 0),
    );
    if (!actual) return actual;
    this.buffer.copyWithin(this._position, this._position + actual);
    if (actual > 0) this.setSize(this.size - actual);
    return actual;
  }

  writeInt8(n: number): this {
    this._ensureSize(1);
    this.buffer.writeInt8(n, this._position);
    this._position++;
    return this;
  }

  writeUInt8(n: number): number {
    this._ensureSize(1);
    const actual = this.buffer.writeUInt8(n, this._position);
    this._position += actual;
    return actual;
  }

  writeInt16BE(n: number): number {
    this._ensureSize(2);
    const actual = this.buffer.writeInt16BE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeUInt16BE(n: number): number {
    this._ensureSize(2);
    const actual = this.buffer.writeUInt16BE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeInt16LE(n: number): number {
    this._ensureSize(2);
    const actual = this.buffer.writeInt16LE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeUInt16LE(n: number): number {
    this._ensureSize(2);
    const actual = this.buffer.writeUInt16LE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeInt32BE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeInt32BE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeUInt32BE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeUInt32BE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeInt32LE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeInt32LE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeUInt32LE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeUInt32LE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeBigInt64BE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual = this.buffer.writeBigInt64BE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeBigUInt64BE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual = this.buffer.writeBigUInt64BE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeBigInt64LE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual = this.buffer.writeBigInt64LE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeBigUInt64LE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual = this.buffer.writeBigUInt64LE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeFloatBE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeFloatBE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeFloatLE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeFloatLE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeDoubleBE(n: number): number {
    this._ensureSize(8);
    const actual = this.buffer.writeDoubleBE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeDoubleLE(n: number): number {
    this._ensureSize(8);
    const actual = this.buffer.writeDoubleLE(n, this._position);
    this._position += actual;
    return actual;
  }

  writeBytes(buffer: Buffer | number[]): number {
    this._ensureSize(buffer.length);
    if (Array.isArray(buffer)) {
      Buffer.from(buffer).copy(this.buffer, this._position, 0, buffer.length);
    } else buffer.copy(this.buffer, this._position, 0, buffer.length);
    this._position += buffer.length;
    return buffer.length;
  }

  writeString(str: string, encoding?: BufferEncoding): number {
    if (str) {
      const len = Buffer.byteLength(str, encoding);
      this._ensureSize(len);
      const actual = this.buffer.write(str, this._position, encoding);
      this._position += actual;
      return actual;
    }
    return 0;
  }

  protected _startHouseKeepTimer(resetTimer?: boolean) {
    if (!resetTimer && this._houseKeepTimer) return;
    clearTimeout(this._houseKeepTimer);
    this._houseKeepTimer = setTimeout(() => {
      this._houseKeepTimer = undefined;
      this._houseKeep();
    }, this._houseKeepMs).unref();
  }

  protected _ensureSize(len: number): this {
    const n = this._position + len - this.size;
    if (n > 0) this.growSize(n);
    return this;
  }

  protected _houseKeep(): void {
    this.setSize(0);
    clearTimeout(this._houseKeepTimer);
    this._houseKeepTimer = undefined;
    const curPages = Math.ceil(this.capacity / this.pageSize);
    const needPages = Math.max(
      this.minPages,
      Math.ceil(this.size / this.pageSize),
    );
    if (needPages < curPages) {
      const newBuffer = Buffer.allocUnsafe(this.pageSize * needPages);
      if (this.size) this.buffer.copy(newBuffer, 0, 0, this.size);
      this.buffer = newBuffer;
    }
  }
}
