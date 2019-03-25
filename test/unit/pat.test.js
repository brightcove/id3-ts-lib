const { generatePATPacket } = require('../../lib/pat');
const assert = require('assert');

const verifyPat = (b, pmtPid) => {
  // Look for sync-byte
  assert.equal(b[0], 0x47);
  // Make sure the TS PID is 0
  assert.equal(b[1] & 0x1f, 0x00);
  assert.equal(b[2], 0x00);

  // Make sure the PMT PID is equal to pmtPid
  const PID = ((b[15] & 0x1f) << 8) | b[16];
  assert.equal(PID, pmtPid);

  // Verify that the CRC32 is correct
  assert.equal(b[17], 0xec);
  assert.equal(b[18], 0x38);
  assert.equal(b[19], 0x43);
  assert.equal(b[20], 0xca);

  // Verify complete padding (this is important for security reasons)
  for (let i = 21; i < 188; i++) {
    assert.equal(b[i], 0xff);
  }
};

describe('pat', () => {
  it('should generate a PAT with specified pmtPid', () => {
    const b = Buffer.alloc(188);
    generatePATPacket(b, 0, {pmtPid: 0x101});
    verifyPat(b, 0x101);
  });

  it('should throw if pmtPid is not a number', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePATPacket(b, 0, {}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: true}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: '20'}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if pmtPid is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: 0}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: -100}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: 10000}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if there is not enough room in the buffer for the PAT packet', () => {
    const b = Buffer.alloc(180);
    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: 0x101}),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });
});
