const generateSegment = require('../../');
const assert = require('assert');
const {
  getPid,
  verifyTs,
  verifyPesHeader,
  veryifyId3,
  verifyPat,
  verifyPmt,
} = require('../utils');

describe('generateSegment', () => {
  it('should generate a single-TS segment', () => {
    const options = {
      pmtPid: 0x101,
      id3Pid: 0x180,
      id3PTS: 1234567890,
      data: `This is a short example here bud`,
    };
    const b = generateSegment.sync(options);

    // First, make sure it's exactly 3 TS packets long
    assert.equal(b.length, 564);

    // Verify the first packet - the PAT
    verifyPat(b, options.pmtPid);

    // Verify the second packet - the PMT
    const secondPacket = b.slice(188);
    verifyPmt(secondPacket, options.pmtPid, options.id3Pid);

    // Verify the last packet - the PES
    const lastPacket = b.slice(376);
    const pesHeader = lastPacket.slice(4);
    const id3TagLength = 10 + 12 + options.data.length + 1;
    const paddingLength = 184 - (id3TagLength + 14);
    const id3StartByte = 4 + 14 + paddingLength;

    verifyPesHeader(pesHeader, options.id3PTS, id3TagLength, paddingLength);
    veryifyId3(lastPacket.slice(id3StartByte), options.data);
  });

  it('should generate a double-TS segment', () => {
    const options = {
      pmtPid: 0x101,
      id3Pid: 0x180,
      id3PTS: 1234567890,
      data: '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678',
    };
    const b = generateSegment.sync(options);

    // First, make sure it's exactly 4 TS packets long
    assert.equal(b.length, 752);

    // Verify the first packet - the PAT
    verifyPat(b, options.pmtPid);

    // Verify the second packet - the PMT
    const secondPacket = b.slice(188);
    verifyPmt(secondPacket, options.pmtPid, options.id3Pid);

    // Verify the third packet - the PES
    const thirdtPacket = b.slice(376);
    const pesHeader = thirdtPacket.slice(4);
    const id3TagLength = 10 + 12 + options.data.length + 1;
    const paddingLength = 368 - (id3TagLength + 14);
    const id3StartByte = 4 + 14 + paddingLength + 4;

    verifyTs(thirdtPacket, options.id3Pid, 0, true);
    verifyPesHeader(pesHeader, options.id3PTS, id3TagLength, paddingLength);
     // console.log(thirdtPacket.slice(id3StartByte).toString('hex').replace(/(\w\w)/g, '0x$1, '));

    veryifyId3(thirdtPacket.slice(id3StartByte), options.data);

    // Verify the last packet - the PES (cont.)
    const lastPacket = b.slice(564);
    verifyTs(lastPacket, options.id3Pid, 1, false);
  });
});
