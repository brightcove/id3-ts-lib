const { generateTSHeader } = require('../../lib/ts');
const assert = require('assert');

const {
  verifyTs,
 } = require('../utils');

describe('./lib/ts', () => {
  it('should generate a TS with a PUSI', () => {
    const b = Buffer.alloc(188);
    generateTSHeader(b, 0, 0x181, 2, true);
    verifyTs(b, 0x181, 2, true);
  });

  it('should generate a TS without a PUSI', () => {
    const b = Buffer.alloc(188);
    generateTSHeader(b, 0, 0x181, 2, false);
    verifyTs(b, 0x181, 2, false);
  });

  it('should clamp continuityCounter to the range of 0 - 15', () => {
    const b = Buffer.alloc(188);
    generateTSHeader(b, 0, 0x181, 20, false);
    verifyTs(b, 0x181, 4, false);
  });

  it('should throw if there is not enough room in the buffer for the PES header', () => {
    let b = Buffer.alloc(180);
    assert.throws(
      () => generateTSHeader(b, 0, 0x181, 2, true),
      {
        name: 'RangeError',
        message: /remaining/i,
      });

    b = Buffer.alloc(190);
    assert.throws(
      () => generateTSHeader(b, 10, 0x181, 2, true),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

  it('should throw if PID is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generateTSHeader(b, 10, 0, 2, true),
      {
        name: 'TypeError',
        message: /pid/i,
      });

    assert.throws(
      () =>  generateTSHeader(b, 10, 0, -100, true),
      {
        name: 'TypeError',
        message: /pid/i,
      });

    assert.throws(
      () =>  generateTSHeader(b, 10, 10000, 2, true),
      {
        name: 'TypeError',
        message: /pid/i,
      });
  });
});
