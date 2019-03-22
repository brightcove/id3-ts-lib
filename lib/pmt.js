/**
 * Program Map Table
 * @module lib/pmt
 */

const crc32 = require('./crc32');

/*
 * Prototype for a TS packet containgin a PMT packet inside
 * Much of this prototype will be overridden as the actual track metadata gets written
 */
const protoPMT = Buffer.from([
  0x47, // sync byte
  // tei:0 pusi:1 tp:0 pid:0 0000 0010 0000
  0x40, 0x00,
  // tsc:00 afc:01 cc:0000 pointer_field:0000 0000
  0x10, 0x00,
  // tid:0000 0010 ssi:1 0:0 r:11 sl:0000 0000 0000
  0x02, 0xb0, 0x00,
  // pn:0000 0000 0000 0001
  0x00, 0x01,
  // r:11 vn:00 000 cni:1 sn:0000 0000 lsn:0000 0000
  0xc1, 0x00, 0x00,
  // r:111 ppid:1 1111 1111 1111
  0xff, 0xff,
  // r:1111 pil:0000 0000 0000
  0xf0, 0x00,
  // padding... 171 bytes
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff,
]);

/**
 * Generates a standard PMT packet directly into the buffer provided by the caller
 *
 * @param {Buffer} buffer - A pre-allocated buffer to fill with the PMT packet data
 * @param {Number} destination - The offset into the buffer to start writing the PAT packet
 * @param {Object} options - A configuration object that can be used to optionally specify various PIDs for different tracks
 */
