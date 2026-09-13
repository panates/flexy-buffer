import { BufferReader } from './buffer-reader.js';

export interface FlexBufferConfig {
  /** Minimum number of pages to keep allocated, even when idle. Default: 1 */
  minPages?: number;
  /** Size of each page in bytes; capacity always grows/shrinks in multiples of this. Default: 4096 */
  pageSize?: number;
  /** Maximum data size in bytes; growing past this throws with code 'EBUFFLIMIT'. Default: 10 MB */
  maxLength?: number;
  /** Milliseconds of inactivity after a grow or flush before capacity is reclaimed. Default: 5000 */
  houseKeepMs?: number;
}

/**
 * An auto-growing, page-based buffer built on top of BufferReader.
 *
 * Capacity grows in `pageSize` increments as data is written, up to
 * `maxLength`, and is reclaimed back down to `minPages` after `houseKeepMs`
 * of inactivity.
 */
export class FlexyBuffer extends BufferReader {
  /** Default page size in bytes. */
  static DEFAULT_PAGE_SIZE = 4096;
  /** Default housekeeping idle interval in milliseconds. */
  static DEFAULT_HOUSE_KEEP_MS = 5000;
  /** Default maximum data size in bytes (10 MB). */
  static DEFAULT_MAX_SIZE = 1024 * 1024 * 10; // 10 MB;

  private _houseKeepMs: number;
  private _houseKeepTimer?: NodeJS.Timeout;
  private _length = 0;
  /** Minimum number of pages kept allocated, even when idle. */
  readonly minPages: number;
  /** Size of each page in bytes. */
  readonly pageSize: number;
  /** Maximum data size in bytes. */
  readonly maxSize: number;

  /**
   * @param cfg - Optional configuration.
   */
  constructor(cfg?: FlexBufferConfig) {
    super(null as any);
    this._length = 0;
    this.pageSize = cfg?.pageSize || FlexyBuffer.DEFAULT_PAGE_SIZE;
    this.minPages = Math.max(cfg?.minPages || 1, 1);
    this.maxSize = cfg?.maxLength || FlexyBuffer.DEFAULT_MAX_SIZE;
    this._houseKeepMs = cfg?.houseKeepMs || FlexyBuffer.DEFAULT_HOUSE_KEEP_MS;
    this.buffer = Buffer.allocUnsafe(this.pageSize * this.minPages);
  }

  /**
   * Milliseconds of inactivity after a grow or flush before capacity is
   * reclaimed. Setting it re-arms a pending housekeeping timer.
   */
  get houseKeepMs(): number {
    return this._houseKeepMs;
  }

  /**
   * @param value - New idle interval in milliseconds.
   */
  set houseKeepMs(value: number) {
    this._houseKeepMs = value;
    if (this._houseKeepTimer) this._startHouseKeepTimer();
  }

  /**
   * Current allocated capacity of the internal buffer, in bytes.
   */
  get capacity(): number {
    return this.buffer.length;
  }

  /**
   * Length of the valid, written data in bytes (as opposed to `capacity`,
   * the allocated buffer size).
   */
  get size(): number {
    return this._length;
  }

  /**
   * Whether the current position has reached the end of the valid data.
   */
  get eof(): boolean {
    return this._position >= this.size;
  }

  /**
   * Grows the valid data size by `len` bytes, allocating more capacity if
   * needed.
   *
   * @param len - Number of bytes to grow by.
   * @throws An error with code 'EBUFFLIMIT' if the new size exceeds `maxSize`.
   */
  growSize(len: number): this {
    return this.setSize(this.size + len);
  }

  /**
   * Sets the valid data size to `len`, allocating more capacity if needed.
   * Growth is rounded up to whole pages; shrinking only updates the
   * reported size and does not reallocate (see `_houseKeep`).
   *
   * @param len - New data size in bytes.
   * @throws An error with code 'EBUFFLIMIT' if `len` exceeds `maxSize`.
   */
  setSize(len: number): this {
    if (len > this.maxSize) {
      const err: any = new Error('Buffer limit exceeded.');
      err.code = 'EBUFFLIMIT';
      throw err;
    }
    const newPages = Math.ceil(len / this.pageSize);
    const curPages = Math.ceil(this.capacity / this.pageSize);
    if (newPages > curPages) {
      const newCapacity = Math.min(this.pageSize * newPages, this.maxSize);
      const newBuffer = Buffer.allocUnsafe(newCapacity);
      this.buffer.copy(newBuffer);
      this.buffer = newBuffer;
      this._startHouseKeepTimer(true);
    } else this._startHouseKeepTimer();
    this._length = len;
    if (this._position > len) this._position = len;
    return this;
  }

