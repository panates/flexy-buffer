import { expect } from 'expect';
import { FlexyBuffer } from 'flexy-buffer';

describe('FlexyBuffer', () => {
  it('should construct', () => {
    const buf = new FlexyBuffer();
    expect(Buffer.isBuffer(buf.buffer)).toBeTruthy();
    expect(buf.capacity).toEqual(FlexyBuffer.DEFAULT_PAGE_SIZE);
    expect(buf.maxSize).toEqual(FlexyBuffer.DEFAULT_MAX_SIZE);
    expect(buf.houseKeepMs).toEqual(FlexyBuffer.DEFAULT_HOUSE_KEEP_MS);
  });

  it('should construct with pageSize', () => {
    const buf = new FlexyBuffer({
      pageSize: 1024,
    });
    expect(Buffer.isBuffer(buf.buffer)).toBeTruthy();
    expect(buf.capacity).toEqual(1024);
  });

  it('should construct with pageSize', () => {
    const buf = new FlexyBuffer({
      minPages: 5,
      pageSize: 1024,
    });
    expect(Buffer.isBuffer(buf.buffer)).toBeTruthy();
    expect(buf.capacity).toEqual(1024 * 5);
  });

  it('should grow size', () => {
    const buf = new FlexyBuffer({ pageSize: 100 });
    buf.growSize(90);
    expect(buf.capacity).toEqual(100);
    buf.growSize(90);
    expect(buf.capacity).toEqual(200);
  });

  it('should automatically grow when writing a string beyond capacity', () => {
    const buf = new FlexyBuffer({ pageSize: 16 });
    expect(buf.capacity).toEqual(16);
    buf.writeString('1234567890');
    expect(buf.capacity).toEqual(16);
    buf.writeString('1234567890'.repeat(10));
    expect(buf.capacity).toEqual(112);
  });

  it('should refuse to grow past its configured maxLength', () => {
    const buf = new FlexyBuffer({ pageSize: 4, maxLength: 4 });
    buf.writeInt32BE(1);
    expect(() => buf.writeInt32BE(2)).toThrow(/Buffer limit exceeded/);
  });

  it('should enforce maxLength at the exact byte, not rounded up to the page size', () => {
    // pageSize 4 would otherwise round the limit up to 8 bytes of capacity -
    // maxLength must still cut off at the exact byte.
    const buf = new FlexyBuffer({ pageSize: 4, maxLength: 6 });
    buf.writeBytes([1, 2, 3, 4, 5, 6]);
    expect(buf.size).toEqual(6);
    expect(() => buf.writeBytes([7])).toThrow(/Buffer limit exceeded/);
  });

  it('should shrink size after house keep timer', done => {
    const buf = new FlexyBuffer({ pageSize: 100, houseKeepMs: 10 });
    buf.growSize(150);
    expect(buf.capacity).toEqual(200);
    setTimeout(() => {
      try {
        expect(buf.capacity).toEqual(100);
        done();
      } catch (e) {
        done(e);
      }
    }, 20);
  });

  it('should write bytes', () => {
    const buf = new FlexyBuffer();
    buf.writeBytes([1, 2, 3, 4, 5]);
    expect(buf.buffer.subarray(0, 5)).toEqual(Buffer.from([1, 2, 3, 4, 5]));
  });

  it('should insert bytes', () => {
    const buf: FlexyBuffer = new FlexyBuffer({ pageSize: 5 });
    buf.writeBytes([1, 2, 3, 4, 5]);
    expect(buf.buffer.subarray(0, 5)).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    buf.moveTo(2);
    buf.insertBytes([6, 7, 8]);
    expect(buf.size).toEqual(8);
    expect(buf.buffer.subarray(0, buf.size)).toEqual(
      Buffer.from([1, 2, 6, 7, 8, 3, 4, 5]),
    );
    buf.moveTo(buf.size - 2);
    buf.insertBytes([9, 10, 11]);
    expect(buf.size).toEqual(11);
    expect(buf.buffer.subarray(0, buf.size)).toEqual(
      Buffer.from([1, 2, 6, 7, 8, 3, 9, 10, 11, 4, 5]),
    );
    buf.moveTo(buf.size);
    buf.insertBytes([12, 13, 14]);
    expect(buf.size).toEqual(14);
    expect(buf.buffer.subarray(0, buf.size)).toEqual(
      Buffer.from([1, 2, 6, 7, 8, 3, 9, 10, 11, 4, 5, 12, 13, 14]),
    );
  });

  it('should write int8 and return bytes written', () => {
    const buf = new FlexyBuffer();
    const actual = buf.writeInt8(5);
    expect(actual).toEqual(1);
    expect(buf.size).toEqual(1);
  });

  it('should start() reset position, size and pending house keep timer', () => {
    const buf = new FlexyBuffer({ pageSize: 100, houseKeepMs: 10 });
    buf.writeBytes([1, 2, 3]);
    buf.growSize(150);
    buf.start();
    expect(buf.size).toEqual(0);
    expect(buf.position).toEqual(0);
  });

  it('should flush() return a copy and reset the buffer', () => {
    const buf = new FlexyBuffer();
    buf.writeBytes([1, 2, 3, 4, 5]);
    const out = buf.flush();
    expect(out).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    expect(buf.size).toEqual(0);
    expect(buf.position).toEqual(0);
    // Mutating the flushed copy must not affect the internal buffer
    out[0] = 99;
    buf.writeBytes([6]);
    expect(buf.buffer[0]).toEqual(6);
  });

  it('should flush(false) return a view sharing the internal buffer', () => {
    const buf = new FlexyBuffer();
    buf.writeBytes([1, 2, 3, 4, 5]);
    const out = buf.flush(false);
    expect(out).toEqual(Buffer.from([1, 2, 3, 4, 5]));
    // Shares memory with the internal buffer - next write overwrites it
    buf.writeBytes([9]);
    expect(out[0]).toEqual(9);
  });

  it('should not corrupt a flush(false) view when house keep shrinks the buffer', done => {
    const buf = new FlexyBuffer({ pageSize: 100, houseKeepMs: 10 });
    buf.writeBytes([1, 2, 3, 4, 5]);
    buf.fill(0, 145); // grow past one page -> capacity 200, arms house keep timer
    buf.setSize(5); // shrink used size back down without touching capacity
    expect(buf.capacity).toEqual(200);
    const out = buf.flush(false); // view into the 200-byte buffer
    setTimeout(() => {
      try {
        // House keep reallocates a smaller buffer instead of mutating in place,
        // so the outstanding view stays intact.
        expect(buf.capacity).toEqual(100);
        expect(out).toEqual(Buffer.from([1, 2, 3, 4, 5]));
        done();
      } catch (e) {
        done(e);
      }
    }, 20);
  });

  it('should not throw when flush() runs again before start()', () => {
    // pageSize 4 with two 4-byte writes forces the buffer to grow past one
    // page, which is what makes the first flush() schedule a housekeeping
    // timer at all - a single-page write never would.
    const buf = new FlexyBuffer({ pageSize: 4, houseKeepMs: 100000 });
    buf.writeInt32BE(1);
    buf.writeInt32BE(2);
    expect(buf.capacity).toBeGreaterThan(4);
    buf.flush(); // schedules a housekeeping timer
    expect(() => buf.flush()).not.toThrow();
  });

  it('should flush a zero-length write without error', () => {
    const buf = new FlexyBuffer({ pageSize: 4 });
    const out = buf.flush();
    expect(out.length).toEqual(0);
  });

  it('should shrink size after flush() once idle for houseKeepMs', done => {
    const buf = new FlexyBuffer({ pageSize: 100, houseKeepMs: 10 });
    buf.growSize(150);
    expect(buf.capacity).toEqual(200);
    buf.flush();
    setTimeout(() => {
      try {
        expect(buf.capacity).toEqual(100);
        done();
      } catch (e) {
        done(e);
      }
    }, 20);
  });

  it('should write a string at a non-zero position without truncating the advance', () => {
    // Regression: writeString() used to subtract `position` from the byte
    // count Buffer#write() already returns, under-advancing the position
    // and letting the next write clobber the tail of the string.
    const buf = new FlexyBuffer();
    buf.writeUInt32BE(42);
    const written = buf.writeString('Hello, World!', 'utf8');
    expect(written).toEqual(13);
    expect(buf.position).toEqual(4 + 13);
    buf.writeBytes([1, 2, 3, 4]);
    buf.moveTo(4);
    expect(buf.readString(13, 'utf8')).toEqual('Hello, World!');
  });

  it('should accept a plain number for writeBigInt64BE and convert it to bigint', () => {
    const buf = new FlexyBuffer();
    buf.writeBigInt64BE(123);
    expect(buf.buffer.readBigInt64BE(0)).toEqual(123n);
  });

  it('should delete bytes', () => {
    const buf: FlexyBuffer = new FlexyBuffer();
    buf.writeBytes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(buf.size).toEqual(14);
    buf.moveTo(2);
    buf.delete(2);
    expect(buf.size).toEqual(12);
    expect(buf.buffer.subarray(0, buf.size)).toEqual(
      Buffer.from([1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    );
    buf.moveTo(buf.size - 2);
    buf.delete(4);
    expect(buf.size).toEqual(10);
    expect(buf.buffer.subarray(0, buf.size)).toEqual(
      Buffer.from([1, 2, 5, 6, 7, 8, 9, 10, 11, 12]),
    );
    buf.moveTo(buf.size);
    buf.delete(4);
    expect(buf.size).toEqual(10);
    expect(buf.buffer.subarray(0, buf.size)).toEqual(
      Buffer.from([1, 2, 5, 6, 7, 8, 9, 10, 11, 12]),
    );
  });
});
