# flexy-buffer

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![CI Tests][ci-test-image]][ci-test-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Fast runtime type validator, converter and io (encoding/decoding) library.

## Installation

`$ npm install flexy-buffer --save`


# BufferReader API Documentation

## API

### BufferReader

A sequential buffer reader class that provides methods for reading various data types from a Node.js Buffer. Maintains an internal position cursor that automatically advances as data is read.

#### Constructor

constructor(buffer: Buffer)

Creates a new BufferReader instance.

Parameters:
- buffer: Buffer - The Node.js Buffer to read from

#### Properties

- buffer: Buffer - The underlying Node.js Buffer being read from
- size: number (readonly) - The total size of the buffer in bytes
- position: number (readonly) - Current read position in the buffer

#### Methods

##### Integer Reading Methods

readInt8(): number
Reads a signed 8-bit integer (1 byte).
Advances position by 1 byte.

readUInt8(): number
Reads an unsigned 8-bit integer (1 byte).
Advances position by 1 byte.

readInt16BE(): number
Reads a signed, big-endian 16-bit integer (2 bytes).
Advances position by 2 bytes.

readUInt16BE(): number
Reads an unsigned, big-endian 16-bit integer (2 bytes).
Advances position by 2 bytes.

readInt16LE(): number
Reads a signed, little-endian 16-bit integer (2 bytes).
Advances position by 2 bytes.

readUInt16LE(): number
Reads an unsigned, little-endian 16-bit integer (2 bytes).
Advances position by 2 bytes.

readInt32BE(): number
Reads a signed, big-endian 32-bit integer (4 bytes).
Advances position by 4 bytes.

readUInt32BE(): number
Reads an unsigned, big-endian 32-bit integer (4 bytes).
Advances position by 4 bytes.

readInt32LE(): number
Reads a signed, little-endian 32-bit integer (4 bytes).
Advances position by 4 bytes.

readUInt32LE(): number
Reads an unsigned, little-endian 32-bit integer (4 bytes).
Advances position by 4 bytes.

##### BigInt Reading Methods

readBigInt64BE(): BigInt
Reads a signed, big-endian 64-bit integer (8 bytes).
Advances position by 8 bytes.

readBigUInt64BE(): BigInt
Reads an unsigned, big-endian 64-bit integer (8 bytes).
Advances position by 8 bytes.

readBigInt64LE(): BigInt
Reads a signed, little-endian 64-bit integer (8 bytes).
Advances position by 8 bytes.

readBigUInt64LE(): BigInt
Reads an unsigned, little-endian 64-bit integer (8 bytes).
Advances position by 8 bytes.

##### Float Reading Methods

readFloatBE(): number
Reads a 32-bit, big-endian float (4 bytes).
Advances position by 4 bytes.

readFloatLE(): number
Reads a 32-bit, little-endian float (4 bytes).
Advances position by 4 bytes.

readDoubleBE(): number
Reads a 64-bit, big-endian double (8 bytes).
Advances position by 8 bytes.

readDoubleLE(): number
Reads a 64-bit, little-endian double (8 bytes).
Advances position by 8 bytes.

##### Buffer and String Reading Methods

readBytes(len?: number): Buffer
Reads bytes from the current position.
- If len is specified, reads exactly len bytes
- If len is not specified, reads from current position to end of buffer
- Advances position by the number of bytes read
- Returns a new Buffer containing the read bytes

readString(len: number, encoding?: BufferEncoding): string
Reads a string of specified length from the current position.
- len: number of bytes to read
- encoding: optional buffer encoding (default: 'utf8')
- Advances position by len bytes
- Returns empty string if len < 0

##### Position Control Methods

moveBy(n: number): this
Moves the current position by n bytes (can be positive or negative).
- Automatically clamps position to valid range [0, size]
- Returns this for method chaining

moveTo(pos: number): this
Moves the current position to the specified absolute position.
- Automatically clamps position to valid range [0, size]
- Returns this for method chaining

#### Usage Examples

import { BufferReader } from 'flexy-buffer';

// Create a buffer with some data
const buffer = Buffer.from([
0x12, 0x34, 0x56, 0x78,           // 4-byte integer
0x48, 0x65, 0x6c, 0x6c, 0x6f,    // "Hello" string
0x40, 0x49, 0x0f, 0xdb           // 4-byte float
]);

// Create reader
const reader = new BufferReader(buffer);

// Read different data types
const intValue = reader.readUInt32BE();        // 0x12345678
const text = reader.readString(5, 'utf8');     // "Hello"
const floatValue = reader.readFloatBE();       // some float value

// Check position
console.log(reader.position);  // 13 (4 + 5 + 4 bytes)
console.log(reader.size);      // 13 (total buffer size)

// Move position manually
reader.moveTo(0);              // Go back to start
reader.moveBy(4);              // Skip first 4 bytes

// Read remaining bytes
const remaining = reader.readBytes();  // Gets all remaining bytes

#### Position Management

// Reset to beginning
reader.moveTo(0);

// Skip bytes
reader.moveBy(10);

// Go to specific position
reader.moveTo(5);

// Read from current position to end
const restOfBuffer = reader.readBytes();

#### Error Handling

The BufferReader throws an error when attempting to read beyond buffer boundaries:

try {
reader.readUInt32BE(); // If not enough bytes available
} catch (err) {
if (err.code === 'ERR_BUFFER_OUT_OF_BOUNDS') {
console.log('Attempted to read beyond buffer end');
}
}

#### Data Type Reference

8-bit integers (1 byte):
- readInt8(): -128 to 127
- readUInt8(): 0 to 255

16-bit integers (2 bytes):
- readInt16BE/LE(): -32,768 to 32,767
- readUInt16BE/LE(): 0 to 65,535

32-bit integers (4 bytes):
- readInt32BE/LE(): -2,147,483,648 to 2,147,483,647
- readUInt32BE/LE(): 0 to 4,294,967,295

64-bit integers (8 bytes):
- readBigInt64BE/LE(): BigInt values
- readBigUInt64BE/LE(): BigInt values (unsigned)

Floating point:
- readFloatBE/LE(): 32-bit IEEE 754 float
- readDoubleBE/LE(): 64-bit IEEE 754 double

Endianness:
- BE: Big-endian (most significant byte first)
- LE: Little-endian (least significant byte first)

#### Notes

- All read operations automatically advance the internal position
- Position is automatically clamped to valid range [0, size]
- Reading beyond buffer end throws ERR_BUFFER_OUT_OF_BOUNDS error
- The class provides a foundation for building more complex buffer reading functionality
- Can be extended (as done by FlexyBuffer) to add writing capabilities


# FlexyBuffer API Documentation

## API

### FlexyBuffer

A flexible, auto-growing buffer implementation that extends BufferReader with writing capabilities. The buffer automatically manages memory allocation using a page-based system and includes housekeeping functionality for memory optimization.

#### Constructor

constructor(cfg?: FlexBufferConfig)

Creates a new FlexyBuffer instance.

Parameters:
- cfg (optional): Configuration object
    - minPages?: number - Minimum number of pages to allocate (default: 1)
    - pageSize?: number - Size of each page in bytes (default: 4096)
    - maxLength?: number - Maximum buffer size in bytes (default: 10MB)
    - houseKeepMs?: number - Housekeeping timer interval in milliseconds (default: 5000)

#### Properties

##### Static Properties

- DEFAULT_PAGE_SIZE: number - Default page size (4096 bytes)
- DEFAULT_HOUSE_KEEP_MS: number - Default housekeeping interval (5000ms)
- DEFAULT_MAX_SIZE: number - Default maximum size (10MB)

##### Instance Properties

- capacity: number (readonly) - Current buffer capacity in bytes
- size: number (readonly) - Current data size in bytes
- eof: boolean (readonly) - Whether the current position is at end of data
- position: number (inherited) - Current read/write position
- houseKeepMs: number - Housekeeping timer interval (get/set)
- minPages: number (readonly) - Minimum number of pages
- pageSize: number (readonly) - Page size in bytes
- maxSize: number (readonly) - Maximum buffer size

#### Methods

##### Buffer Management

setSize(len: number): this
Sets the buffer size, automatically growing capacity if needed.
- Throws error with code 'EBUFFLIMIT' if exceeds maxSize

growSize(len: number): this
Grows the buffer size by the specified amount.

toBuffer(): Buffer
Returns a new Buffer containing only the valid data (0 to size).

reset(shrinkCapacity?: boolean): void
Resets the buffer to empty state.
- shrinkCapacity - If true, also shrinks capacity to minimum

##### Data Writing Methods

Integer Writing:
- writeInt8(n: number): this
- writeUInt8(n: number): number
- writeInt16BE(n: number): number
- writeUInt16BE(n: number): number
- writeInt16LE(n: number): number
- writeUInt16LE(n: number): number
- writeInt32BE(n: number): number
- writeUInt32BE(n: number): number
- writeInt32LE(n: number): number
- writeUInt32LE(n: number): number

BigInt Writing:
- writeBigInt64BE(n: bigint | number): number
- writeBigUInt64BE(n: bigint | number): number
- writeBigInt64LE(n: bigint | number): number
- writeBigUInt64LE(n: bigint | number): number

Float Writing:
- writeFloatBE(n: number): number
- writeFloatLE(n: number): number
- writeDoubleBE(n: number): number
- writeDoubleLE(n: number): number

Buffer and String Writing:
- writeBytes(buffer: Buffer | number[]): number - Writes buffer or array of bytes
- writeString(str: string, encoding?: BufferEncoding): number - Writes string with optional encoding

##### Data Manipulation

fill(value = 0, len = 1): this
Fills the buffer with the specified value for the given length at current position.

insertBytes(buffer: Buffer | number[]): number
Inserts bytes at the current position, shifting existing data forward.
Returns the actual number of bytes inserted.

delete(deleteCount: number): number
Deletes bytes from the current position, shifting remaining data backward.
Returns the actual number of bytes deleted.

##### Reading Methods (Inherited from BufferReader)

The FlexyBuffer inherits all reading methods from BufferReader:

- readInt8(): number
- readUInt8(): number
- readInt16BE(): number, readInt16LE(): number
- readUInt16BE(): number, readUInt16LE(): number
- readInt32BE(): number, readInt32LE(): number
- readUInt32BE(): number, readUInt32LE(): number
- readBigInt64BE(): bigint, readBigInt64LE(): bigint
- readBigUInt64BE(): bigint, readBigUInt64LE(): bigint
- readFloatBE(): number, readFloatLE(): number
- readDoubleBE(): number, readDoubleLE(): number
- readBytes(len: number): Buffer
- readString(len: number, encoding?: BufferEncoding): string

#### Usage Examples

import { FlexyBuffer } from 'flexy-buffer';

// Create a buffer with custom configuration
const buffer = new FlexyBuffer({
pageSize: 8192,
minPages: 2,
maxLength: 1024 * 1024, // 1MB max
houseKeepMs: 10000
});

// Write different types of data
buffer.writeUInt32LE(42);
buffer.writeString('Hello, World!', 'utf8');
buffer.writeBytes(Buffer.from([1, 2, 3, 4]));

// Read data by repositioning
buffer.position = 0;
const number = buffer.readUInt32LE();
const text = buffer.readString(13, 'utf8');

// Insert data in the middle
buffer.position = 4;
buffer.insertBytes(Buffer.from([255, 254]));

// Convert to regular Buffer
const result = buffer.toBuffer();

// Reset for reuse
buffer.reset(true); // Also shrink capacity

#### Error Handling

The buffer throws an error with code 'EBUFFLIMIT' when attempting to grow beyond the configured maximum size:

try {
buffer.growSize(tooMuchSize);
} catch (err) {
if (err.code === 'EBUFFLIMIT') {
console.log('Buffer size limit exceeded');
}
}

#### Memory Management

The FlexyBuffer uses automatic memory management:
- Grows in page-sized chunks for efficiency
- Automatically schedules housekeeping to reclaim unused memory
- Housekeeping can be configured or triggered manually via reset(true)
- Uses Buffer.allocUnsafe() for performance (initialize data before reading)


## Node Compatibility

- node `>= 16.0`;

### License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/flexy-buffer.svg
[npm-url]: https://npmjs.org/package/flexy-buffer
[ci-test-image]: https://github.com/panates/flexy-buffer/actions/workflows/test.yml/badge.svg
[ci-test-url]: https://github.com/panates/flexy-buffer/actions/workflows/test.yml
[coveralls-image]: https://img.shields.io/coveralls/panates/flexy-buffer/master.svg
[coveralls-url]: https://coveralls.io/r/panates/flexy-buffer
[downloads-image]: https://img.shields.io/npm/dm/flexy-buffer.svg
[downloads-url]: https://npmjs.org/package/flexy-buffer
[gitter-image]: https://badges.gitter.im/panates/flexy-buffer.svg
[gitter-url]: https://gitter.im/panates/flexy-buffer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[dependencies-image]: https://david-dm.org/panates/flexy-buffer/status.svg
[dependencies-url]:https://david-dm.org/panates/flexy-buffer
[devdependencies-image]: https://david-dm.org/panates/flexy-buffer/dev-status.svg
[devdependencies-url]:https://david-dm.org/panates/flexy-buffer?type=dev
[quality-image]: http://npm.packagequality.com/shield/flexy-buffer.png
[quality-url]: http://packagequality.com/#?package=flexy-buffer
