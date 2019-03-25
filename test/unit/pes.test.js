const { generatePESHeader } = require('../../lib/pes');
const assert = require('assert');

const verifyPes = (b, pts, dataLength, headerPaddingLength) => {
  // Look for start code
  assert.equal(b[0], 0x00);
  assert.equal(b[1], 0x00);
  assert.equal(b[2], 0x01);

  const packetLength = dataLength + headerPaddingLength + 3 + (Number.isFinite(pts) ? 5 : 0);
  assert.equal(b[4], packetLength >>> 8 & 0xff);
  assert.equal(b[5], packetLength & 0xff);

  const headerLength = headerPaddingLength + (Number.isFinite(pts) ? 5 : 0);
  assert.equal(b[8], headerLength);

  // Verify that the PTS is correct
  if (Number.isFinite(pts)) {
    let accum = (b[9] & 0x0e) >>> 1;
    accum *= 256;
    accum +=  b[10];
    accum *= 128;
    accum +=  (b[11] & 0xfe) >>> 1;
    accum *= 256;
    accum +=  b[12];
    accum *= 128;
    accum +=  (b[13] & 0xfe) >>> 1;

    assert.equal(accum, pts);
  }
};

describe('pes', () => {
  it('should generate a PES with specified PTS', () => {
    const b = Buffer.alloc(14);
    generatePESHeader(b, 0, 6135667565, 100, 20);
    verifyPes(b, 6135667565, 100, 20);
  });

  it('should generate a PES without a PTS', () => {
    const b = Buffer.alloc(9);
    generatePESHeader(b, 0, null, 100, 20);
    verifyPes(b, null, 100, 20);
  });

  it('should throw if there is not enough room in the buffer for the PES header', () => {
    const b = Buffer.alloc(14);
    assert.throws(
      () => generatePESHeader(b, 1, 6135667565, 100, 20),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

  it('should throw if there is not enough room in the buffer for the PES header without PTS', () => {
    const b = Buffer.alloc(9);
    assert.throws(
      () => generatePESHeader(b, 1, null, 100, 20),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

});
