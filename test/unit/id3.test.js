const { id3TagChunked } = require('../../lib/id3');
const assert = require('assert');
const {
  veryifyId3,
} = require('../utils');

const testPayload = Buffer.from('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod tellus quis turpis tincidunt, et interdum metus rutrum.');
const TAG_SIZE = testPayload.length + 22 + 1;

describe('id3', () => {
  it('should be able to write an entire id3 tag in one go', () => {
    const b = Buffer.alloc(TAG_SIZE);
    id3TagChunked(b, 0, 0, TAG_SIZE, testPayload);
    veryifyId3(b, testPayload);
  });

  it('should be able to write a portion of the tag header', () => {
    const b = Buffer.alloc(TAG_SIZE);
    id3TagChunked(b, 0, 0, 4, testPayload);
    id3TagChunked(b, 4, 4, TAG_SIZE, testPayload);
    veryifyId3(b, testPayload);
  });

  it('should be able to write a portion of the frame header', () => {
    const b = Buffer.alloc(TAG_SIZE);
    id3TagChunked(b, 0, 0, 15, testPayload);
    id3TagChunked(b, 15, 15, TAG_SIZE, testPayload);
    veryifyId3(b, testPayload);
  });

  it('should be able to write a portion of the payload header', () => {
    const b = Buffer.alloc(TAG_SIZE);
    id3TagChunked(b, 0, 0, 35, testPayload);
    id3TagChunked(b, 35, 35, TAG_SIZE, testPayload);
    veryifyId3(b, testPayload);
  });

  it('should be able to write id3 contents out of order', () => {
    const b = Buffer.alloc(TAG_SIZE);
    id3TagChunked(b,  0,  0,  4, testPayload);
    id3TagChunked(b, 15, 15, 35, testPayload);
    id3TagChunked(b,  4,  4, 15, testPayload);
    id3TagChunked(b, 35, 35, TAG_SIZE, testPayload);
    veryifyId3(b, testPayload);
  });

  it('should write a null-terminator to the byte after the payload', () => {
    const b = Buffer.alloc(TAG_SIZE);
    b[b.length - 1] = 0x55;
    id3TagChunked(b, 0, 0, TAG_SIZE, testPayload);
    veryifyId3(b, testPayload);
  });

  it('should be able to write id3 contents with gaps', () => {
    const b = Buffer.alloc(TAG_SIZE + 2);
    id3TagChunked(b,  0,  0,  4, testPayload);
    // Skip 1 byte
    id3TagChunked(b,  5,  4, 15, testPayload);
    // Skip 1 byte
    id3TagChunked(b, 17, 15, TAG_SIZE, testPayload);

    // Remove the gaps
    const b2 = Buffer.alloc(TAG_SIZE);
    b.copy(b2, 0, 0, 4);
    b.copy(b2, 4, 5, 16);
    b.copy(b2, 15, 17, TAG_SIZE + 2);

    // Test with the gaps removed
    veryifyId3(b2, testPayload);
  });

  it('should throw if there is not enough room in the buffer for the id3 tag', () => {
    const b = Buffer.alloc(TAG_SIZE - 2);
    assert.throws(
      () => id3TagChunked(b, 0, 0, TAG_SIZE, testPayload),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

});
