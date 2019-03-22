/**
 * ID3 Module
 * @module lib/id3
 */

const {
    sizeOf,
    calculateId3TagLength,
    calculateId3FrameLength,
    calculateOutputBufferLength,
  } = require('./sizes');

/**
 * Copies a portion of a string into a buffer, in place, without allocating any new Buffers.
 *
 * @param {String} payload - The text to convert into a buffer
 * @param {Buffer} buffer - A pre-allocated buffer to fill. Allowed to be shorter than the length of the payload but must fit the ranges specified
 * @param {Number} destination - The offset into the buffer from which to start writing the 'payload'.
 * @param {Number} startOffset - The offset into the payload from which to start writing to 'buffer'.
 * @param {Number} endOffset - The offset into the payload from which to stop writing to 'buffer'.
 */
const stringToBufferChunked = (payload, buffer, destination, startOffset, endOffset) => {
  const copyAmount = endOffset - startOffset;

  if (copyAmount > buffer.length - destination) {
    throw new Error('Size of substring specified exceeds the size of the destination buffer.');
  }
  for (let i = 0; i < copyAmount; i++) {
    buffer[i + destination] = payload.charCodeAt(i + startOffset);
  }
};

/*
 * Prototype for the ID3 Tag Header
 */
const protoId3Tag = Buffer.from([
  0x49, 0x44, 0x33,      // 'ID3'
  0x04, 0x00,            // version 4.0 of ID3v2 (aka ID3v.2.4.0)
  0x00,                  // flags
  0x00, 0x00, 0x00, 0x00, // size. set later
]);

/*
 * Prototype for the ID3 Frame Header
 * ...for the TXXX frame type
 */
const protoId3FrameTXXX = Buffer.from([
  0x54, 0x58, 0x58, 0x58, // 'TXXX'
  0x00, 0x00, 0x00, 0x00, // size
  0xe0, 0x00,             // flags
  0x03,                   // Text encoding byte - UTF-8 encoding
  0x00,                   // empty description
]);

/**
 * Generates a specified portion (a "chunk") of an ID3 tag. The tag is hard-coded to contain a single TXXX frame with the payload.
 *
 * @param {Buffer} buffer - A pre-allocated buffer to fill. Allowed to be shorter than the length of the id3 tag
 * @param {Number} destination - The offset to begin writing the ID3 tag into the buffer
 * @param {Number} startOffset - The absolute offset into the id3-tag from which to start writing to 'buffer'
 * @param {Number} endOffset - The absolute offset into the id3-tag from which to stop writing into the 'buffer'
 * @param {String} payload - The text that the id3-tag will contain.
 */
exports.id3TagChunked = (buffer, destination, startOffset, endOffset, payload) => {
  if (startOffset < sizeOf.ID3_TAG_HEADER && endOffset > 0) {
    // Write ID3 header
    if (startOffset === 0 && endOffset > 0) {
      buffer[destination] = 0x49;
    }
    if (startOffset <= 1 && endOffset > 1) {
      buffer[destination + 1 - startOffset] = 0x44;
    }
    if (startOffset <= 2 && endOffset > 2) {
      buffer[destination + 2 - startOffset] = 0x33;
    }
    // Write ID3 major version
    if (startOffset <= 3 && endOffset > 3) {
      buffer[destination + 3 - startOffset] = 0x04;
    }
    // Write ID3 minor version
    if (startOffset <= 4 && endOffset > 4) {
      buffer[destination + 4 - startOffset] = 0x00;
    }
    // Write ID3 TAG flags
    if (startOffset <= 5 && endOffset > 5) {
      buffer[destination + 5 - startOffset] = 0x00;
    }
    const tagContentLength = calculateId3FrameLength(payload.length);
    // tagContentLength is stored as a sequence of four 7-bit integers with the high bit
    // of each byte set to zero (in id3 these are termed "sync-safe integers")
    if (startOffset <= 6 && endOffset > 6) {
      buffer[destination + 6 - startOffset] = (tagContentLength >>> 21) & 0x7f;
    }
    if (startOffset <= 7 && endOffset > 7) {
      buffer[destination + 7 - startOffset] = (tagContentLength >>> 14) & 0x7f;
    }
    if (startOffset <= 8 && endOffset > 8) {
      buffer[destination + 8 - startOffset] = (tagContentLength >>> 7) & 0x7f;
    }
    if (startOffset <= 9 && endOffset > 9) {
      buffer[destination + 9 - startOffset] = tagContentLength & 0x7f;
    }
  }

  const ID3_TAG_AND_FRAME_HEADERS = sizeOf.ID3_TAG_HEADER + sizeOf.ID3_FRAME_TXXX_HEADER;
  if (startOffset < ID3_TAG_AND_FRAME_HEADERS && endOffset > sizeOf.ID3_TAG_HEADER) {
    // Frame Type ("TXXX")
    if (startOffset <= 10 && endOffset > 10) {
      buffer[destination + 10 - startOffset] = 0x54;
    }
    if (startOffset <= 11 && endOffset > 11) {
      buffer[destination + 11 - startOffset] = 0x58;
    }
    if (startOffset <= 12 && endOffset > 12) {
      buffer[destination + 12 - startOffset] = 0x58;
    }
    if (startOffset <= 13 && endOffset > 13) {
      buffer[destination + 13 - startOffset] = 0x58;
    }
    const frameContentLength = sizeOf.ID3_FRAME_TEXT_ENCODING + sizeOf.NULL_BYTE + payload.length + sizeOf.NULL_BYTE;
    // frameContentLength is stored as a sequence of four 7-bit integers with the high bit
    // of each byte set to zero (in id3 these are termed "sync-safe integers")
    if (startOffset <= 14 && endOffset > 14) {
      buffer[destination + 14 - startOffset] = (frameContentLength >>> 21) & 0x7f;
    }
    if (startOffset <= 15 && endOffset > 15) {
      buffer[destination + 15 - startOffset] = (frameContentLength >>> 14) & 0x7f;
    }
    if (startOffset <= 16 && endOffset > 16) {
      buffer[destination + 16 - startOffset] = (frameContentLength >>> 7) & 0x7f;
    }
    if (startOffset <= 17 && endOffset > 17) {
      buffer[destination + 17 - startOffset] = frameContentLength & 0x7f;
    }
    // frame flags
    if (startOffset <= 18 && endOffset > 18) {
      buffer[destination + 18 - startOffset] = 0xe0;
    }
    if (startOffset <= 19 && endOffset > 19) {
      buffer[destination + 19 - startOffset] = 0x00;
    }
    // Text-type descriptor
    if (startOffset <= 20 && endOffset > 20) {
      buffer[destination + 20 - startOffset] = 0x03;
    }
    // Empty description field (null-terminated zero-length string)
    if (startOffset <= 21 && endOffset > 21) {
      buffer[destination + 21 - startOffset] = 0x00;
    }
  }

  const tagLength = calculateId3TagLength(payload.length);
  if (startOffset < tagLength && endOffset > ID3_TAG_AND_FRAME_HEADERS) {
    const payloadStartOffset = Math.max(0, startOffset - ID3_TAG_AND_FRAME_HEADERS);
    const payloadEndOffset = endOffset - ID3_TAG_AND_FRAME_HEADERS;
    const destinationNew = destination + Math.max(0, ID3_TAG_AND_FRAME_HEADERS - startOffset);
    //write any payload in the current chunk
    stringToBufferChunked(payload, buffer, destinationNew, payloadStartOffset, payloadEndOffset);
  }
};

