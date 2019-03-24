const { id3TagChunked } = require('../../lib/id3');
const assert = require('assert');

const testPayload = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis euismod tellus quis turpis tincidunt, et interdum metus rutrum.';
const FRAME_SIZE = testPayload.length + 2 + 1;
const TAG_SIZE = testPayload.length + 12 + 1;

const TAG_LENGTH_1 = TAG_SIZE >>> 7 & 0x7f;
const TAG_LENGTH_0 = TAG_SIZE & 0x7f;
const FRAME_LENGTH_1 = FRAME_SIZE >>> 7 & 0x7f;
const FRAME_LENGTH_0 = FRAME_SIZE & 0x7f;

const verifyTagHeader = (b, gap = false) => {
  let i = 0;
  // "ID3"
  assert.equal(b[i++], 0x49);
  assert.equal(b[i++], 0x44);
  assert.equal(b[i++], 0x33);
  // Major version
  assert.equal(b[i++], 0x04);
  // Gap
  if (gap) {
    assert.equal(b[i++], 0x00);
  }
  // Minor version
  assert.equal(b[i++], 0x00);
  // Flags
  assert.equal(b[i++], 0x00);
  // Length
  assert.equal(b[i++], 0x00);
  assert.equal(b[i++], 0x00);
  assert.equal(b[i++], TAG_LENGTH_1);
  assert.equal(b[i++], TAG_LENGTH_0);
};

const verifyFrameHeader = (b, gap = false) => {
  let i = 0;
  // "TXXX"
  assert.equal(b[i++], 0x54);
  assert.equal(b[i++], 0x58);
  assert.equal(b[i++], 0x58);
  assert.equal(b[i++], 0x58);
  // Length
  assert.equal(b[i++], 0x00);
  assert.equal(b[i++], 0x00);
  // Gap
  if (gap) {
    assert.equal(b[i++], 0x00);
  }
  assert.equal(b[i++], FRAME_LENGTH_1);
  assert.equal(b[i++], FRAME_LENGTH_0);
  // Flags
  assert.equal(b[i++], 0xe0);
  assert.equal(b[i++], 0x00);
  // Text encoding byte
  assert.equal(b[i++], 0x03);
  // Empty description
  assert.equal(b[i++], 0x00);
};

const verifyPayload = (b) => {
  assert.equal(b.toString('utf8'), testPayload);
}

const veryifyId3 = (b, gap = false) => {
  let tagHeaderEnd = 10;
  let headerSize = 22;
  if (gap) {
    tagHeaderEnd++;
    headerSize++;
  }
  let frameHeaderEnd = tagHeaderEnd + 12;
  if (gap) {
    frameHeaderEnd++;
    headerSize++;
  }

  verifyTagHeader(b.slice(0, tagHeaderEnd), gap);
  verifyFrameHeader(b.slice(tagHeaderEnd, frameHeaderEnd), gap);
  verifyPayload(b.slice(frameHeaderEnd, testPayload.length + headerSize));
};

describe('id3', () => {
  it('should be able to write an entire id3 tag in one go', () => {
    const b = Buffer.alloc(TAG_SIZE + 10);
    id3TagChunked(b, 0, 0, testPayload.length + 22, testPayload);
    veryifyId3(b);
  });

  it('should be able to write a portion of the tag header', () => {
    const b = Buffer.alloc(TAG_SIZE + 10);
    id3TagChunked(b, 0, 0, 4, testPayload);
    id3TagChunked(b, 4, 4, testPayload.length + 22, testPayload);
    veryifyId3(b);
  });

  it('should be able to write a portion of the frame header', () => {
    const b = Buffer.alloc(TAG_SIZE + 10);
    id3TagChunked(b, 0, 0, 15, testPayload);
    id3TagChunked(b, 15, 15, testPayload.length + 22, testPayload);
    veryifyId3(b);
  });

  it('should be able to write a portion of the payload header', () => {
    const b = Buffer.alloc(TAG_SIZE + 10);
    id3TagChunked(b, 0, 0, 35, testPayload);
    id3TagChunked(b, 35, 35, testPayload.length + 22, testPayload);
    veryifyId3(b);
  });

  it('should be able to write id3 contents out of order', () => {
    const b = Buffer.alloc(TAG_SIZE + 10);
    id3TagChunked(b,  0,  0,  4, testPayload);
    id3TagChunked(b, 15, 15, 35, testPayload);
    id3TagChunked(b,  4,  4, 15, testPayload);
    id3TagChunked(b, 35, 35, testPayload.length + 22, testPayload);
    veryifyId3(b);
  });

  it('should be able to write id3 contents with gaps', () => {
    const b = Buffer.alloc(TAG_SIZE + 10 + 2);
    id3TagChunked(b,  0,  0,  4, testPayload);
    // Skip 1 byte
    id3TagChunked(b,  5,  4, 15, testPayload);
    // Skip 1 byte
    id3TagChunked(b, 17, 15, testPayload.length + 22, testPayload);
    veryifyId3(b, true);
  });
});
