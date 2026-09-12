<!--
docs-baseline
git-commit: fbb35ad5f72bd474c8a42479aca6f862a69af50b
package-version: 1.0.1
date: 2026-09-12
verified-against: src/
diff-command: git diff fbb35ad5f72bd474c8a42479aca6f862a69af50b..HEAD -- src/
-->

# flexy-buffer API Documentation

flexy-buffer is a small, dependency-free binary buffer library for Node.js.
`BufferReader` wraps a fixed `Buffer` with a sequential, typed read cursor;
`FlexyBuffer` extends it with write methods and automatic, page-based
growth/shrink, so you don't have to size a buffer up front or manage
reallocation yourself.

```bash
npm install flexy-buffer --save
```

```ts
import { BufferReader, FlexyBuffer } from 'flexy-buffer';
```

- [`BufferReader`](#bufferreader)
  - [Constructor](#constructor)
  - [Properties](#properties)
  - [Read methods](#read-methods)
  - [Position methods](#position-methods)
  - [Errors](#errors)
- [`FlexyBuffer`](#flexybuffer)
  - [`FlexBufferConfig`](#flexbufferconfig)
  - [Constructor](#constructor-1)
  - [Static properties](#static-properties)
  - [Properties](#properties-1)
  - [Buffer management](#buffer-management)
  - [Write methods](#write-methods)
  - [Data manipulation](#data-manipulation)
  - [Memory management](#memory-management)
  - [Errors](#errors-1)
- [Recipes](#recipes)
  - [Framing messages with `start()`/`flush()`](#framing-messages-with-startflush)
  - [Backpatching a length prefix](#backpatching-a-length-prefix)

## `BufferReader`

A sequential, forward-only reader over a fixed `Buffer`. It tracks a current
read position and exposes typed read methods that advance it, throwing when
a read would run past the end of the buffer.

### Constructor

```ts
constructor(buffer: Buffer)
```

| Parameter | Type     | Description             |
| --------- | -------- | ------------------------ |
| `buffer`  | `Buffer` | The buffer to read from. |

### Properties

| Property   | Type     | Description                                       |
| ---------- | -------- | -------------------------------------------------- |
| `buffer`   | `Buffer` | The underlying buffer being read from.             |
| `size`     | `number` | Length of the underlying buffer, in bytes.         |
| `position` | `number` | Current read position. Settable - assigning to it is equivalent to `moveTo()`, so the value is clamped to `[0, size]`. |

### Read methods

Every read method advances `position` by the number of bytes it consumes and
throws (see [Errors](#errors)) if that many bytes aren't available.

| Method | Returns | Bytes |
| --- | --- | --- |
| `readInt8()` | `number` | 1 |
| `readUInt8()` | `number` | 1 |
| `readInt16BE()` / `readInt16LE()` | `number` | 2 |
| `readUInt16BE()` / `readUInt16LE()` | `number` | 2 |
| `readInt32BE()` / `readInt32LE()` | `number` | 4 |
| `readUInt32BE()` / `readUInt32LE()` | `number` | 4 |
| `readBigInt64BE()` / `readBigInt64LE()` | `BigInt` | 8 |
| `readBigUInt64BE()` / `readBigUInt64LE()` | `BigInt` | 8 |
| `readFloatBE()` / `readFloatLE()` | `number` | 4 |
| `readDoubleBE()` / `readDoubleLE()` | `number` | 8 |

`BE`/`LE` suffixes select big-endian (most significant byte first) or
little-endian (least significant byte first) decoding.

```ts
readBytes(len?: number): Buffer
```

Returns a `Buffer` slice starting at the current position. With `len`, reads
exactly `len` bytes; without it, reads through the end of the buffer. Either
way, `position` advances past what was read.

```ts
readString(len: number, encoding?: BufferEncoding): string
```

Reads `len` bytes starting at the current position and decodes them as a
string. A negative `len` reads nothing and returns `''` (position is left
unchanged).

### Position methods

```ts
moveBy(n: number): this
moveTo(pos: number): this
```

Move the position by a relative offset (`moveBy`, positive or negative) or
to an absolute one (`moveTo`). Both clamp the result to `[0, size]` rather
than throwing, and return `this` for chaining. Assigning directly to
`position` (`buf.position = pos`) is equivalent to `moveTo(pos)`.

### Errors

| Reading past the end of the buffer throws an `Error` with: |
| --- |
| `message`: `'Eof in buffer detected'` |
| `code`: `'ERR_BUFFER_OUT_OF_BOUNDS'` |

```ts
try {
  reader.readUInt32BE();
} catch (err) {
  if (err.code === 'ERR_BUFFER_OUT_OF_BOUNDS') {
    console.log('attempted to read beyond buffer end');
  }
}
```

## `FlexyBuffer`

Extends `BufferReader` with write methods and automatic, page-based
capacity management: the internal buffer grows in `pageSize` increments as
data is written (up to `maxLength`), and shrinks back down to `minPages`
after `houseKeepMs` of inactivity.

### `FlexBufferConfig`

All fields are optional.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `minPages` | `number` | `1` | Minimum number of pages to keep allocated, even when idle. |
| `pageSize` | `number` | `4096` | Size of each page in bytes; capacity always grows/shrinks in multiples of this. |
| `maxLength` | `number` | `10 * 1024 * 1024` (10 MB) | Maximum data size in bytes. Enforced exactly, at the byte - growing past it throws (see [Errors](#errors-1)) even if that byte count falls short of a whole page. |
| `houseKeepMs` | `number` | `5000` | Milliseconds of inactivity after a grow or flush before capacity is reclaimed. |

### Constructor

```ts
constructor(cfg?: FlexBufferConfig)
```

### Static properties

| Property | Value |
| --- | --- |
| `FlexyBuffer.DEFAULT_PAGE_SIZE` | `4096` |
| `FlexyBuffer.DEFAULT_HOUSE_KEEP_MS` | `5000` |
| `FlexyBuffer.DEFAULT_MAX_SIZE` | `10 * 1024 * 1024` (10 MB) |

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `capacity` | `number` (readonly) | Currently allocated size of the internal buffer, in bytes. |
| `size` | `number` (readonly) | Length of the valid, written data, in bytes. **Overrides** `BufferReader.size`, which reports the raw buffer length instead. |
| `eof` | `boolean` (readonly) | Whether `position` has reached `size`. |
| `houseKeepMs` | `number` | Get/set the housekeeping idle interval. Setting it re-arms a pending timer. |
| `minPages` | `number` (readonly) | Minimum number of pages kept allocated. |
| `pageSize` | `number` (readonly) | Page size in bytes. |
| `maxSize` | `number` (readonly) | Maximum data size in bytes. |
| `position` | `number` (inherited) | Current read/write position. |

### Buffer management

```ts
setSize(len: number): this
growSize(len: number): this
```

`setSize` sets the valid data size to `len`, allocating more (page-aligned)
capacity if needed; `growSize(len)` is shorthand for `setSize(size + len)`.
Both throw `EBUFFLIMIT` (see [Errors](#errors-1)) if the new size would
exceed `maxSize`. Shrinking only updates the reported size - it does not
reallocate; see [Memory management](#memory-management) for how capacity is
actually reclaimed.

```ts
toBuffer(): Buffer
```

Returns a **view** of the internal buffer holding just the valid data (`0`
to `size`) - no copy, and the buffer itself is left untouched (not reset).
Because it's a view, it becomes invalid the moment the same `FlexyBuffer`
instance is written to or reallocated again. Use it only when you're done
with the buffer, or will consume the result before writing again; otherwise
prefer `flush()`.

```ts
reset(shrinkCapacity?: boolean): void
```

Resets the buffer to an empty state (`size` and `position` back to `0`)
without touching a pending housekeeping timer. Pass `shrinkCapacity: true`
to also immediately reclaim capacity down to `minPages`, instead of waiting
for the timer.

```ts
start(): this
```

Resets `position` and `size` to `0` **and** cancels any pending housekeeping
timer. Use this instead of `reset()` right before writing a new message into
a reused buffer, so a timer scheduled by an earlier grow doesn't fire (and
shrink capacity) partway through.

```ts
flush(copy?: boolean): Buffer
```

Returns the valid data (`0` to `size`), then resets the buffer (as `start()`
does). If capacity has grown past its baseline (`minPages` pages), (re)arms
the housekeeping timer; otherwise there's nothing to reclaim, so it clears
any pending timer instead - a stream of small messages that never grow the
buffer doesn't pay for a clearTimeout/setTimeout pair on every flush.

- `copy` (default `true`): if `true`, returns a new `Buffer` copy, safe to
  keep around indefinitely. If `false`, returns a **view** into the internal
  buffer instead (no allocation) - safe only if it's fully consumed before
  the next write on the same instance, since that write overwrites the same
  memory. Housekeeping itself never corrupts an outstanding view: when it
  shrinks capacity, it allocates a *new* internal buffer rather than
  mutating the old one, so a view returned by an earlier `flush(false)`
  stays intact - only a subsequent *write* on the instance can invalidate
  it.

The typical use is to build one message into a long-lived `FlexyBuffer` and
extract it repeatedly - see [Recipes](#recipes).

### Write methods

Every write method writes at the current `position`, growing the buffer via
`setSize`/`growSize` if needed, advances `position` past what it wrote, and
returns the number of bytes actually written (not `this` - the return value
lets you build up an absolute offset, e.g. `const off = buf.position` before
a write you'll want to backpatch later).

| Method | Accepts | Bytes |
| --- | --- | --- |
| `writeInt8(n)` / `writeUInt8(n)` | `number` | 1 |
| `writeInt16BE(n)` / `writeInt16LE(n)` | `number` | 2 |
| `writeUInt16BE(n)` / `writeUInt16LE(n)` | `number` | 2 |
| `writeInt32BE(n)` / `writeInt32LE(n)` | `number` | 4 |
| `writeUInt32BE(n)` / `writeUInt32LE(n)` | `number` | 4 |
| `writeBigInt64BE(n)` / `writeBigInt64LE(n)` | `bigint \| number` | 8 |
| `writeBigUInt64BE(n)` / `writeBigUInt64LE(n)` | `bigint \| number` | 8 |
| `writeFloatBE(n)` / `writeFloatLE(n)` | `number` | 4 |
| `writeDoubleBE(n)` / `writeDoubleLE(n)` | `number` | 8 |

The `bigint | number` write methods accept a plain `number` and convert it
with `BigInt(n)`.

```ts
writeBytes(buffer: Buffer | number[]): number
writeString(str: string, encoding?: BufferEncoding): number
```

`writeBytes` copies a `Buffer` or plain array of byte values.
`writeString` encodes and writes a string; writing an empty/falsy string is
a no-op that returns `0`.

### Data manipulation

```ts
fill(value = 0, len = 1): this
```

Fills `len` bytes at the current position with `value`, advancing position
past them (growing the buffer if needed).

```ts
insertBytes(buffer: Buffer | number[]): number
```

Inserts bytes at the current position, shifting any data at and after the
position forward to make room, then advances position past the inserted
bytes. Returns the number of bytes the buffer grew by.

```ts
delete(deleteCount: number): number
```

Deletes up to `deleteCount` bytes starting at the current position, shifting
the remaining data backward. `position` is left unchanged. Returns the
number of bytes actually deleted, capped by how much data was available
after the position.

### Memory management

- Capacity grows in `pageSize`-aligned chunks, up to `maxSize` (enforced at
  the exact byte, per `maxLength` above).
- Every grow (re)arms a deferred housekeeping timer; once `houseKeepMs`
  passes without another grow, the timer reclaims capacity - shrinking the
  internal buffer down to `minPages` (or the current `size`, if that needs
  more) by allocating a fresh, smaller buffer and copying the live data into
  it.
- Call `reset(true)` to reclaim capacity immediately instead of waiting for
  the timer.
- The internal buffer is allocated with `Buffer.allocUnsafe()` for
  performance - bytes beyond `size` are not zeroed, so don't read past
  `size` (or the current `position` boundary read methods already enforce)
  expecting zeros.

### Errors

| Growing past `maxLength` throws an `Error` with: |
| --- |
| `message`: `'Buffer limit exceeded.'` |
| `code`: `'EBUFFLIMIT'` |

```ts
try {
  buffer.growSize(tooMuchSize);
} catch (err) {
  if (err.code === 'EBUFFLIMIT') {
    console.log('buffer size limit exceeded');
  }
}
```

`FlexyBuffer` also inherits `BufferReader`'s `ERR_BUFFER_OUT_OF_BOUNDS` error
from its read methods - see [BufferReader's Errors](#errors).

## Recipes

### Framing messages with `start()`/`flush()`

Reuse one `FlexyBuffer` to build and extract many messages, letting
housekeeping reclaim capacity between bursts:

```ts
const buf = new FlexyBuffer({ pageSize: 4096 });

function buildMessage(id: number, payload: string): Buffer {
  buf.start(); // discard anything left from a previous message
  buf.writeUInt32BE(id);
  buf.writeString(payload, 'utf8');
  return buf.flush(); // copy of the bytes written above; buf is reset for reuse
}

const msg1 = buildMessage(1, 'hello');
const msg2 = buildMessage(2, 'world');
```

### Backpatching a length prefix

Because write methods return the byte offset advanced past (via their
return value) and `position` can be read at any time, you can reserve space
for a length prefix, write the body, then patch the length back in:

```ts
buf.start();
buf.writeUInt32BE(0); // placeholder length
const bodyStart = buf.position;
buf.writeString('the message body', 'utf8');
buf.buffer.writeUInt32BE(buf.position - bodyStart, bodyStart - 4); // patch it in
const out = buf.flush();
```
