const { crc32 } = require('../../lib/crc32');
const assert = require('assert');

describe('./lib/crc32', () => {
  it('should calculate the correct crc32 for a portion of a buffer', () => {
    // Last 4 bytes are to hold the crc32 calculated from the first 4 bytes:
    const b = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);

    crc32(b, 4, 0, 4);

    // Make sure the original bytes are unchanged
    assert.equal(b[0], 0x01);
    assert.equal(b[1], 0x02);
    assert.equal(b[2], 0x03);
    assert.equal(b[3], 0x04);

    // Verify the CRC32
    assert.equal(b[4], 0x79);
    assert.equal(b[5], 0x37);
    assert.equal(b[6], 0x37);
    assert.equal(b[7], 0xcd);
  });

  it('should throw if there is not enough room in the buffer for the CRC32', () => {
    // Last .3 bytes are to hold the crc32 calculated from the first 4 bytes:
    const b = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00]);

    assert.throws(
      () => crc32(b, 4, 0, 4),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

  it('should throw if the content range overlaps the destination of the CRC32', () => {
    // Last .4 bytes are to hold the crc32 calculated from the first 5 bytes:
    const b = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);

    assert.throws(
      () => crc32(b, 4, 0, 5),
      {
        name: 'RangeError',
        message: /overlaps/i,
      });
  });
});
