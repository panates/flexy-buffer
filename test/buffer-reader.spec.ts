import { expect } from 'expect';
import { BufferReader } from 'flexy-buffer';

describe('BufferReader', () => {
  it('should report the underlying buffer size', () => {
    const reader = new BufferReader(Buffer.from([1, 2, 3]));
    expect(reader.size).toEqual(3);
  });

  it('should read an unsigned 8-bit integer and advance by 1', () => {
    const reader = new BufferReader(Buffer.from([200]));
    expect(reader.readUInt8()).toEqual(200);
    expect(reader.position).toEqual(1);
  });

  it('should read an unsigned 16-bit big-endian integer and advance by 2', () => {
    const reader = new BufferReader(Buffer.from([0x01, 0x02]));
    expect(reader.readUInt16BE()).toEqual(0x0102);
    expect(reader.position).toEqual(2);
  });

  it('should read a signed 16-bit big-endian integer', () => {
    const reader = new BufferReader(Buffer.from([0xff, 0xff]));
    expect(reader.readInt16BE()).toEqual(-1);
  });

  it('should read an unsigned 32-bit big-endian integer and advance by 4', () => {
    const reader = new BufferReader(Buffer.from([0, 0, 1, 0]));
    expect(reader.readUInt32BE()).toEqual(256);
    expect(reader.position).toEqual(4);
  });

  it('should read a signed 32-bit big-endian integer', () => {
    const reader = new BufferReader(Buffer.from([0xff, 0xff, 0xff, 0xff]));
    expect(reader.readInt32BE()).toEqual(-1);
  });

  it('should allow setting position directly, clamped to [0, size]', () => {
    const reader = new BufferReader(Buffer.from([1, 2, 3, 4]));
    reader.position = 2;
    expect(reader.position).toEqual(2);
    expect(reader.readUInt8()).toEqual(3);
    reader.position = -5;
    expect(reader.position).toEqual(0);
    reader.position = 100;
    expect(reader.position).toEqual(4);
  });

  it('should read a bounded sub-buffer and advance by its length', () => {
    const reader = new BufferReader(Buffer.from([1, 2, 3, 4]));
    const buf = reader.readBytes(2);
    expect([...buf]).toEqual([1, 2]);
    expect(reader.position).toEqual(2);
  });

  it('should read the remainder of the buffer when no length is given', () => {
    const reader = new BufferReader(Buffer.from([1, 2, 3, 4]));
    reader.readUInt8();
    const buf = reader.readBytes();
    expect([...buf]).toEqual([2, 3, 4]);
    expect(reader.position).toEqual(4);
  });

  it('should throw when reading past the end of the buffer', () => {
    const reader = new BufferReader(Buffer.from([1, 2]));
    expect(() => reader.readUInt32BE()).toThrow(/Eof in buffer detected/);
  });
});
