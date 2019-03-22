/**
 * Program Elementary Stream
 * @module lib/pes
 */

/**
 * Convert a Number representing a timestamp in the 90khz clock into a 5-byte PES value
 *
 * @param {Number} timestamp - The 90khz timestamp to convert into bytes
 * @param {Buffer} buffer - The buffer to write the bytes into
 * @param {Number} destination - The offset into buffer where we will start writing timestamp bytes
 */
const makeTimestampBytes = (timestamp, buffer, destination) => {
  // equivalent to right shift by 1
  const ptsShiftRight1 = Math.floor(timestamp / 2);
  const leftMostBit = ((ptsShiftRight1 & 0x80000000) >>> 31) & 0x01;
  // remove left most bit
  const ptsLower32 = timestamp & 0xffffffff;
  const firstThreeBits = (leftMostBit << 3) | (ptsLower32 >>> 29 & 0x06) | 0x01;

  buffer[destination + 0] = (0x2 << 4) | firstThreeBits;
  buffer[destination + 1] = (ptsLower32 >>> 22) & 0xff;
  buffer[destination + 2] = ((ptsLower32 >>> 14) | 0x01) & 0xff;
  buffer[destination + 3] = (ptsLower32 >>> 7) & 0xff;
  buffer[destination + 4] = ((ptsLower32 << 1) | 0x01) & 0xff;
};

/*
 * Prototype for the PES Header
 * Many bytes will be overwriten as they represent various length values that are dynamic
 */
const protoPES = Buffer.from([
  // pscp:0000 0000 0000 0000 0000 0001
  0x00, 0x00, 0x01,
  // sid:0000 0000 ppl:0000 0000 0000 0000
  0xbd, 0x00, 0x00,
  // 10 psc:00 pp:0 dai:1 c:0 ooc:0
  0x84,
  // pdf:?0 ef:0 erf:0 dtmf:0 acif:0 pcf:0 pef:0
  0x00,
  // phdl:0000 0000
  0x00,
]);

/**
 * Write a PES header directly into a pre-allocated buffer
 *
 * @param {Buffer} pesPacket - The buffer to write the bytes into
 * @param {Number} destination - The offset to begin writing the PES packet into the buffer
 * @param {Number?} pts - The Presentation Time Stamp value for this PES packet
 * @param {Number?} dataLength - The length of the contents that this packet will contain
 * @param {Number?} paddingLength - Amount of padding that will be added to the header to make the total PES packet a multiple of 184 bytes
 */
exports.generatePESHeader = (pesPacket, destination, pts = null, dataLength = 0, headerPaddingLength = 0) => {
  // Add the pes header length (only the portion after the
  // pes_packet_length field)
  dataLength += 3;

  protoPES.copy(pesPacket, destination);

  // Only store 15 bits of the PTS for QUnit.testing purposes
  if (!isNaN(pts)) {
    makeTimestampBytes(pts, pesPacket, destination + 9);
    // Add the bytes spent on the pts info
    dataLength += 5;
  }
  dataLength += headerPaddingLength;

  // Finally set the pes_packet_length field
  pesPacket[destination + 4] = dataLength >>> 8 & 0xff;
  pesPacket[destination + 5] = dataLength & 0xff;

  pesPacket[destination + 7] = (pts ? 0x80 : 0x00);
  pesPacket[destination + 8] = (pts ? 0x05 : 0x00) + headerPaddingLength;
};
