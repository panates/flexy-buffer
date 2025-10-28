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
