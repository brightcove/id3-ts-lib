const { generatePMTPacket } = require('../../lib/pmt');
const assert = require('assert');

const { verifyPmt } = require('../utils');

describe('pmt', () => {
  it('should generate a PMT with specified pmtPid and id3Pid', () => {
    const b = Buffer.alloc(188);
    generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0x180});
    verifyPmt(b, 0x101, 0x180);
  });

  it('should throw if pmtPid is not a number', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: true, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: '20', id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if pmtPid is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: -100, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 10000, id3Pid: 0x180}),
      {
        name: 'TypeError',
        message: /pmtPid/i,
      });
  });

  it('should throw if id3Pid is not a number', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: true}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: '20'}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });
  });

  it('should throw if id3Pid is out of bounds', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: -100}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });

    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 10000}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });
  });

  it('should throw if id3Pid and pmtPid are the equal', () => {
    const b = Buffer.alloc(188);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0x101}),
      {
        name: 'TypeError',
        message: /id3Pid/i,
      });
  });

  it('should throw if there is not enough room in the buffer for the PMT packet', () => {
    const b = Buffer.alloc(180);
    assert.throws(
      () => generatePMTPacket(b, 0, {pmtPid: 0x101, id3Pid: 0x180}),
      {
        name: 'RangeError',
        message: /remaining/i,
      });
  });

});
