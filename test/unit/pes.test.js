const { generatePESHeader } = require('../../lib/pes');
const assert = require('assert');
const { verifyPesHeader } = require('../utils');

describe('./lib/pes', () => {
  it('should generate a PES with specified PTS', () => {
    const b = Buffer.alloc(14);
    generatePESHeader(b, 0, 6135667565, 100, 20);
    verifyPesHeader(b, 6135667565, 100, 20);
  });

  it('should generate a PES without a PTS', () => {
    const b = Buffer.alloc(9);
    generatePESHeader(b, 0, null, 100, 20);
    verifyPesHeader(b, null, 100, 20);
  });

  it('should throw if there is not enough room in the buffer for the PES header', () => {
    const b = Buffer.alloc(14);
    assert.throws(
      () => generatePESHeader(b, 1, 6135667565, 100, 20),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

  it('should throw if there is not enough room in the buffer for the PES header without PTS', () => {
    const b = Buffer.alloc(9);
    assert.throws(
      () => generatePESHeader(b, 1, null, 100, 20),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

});