exports.generatePMTPacket = (buffer, destination, options) => {
  const { pmtPid, videoPid, audioPid, id3Pid } = options;

  protoPMT.copy(buffer, destination);
  buffer[destination + 1] |= (pmtPid >>> 8 & 0x1f);
  buffer[destination + 2] |= (pmtPid & 0xff);

  const sectionStart = destination + 8;
  let sectionLength = 9;
  let programInfoLength = 0;

  // Write the program_info descriptors
  if (id3Pid) {
    // write a metadata_pointer_descriptor
    // dt: 0010 0101
    buffer[sectionStart + (sectionLength++)] = 0x25;
    // dl: 0000 1101
    buffer[sectionStart + (sectionLength++)] = 0x0f;
    // maf: 1111 1111...
    buffer[sectionStart + (sectionLength++)] = 0xff;
    // maf: ...1111 1111
    buffer[sectionStart + (sectionLength++)] = 0xff;
    // mafid: 'I'...
    buffer[sectionStart + (sectionLength++)] = 0x49;
    // mafid: ...'D'...
    buffer[sectionStart + (sectionLength++)] = 0x44;
    // mafid: ...'3'...
    buffer[sectionStart + (sectionLength++)] = 0x33;
    // mafid: ...' '
    buffer[sectionStart + (sectionLength++)] = 0x20;
    // mf: 1111 1111
    buffer[sectionStart + (sectionLength++)] = 0xff;
    // mafid: 'I'...
    buffer[sectionStart + (sectionLength++)] = 0x49;
    // mafid: ...'D'...
    buffer[sectionStart + (sectionLength++)] = 0x44;
    // mafid: ...'3'...
    buffer[sectionStart + (sectionLength++)] = 0x33;
    // mafid: ...' '
    buffer[sectionStart + (sectionLength++)] = 0x20;
    // msid: 0000 0000
    buffer[sectionStart + (sectionLength++)] = 0x00;
    // mlf: 0 mcf: 00 r:1 1111
    buffer[sectionStart + (sectionLength++)] = 0x1f;
    // pnum: 0000 0000...
    buffer[sectionStart + (sectionLength++)] = 0x00;
    // pnum: ...0000 0001
    buffer[sectionStart + (sectionLength++)] = 0x01;
    programInfoLength += 17;
  }

  // Write the actual program_map
  if (videoPid) {
    // h264
    // st:0001 1010
    buffer[sectionStart + (sectionLength++)] = 0x1b;
    // r:111 epid:0 0000...
    buffer[sectionStart + (sectionLength++)] = 0xe0 | (videoPid >>> 8 & 0x1f);
    // epid: ...0001 0001
    buffer[sectionStart + (sectionLength++)] = (videoPid & 0xff);
    // r:1111 esil:0000...
    buffer[sectionStart + (sectionLength++)] = 0xf0;
    // esil: ...0000 0000
    buffer[sectionStart + (sectionLength++)] = 0x00;
  }

  if (audioPid) {
    // adts
    // st:0000 1111
    buffer[sectionStart + (sectionLength++)] = 0x0f;
    // r:111 epid:0 0000...
    buffer[sectionStart + (sectionLength++)] = 0xe0 | (audioPid >>> 8 & 0x1f);
    // epid: ...0000 0000
    buffer[sectionStart + (sectionLength++)] = (audioPid & 0xff);
    // r:1111 esil:0000...
    buffer[sectionStart + (sectionLength++)] = 0xf0;
    // esil: ...0000 0000
    buffer[sectionStart + (sectionLength++)] = 0x00;
  }

  if (id3Pid) {
    // timed metadata
    // st:0001 0111
    buffer[sectionStart + (sectionLength++)] = 0x15;
    // r:111 epid:0 0000...
    buffer[sectionStart + (sectionLength++)] = 0xe0 | (id3Pid >>> 8 & 0x1f);
    // epid ...0001 0011
    buffer[sectionStart + (sectionLength++)] = (id3Pid & 0xff);
    // r:1111 esil:0000...
    buffer[sectionStart + (sectionLength++)] = 0xf0;
    // esil: ...0000 1111
    buffer[sectionStart + (sectionLength++)] = 0x0f;

    // Write the metadata_descriptor for ID3 tags...
    // dt: 0010 0110
    buffer[sectionStart + (sectionLength++)] = 0x26;
    // dl: 0000 1101
    buffer[sectionStart + (sectionLength++)] = 0x0d;
    // maf: 1111 1111...
    buffer[sectionStart + (sectionLength++)] = 0xff;
    // maf: ...1111 1111
    buffer[sectionStart + (sectionLength++)] = 0xff;
    // mafid: 'I'...
    buffer[sectionStart + (sectionLength++)] = 0x49;
    // mafid: ...'D'...
    buffer[sectionStart + (sectionLength++)] = 0x44;
    // mafid: ...'3'...
    buffer[sectionStart + (sectionLength++)] = 0x33;
    // mafid: ...' '
    buffer[sectionStart + (sectionLength++)] = 0x20;
    // mf: 1111 1111
    buffer[sectionStart + (sectionLength++)] = 0xff;
    // mafid: 'I'...
    buffer[sectionStart + (sectionLength++)] = 0x49;
    // mafid: ...'D'...
    buffer[sectionStart + (sectionLength++)] = 0x44;
    // mafid: ...'3'...
    buffer[sectionStart + (sectionLength++)] = 0x33;
    // mafid: ...' '
    buffer[sectionStart + (sectionLength++)] = 0x20;
    // msid: 0000 0000
    buffer[sectionStart + (sectionLength++)] = 0x00;
    // dcf: 000 dsmf: 00 resv: 1111
    buffer[sectionStart + (sectionLength++)] = 0x0f;
  }
  const crcOffset = sectionStart + sectionLength;
  // crc32 length
  sectionLength += 4;
  buffer[destination + 6] |= (sectionLength >>> 8 & 0x0f);
  buffer[destination + 7] |= (sectionLength & 0xff);

  buffer[destination + 15] |= (programInfoLength >>> 8 & 0x0f);
  buffer[destination + 16] |= (programInfoLength & 0xff);

  crc32(buffer, crcOffset, destination + 5, crcOffset);
};