  /**
   * Returns a view of the internal buffer containing only the valid data
   * (0 to size). Does not copy and does not reset the buffer - see `flush`
   * for a version that does.
   */
  toBuffer(): Buffer {
    return this.buffer.subarray(0, this.size);
  }

  /**
   * Resets the buffer to an empty state, without cancelling a pending
   * housekeeping timer - see `start` for a version that does.
   *
   * @param shrinkCapacity - If true, immediately reclaims capacity down to
   * `minPages` instead of waiting for the housekeeping timer.
   */
  reset(shrinkCapacity?: boolean): void {
    this._length = 0;
    this._position = 0;
    if (shrinkCapacity) {
      this._houseKeep();
    }
  }

  /**
   * Resets position and size to 0 and cancels any pending housekeeping
   * timer. Use before writing a new message into a reused buffer.
   */
  start(): this {
    this._position = 0;
    this._length = 0;
    if (this._houseKeepTimer) {
      clearTimeout(this._houseKeepTimer);
      this._houseKeepTimer = undefined;
    }
    return this;
  }

  /**
   * Returns the valid data (0 to size), then resets the buffer for reuse.
   * When `copy` is false, the result is a view into the internal buffer -
   * only safe if it is consumed before the next write, since reuse
   * overwrites the same memory.
   *
   * Only (re)arms the housekeeping timer if capacity has actually grown
   * past its baseline (`minPages` pages) - a buffer that never grew has
   * nothing to reclaim, so repeated flushes of small messages don't pay
   * for a clearTimeout/setTimeout pair each time.
   *
   * @param copy - If true (default), returns a new Buffer copy. If false,
   * returns a view into the internal buffer.
   */
  flush(copy = true): Buffer {
    const out = copy
      ? Buffer.from(this.buffer.subarray(0, this.size))
      : this.buffer.subarray(0, this.size);
    this._length = 0;
    this._position = 0;
    if (this.capacity > this.pageSize * this.minPages) {
      this._startHouseKeepTimer(true);
    } else if (this._houseKeepTimer) {
      clearTimeout(this._houseKeepTimer);
      this._houseKeepTimer = undefined;
    }
    return out;
  }

  /**
   * Fills `len` bytes at the current position with `value`, advancing the
   * position past them.
   *
   * @param value - Byte value to fill with.
   * @param len - Number of bytes to fill.
   */
  fill(value = 0, len = 1): this {
    this._ensureSize(len);
    this.buffer.fill(value, this._position, this._position + len);
    this._position += len;
    return this;
  }

  /**
   * Inserts bytes at the current position, shifting existing data at and
   * after the position forward to make room. Position ends up just past
   * the inserted bytes.
   *
   * @param buffer - Bytes to insert.
   * @returns The number of bytes inserted (always `buffer.length`; `size`
   * grows by the same amount).
   */
  insertBytes(buffer: Buffer | number[]): number {
    const actual = buffer.length - Math.min(this.size - this._position, 0);
    if (actual > 0) this.growSize(actual);
    // Shift bytes
    if (this._position < this.size)
      this.buffer.copyWithin(this._position + buffer.length, this._position);
    this.writeBytes(buffer);
    return actual;
  }

  /**
   * Deletes up to `deleteCount` bytes starting at the current position,
   * shifting the remaining data backward. Position is left unchanged.
   *
   * @param deleteCount - Number of bytes to delete.
   * @returns The number of bytes actually deleted (capped by the amount of
   * data left after the position).
   */
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

