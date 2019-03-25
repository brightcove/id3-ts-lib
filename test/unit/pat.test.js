const { generatePATPacket } = require('../../lib/pat');
const assert = require('assert');
const { verifyPat } = require('../utils');

describe('pat', () => {
  it('should generate a PAT with specified pmtPid', () => {
    const b = Buffer.alloc(188);
    generatePATPacket(b, 0, {pmtPid: 0x101});
    verifyPat(b, 0x101);
  });

  it('should throw if pmtPid is not a number', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePATPacket(b, 0, {}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: true}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: '20'}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if pmtPid is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: 0}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: -100}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: 10000}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if there is not enough room in the buffer for the PAT packet', () => {
    const b = Buffer.alloc(180);
    assert.throws(
      () => generatePATPacket(b, 0, {pmtPid: 0x101}),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });
});
