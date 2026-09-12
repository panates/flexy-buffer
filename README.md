# flexy-buffer

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![CI Tests][ci-test-image]][ci-test-url]
[![Test Coverage][coveralls-image]][coveralls-url]

A flexible, auto-growing binary buffer for Node.js and the browser. `BufferReader`
gives you a sequential, typed read cursor over a `Buffer`; `FlexyBuffer` extends it
with write methods and automatic, page-based capacity management, so you don't have
to size a buffer up front or manage reallocation yourself.

## 📖 [Full API documentation](docs/api.md)

## Features

- Typed reads and writes for 8/16/32/64-bit integers (BE/LE), 64-bit BigInt,
  32/64-bit floats, raw bytes, and strings
- Auto-growing capacity in configurable, page-sized chunks, with a byte-exact
  `maxLength` cap
- Automatic housekeeping - idle capacity is reclaimed after a configurable interval
- `insertBytes()`/`delete()` for shifting data in place, `fill()` for padding
- `start()`/`flush()` to build and extract framed messages from a reused buffer
- Zero runtime dependencies

## Installation

```bash
npm install flexy-buffer --save
```

## Quick start

```ts
import { FlexyBuffer } from 'flexy-buffer';

const buf = new FlexyBuffer({ pageSize: 4096 });

// Write different types of data
buf.writeUInt32BE(42);
buf.writeString('Hello, World!', 'utf8');
buf.writeBytes(Buffer.from([1, 2, 3, 4]));

// Read data back by repositioning
buf.moveTo(0);
const number = buf.readUInt32BE();
const text = buf.readString(13, 'utf8');

// Build and extract a message, then reuse the buffer
buf.start();
buf.writeUInt32BE(1);
buf.writeString('hi', 'utf8');
const message = buf.flush(); // copy of the bytes written above; buf is reset for reuse
```

See the [full API documentation](docs/api.md) for every method, configuration
option, error code, and more recipes.

## Support

You can report bugs and discuss features on the [GitHub issues](https://github.com/panates/flexy-buffer/issues) page.
When you open an issue please provide the version of Node.js and of flexy-buffer you are using.

## Node Compatibility

- node `>= 16.0`

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
