const assert = require('assert');

const getPid = (b) => {
  return ((b[1] & 0x1f) << 8) | b[2];
};

exports.getPid = getPid;

exports.verifyPat = (b, pmtPid) => {
  // Look for sync-byte
  assert.equal(b[0], 0x47);
  // Make sure the TS PID is 0
  assert.equal(getPid(b), 0x000);

  // Make sure the PMT PID is equal to pmtPid
  assert.equal(getPid(b.slice(14)), pmtPid);

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

exports.verifyPmt = (b, pmtPid, id3Pid) => {
  // Look for sync-byte
  assert.equal(b[0], 0x47);
  // Make sure the TS PID is pmtPid
  assert.equal(getPid(b), pmtPid);

  // Make sure the program_info_length is 17
  const programLength = ((b[15] & 0x0f) << 8) | b[16];
  assert.equal(programLength, 17);

  // Make sure the metadata_pointer_descriptor is present
  assert.equal(b[17], 0x25);

  // Make sure the time_metadata track is present
  assert.equal(b[34], 0x15);

  // Verify the track PID
  assert.equal(getPid(b.slice(34)), id3Pid);

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
exports.verifyPesHeader = (b, pts, dataLength, headerPaddingLength) => {
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

const verifyTagHeader = (b, tagLength) => {
  let i = 0;
  // "ID3"
  assert.equal(b[i++], 0x49);
  assert.equal(b[i++], 0x44);
  assert.equal(b[i++], 0x33);
  // Major version
  assert.equal(b[i++], 0x04);
  // Minor version
  assert.equal(b[i++], 0x00);
  // Flags
  assert.equal(b[i++], 0x00);
  // Length
  assert.equal(b[i++], tagLength >>> 21 & 0x7f);
  assert.equal(b[i++], tagLength >>> 14 & 0x7f);
  assert.equal(b[i++], tagLength >>> 7 & 0x7f);
  assert.equal(b[i++], tagLength & 0x7f);
};

const verifyFrameHeader = (b, frameLength) => {
  let i = 0;
  // "TXXX"
  assert.equal(b[i++], 0x54);
  assert.equal(b[i++], 0x58);
  assert.equal(b[i++], 0x58);
  assert.equal(b[i++], 0x58);
  // Length
  assert.equal(b[i++], frameLength >>> 21 & 0x7f);
  assert.equal(b[i++], frameLength >>> 14 & 0x7f);
  assert.equal(b[i++], frameLength >>> 7 & 0x7f);
  assert.equal(b[i++], frameLength & 0x7f);
  // Flags
  assert.equal(b[i++], 0xe0);
  assert.equal(b[i++], 0x00);
  // Text encoding byte
  assert.equal(b[i++], 0x03);
  // Empty description
  assert.equal(b[i++], 0x00);
};

const verifyPayload = (b, expectedPayload) => {
  assert.equal(b.toString('utf8'), expectedPayload);
}

exports.veryifyId3 = (b, expectedPayload) => {
  const tagHeaderEnd = 10;
  const headerSize = 22;
  const frameHeaderEnd = tagHeaderEnd + 12;
  const tagLength = expectedPayload.length + 12 + 1;
  const frameLength = expectedPayload.length + 2 + 1;

  verifyTagHeader(b.slice(0, tagHeaderEnd), tagLength);
  verifyFrameHeader(b.slice(tagHeaderEnd, frameHeaderEnd), frameLength);
  verifyPayload(b.slice(frameHeaderEnd, expectedPayload.length + headerSize), expectedPayload);
};
