/**
 * Common sizes and size-calculators
 * @module lib/sizes
 */

// Byte lengths of various components of MPEG2TS bitstreams
const TS_PACKET = 188;
const PAT = TS_PACKET;
const PMT = TS_PACKET;
const PES_HEADER = 9;
const PTS = 5;
const TS_HEADER_NO_ADAPTATION = 4;

// Byte length of a byte
// This is called out here to make it clear why we are adding 1 to various lengths in the maths below
const NULL_BYTE = 1;

// Byte lengths of various componenets of ID3 tags
const ID3_TAG_HEADER = 10;
const ID3_FRAME_HEADER = 10;
const ID3_FRAME_TEXT_ENCODING = 1;
const ID3_FRAME_TXXX_HEADER = ID3_FRAME_HEADER + ID3_FRAME_TEXT_ENCODING + NULL_BYTE;

/**
 * Compute the value that should be put into the TXXX frame header's length field
 *
 * @param {Number} payloadLength - The length in bytes of the intended ID3 contents
 * @param {Number?} descriptionLength - The length of the optional TXXX-frame description field
 */
exports.calculateId3FrameLength = (payloadLength, descriptionLength = 0) => ID3_FRAME_HEADER + ID3_FRAME_TEXT_ENCODING + descriptionLength + NULL_BYTE + payloadLength + NULL_BYTE;

/**
 * Compute the value that should be put into the ID3 tag header's length field
 *
 * @param {Number} payloadLength - The length in bytes of the intended ID3 contents
 * @param {Number?} descriptionLength - The length of the optional TXXX-frame description field
 */
exports.calculateId3TagLength = (payloadLength, descriptionLength = 0) => ID3_TAG_HEADER + exports.calculateId3FrameLength(payloadLength, descriptionLength);

/**
 * Compute the size of the final TS segment based on the intended ID3 payload length
 *
 * @param {Number} payloadLength - The length in bytes of the intended ID3 contents
 * @param {Number?} descriptionLength - The length of the optional TXXX-frame description field
 */
exports.calculateOutputBufferLength = (payloadLength, descriptionLength = 0) => {
  const ID3 = exports.calculateId3TagLength(payloadLength, descriptionLength);
  const UNPADDED_PES = PES_HEADER + PTS + ID3;

  // This has the effect of calculating the result of calculating the payload
  // including any padding necessary
  const PAYLOAD = Math.ceil(UNPADDED_PES / 184) * 188;

  return PAT + PMT + PAYLOAD;
};

exports.sizeOf = {
  PAT,
  PMT,
  ID3_TAG_HEADER,
  ID3_FRAME_HEADER,
  ID3_FRAME_TXXX_HEADER,
  ID3_FRAME_TEXT_ENCODING,
  NULL_BYTE,
  PES_HEADER,
  PTS,
  TS_PACKET,
  TS_HEADER_NO_ADAPTATION,
};