  /**
   * Writes a signed 8-bit integer at the current position, growing the
   * buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeInt8(n: number): number {
    this._ensureSize(1);
    const actual = this.buffer.writeInt8(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned 8-bit integer at the current position, growing the
   * buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeUInt8(n: number): number {
    this._ensureSize(1);
    const actual = this.buffer.writeUInt8(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a signed, big-endian 16-bit integer at the current position,
   * growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeInt16BE(n: number): number {
    this._ensureSize(2);
    const actual = this.buffer.writeInt16BE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned, big-endian 16-bit integer at the current position,
   * growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeUInt16BE(n: number): number {
    this._ensureSize(2);
    const actual =
      this.buffer.writeUInt16BE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a signed, little-endian 16-bit integer at the current position,
   * growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeInt16LE(n: number): number {
    this._ensureSize(2);
    const actual = this.buffer.writeInt16LE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned, little-endian 16-bit integer at the current
   * position, growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeUInt16LE(n: number): number {
    this._ensureSize(2);
    const actual =
      this.buffer.writeUInt16LE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a signed, big-endian 32-bit integer at the current position,
   * growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeInt32BE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeInt32BE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned, big-endian 32-bit integer at the current position,
   * growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeUInt32BE(n: number): number {
    this._ensureSize(4);
    const actual =
      this.buffer.writeUInt32BE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a signed, little-endian 32-bit integer at the current position,
   * growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeInt32LE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeInt32LE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned, little-endian 32-bit integer at the current
   * position, growing the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeUInt32LE(n: number): number {
    this._ensureSize(4);
    const actual =
      this.buffer.writeUInt32LE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a signed, big-endian 64-bit integer at the current position,
   * growing the buffer if needed. A plain number is converted to bigint.
   *
   * @returns The number of bytes written.
   */
  writeBigInt64BE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual =
      this.buffer.writeBigInt64BE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned, big-endian 64-bit integer at the current position,
   * growing the buffer if needed. A plain number is converted to bigint.
   *
   * @returns The number of bytes written.
   */
  writeBigUInt64BE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual =
      this.buffer.writeBigUInt64BE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a signed, little-endian 64-bit integer at the current position,
   * growing the buffer if needed. A plain number is converted to bigint.
   *
   * @returns The number of bytes written.
   */
  writeBigInt64LE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual =
      this.buffer.writeBigInt64LE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes an unsigned, little-endian 64-bit integer at the current
   * position, growing the buffer if needed. A plain number is converted to
   * bigint.
   *
   * @returns The number of bytes written.
   */
  writeBigUInt64LE(n: bigint | number): number {
    n = typeof n === 'bigint' ? n : BigInt(n);
    this._ensureSize(8);
    const actual =
      this.buffer.writeBigUInt64LE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a 32-bit, big-endian float at the current position, growing
   * the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeFloatBE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeFloatBE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a 32-bit, little-endian float at the current position, growing
   * the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeFloatLE(n: number): number {
    this._ensureSize(4);
    const actual = this.buffer.writeFloatLE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a 64-bit, big-endian double at the current position, growing
   * the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeDoubleBE(n: number): number {
    this._ensureSize(8);
    const actual =
      this.buffer.writeDoubleBE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes a 64-bit, little-endian double at the current position, growing
   * the buffer if needed.
   *
   * @returns The number of bytes written.
   */
  writeDoubleLE(n: number): number {
    this._ensureSize(8);
    const actual =
      this.buffer.writeDoubleLE(n, this._position) - this._position;
    this._position += actual;
    return actual;
  }

  /**
   * Writes raw bytes at the current position, growing the buffer if
   * needed.
   *
   * @param buffer - Bytes to write, as a Buffer or plain array of byte
   * values.
   * @returns The number of bytes written.
   */
  writeBytes(buffer: Buffer | number[]): number {
    this._ensureSize(buffer.length);
    if (Array.isArray(buffer)) {
      Buffer.from(buffer).copy(this.buffer, this._position, 0, buffer.length);
    } else buffer.copy(this.buffer, this._position, 0, buffer.length);
    this._position += buffer.length;
    return buffer.length;
  }

  /**
   * Writes a string at the current position, growing the buffer if needed.
   * Writing an empty/falsy string is a no-op.
   *
   * @param str - String to write.
   * @param encoding - Text encoding used to encode the string.
   * @returns The number of bytes written.
   */
  writeString(str: string, encoding?: BufferEncoding): number {
    if (str) {
      const len = Buffer.byteLength(str, encoding);
      this._ensureSize(len);
      // Unlike the numeric write* methods, Buffer#write() already returns
      // the number of bytes written (not offset + bytes written).
      const actual = this.buffer.write(str, this._position, encoding);
      this._position += actual;
      return actual;
    }
    return 0;
  }

  /**
   * (Re)arms the deferred housekeeping timer that reclaims unused capacity
   * after `houseKeepMs` of inactivity.
   *
   * @param resetTimer - If true, cancels and reschedules an already-armed
   * timer. If false/omitted, leaves an already-armed timer alone.
   */
  protected _startHouseKeepTimer(resetTimer?: boolean) {
    if (!resetTimer && this._houseKeepTimer) return;
    clearTimeout(this._houseKeepTimer);
    this._houseKeepTimer = setTimeout(() => {
      this._houseKeepTimer = undefined;
      this._houseKeep();
    }, this._houseKeepMs).unref();
  }

  /** Grows the buffer, if needed, so that `len` more bytes can be written at the current position. */
  protected _ensureSize(len: number): this {
    const n = this._position + len - this.size;
    if (n > 0) this.growSize(n);
    return this;
  }

  /**
   * Reclaims unused capacity: resets the buffer to empty, then shrinks the
   * internal buffer down to `minPages` (or the current size, if larger)
   * when that is smaller than the current capacity.
   */
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
