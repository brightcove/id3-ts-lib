const { generatePMTPacket } = require('../../lib/pmt');
const assert = require('assert');

const verifyPmt = (b, pmtPid, id3Pid) => {
  // Look for sync-byte
  assert.equal(b[0], 0x47);
  // Make sure the TS PID is pmtPid
  const tsPid = ((b[1] & 0x1f) << 8) | b[2];
  assert.equal(tsPid, pmtPid);

  // Make sure the program_info_length is 17
  const programLength = ((b[15] & 0x0f) << 8) | b[16];
  assert.equal(programLength, 17);

  // Make sure the metadata_pointer_descriptor is present
  assert.equal(b[17], 0x25);

  // Make sure the time_metadata track is present
  assert.equal(b[34], 0x15);

  // Verify the track PID
  const trackPid = ((b[35] & 0x1f) << 8) | b[36];
  assert.equal(trackPid, id3Pid);

  // Make sure the metadata_descriptor track is present
  assert.equal(b[39], 0x26);

  // Verify that the CRC32 is correct
  assert.equal(b[54], 0x2d);
  assert.equal(b[55], 0xfe);
  assert.equal(b[56], 0x93);
  assert.equal(b[57], 0x8d);

  // Verify complete padding (this is important for security reasons)
  for (let i = 58; i < 188; i++) {
    assert.equal(b[i], 0xff);
  }
};

describe('pmt', () => {
  it('should generate a PMT with specified pmtPid and id3Pid', () => {
    const b = Buffer.alloc(188);
    generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0x180});
    verifyPmt(b, 0x101, 0x180);
  });

  it('should throw if pmtPid is not a number', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: true, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: '20', id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if pmtPid is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: -100, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 10000, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if id3Pid is not a number', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: true}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: '20'}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });
  });

  it('should throw if id3Pid is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: -100}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 10000}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });
  });

  it('should throw if id3Pid and pmtPid are the equal', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0x101}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });
  });

  it('should throw if there is not enough room in the buffer for the PMT packet', () => {
    const b = Buffer.alloc(180);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0x180}),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

});
