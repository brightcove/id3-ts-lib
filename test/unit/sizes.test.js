const { calculateOutputBufferLength } = require('../../lib/sizes');
const assert = require('assert');

describe('./lib/sizes', () => {
  it('should calculate the required buffer', () => {
    // Minimum TS size - PAT, PMT and a single TS packet for PES
    assert.equal(calculateOutputBufferLength(1), 188 * 3);
    // Maximum PES payload that can fit in one TS packet
    assert.equal(calculateOutputBufferLength(147), 188 * 3);
    // Smallest PES payload that takes more than one TS packet
    assert.equal(calculateOutputBufferLength(148), 188 * 4);
    // Check a size that is roughly the expected size of production tags
    assert.equal(calculateOutputBufferLength(2000), 188 * 14);
    // Check a crazy size tag
    assert.equal(calculateOutputBufferLength(4000000), 188 * 21742);
  });
});
