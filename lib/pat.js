/**
 * Program Association Table
 * @module lib/pat
 */

const { crc32 } = require('./crc32');

/*
 * Prototype for a TS packet containgin a PAT packet inside
 * The only thing that might change from this prototype is the
 * PID of the PMT
 */
const protoPAT = Buffer.from([
  0x47, // sync byte
  // tei:0 pusi:1 tp:0 pid:0 0000 0000 0000
  0x40, 0x00,
  // tsc:00 afc:01 cc:0000 pointer_field:0000 0000
  0x10, 0x00,
  // tid:0000 0000 ssi:1 0:0 r:11 sl:0000 0000 1101
  0x00, 0xb0, 0x0d,
  // tsi:0000 0000 0000 0001
  0x00, 0x01,
  // r:11 vn:00 000 cni:1 sn:0000 0000 lsn:0000 0000
  0xc1, 0x00, 0x00,
  // pn:0000 0000 0000 0001
  0x00, 0x01,
  // r:111 pmp:0 0000 0010 0000
  0xe0, 0x00,
  // crc32
  0x00, 0x00, 0x00, 0x00,
  // padding... 167 bytes
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
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
]);

/**
 * Generates a standard PAT packet directly into the buffer provided by the caller
 *
 * @param {Buffer} buffer - A pre-allocated buffer to fill with the PAT packet data
 * @param {Number} destination - The offset into the buffer to start writing the PAT packet
 * @param {Object} options - A configuration object that can be used to specify a PMT PID
 */
exports.generatePATPacket = (buffer, destination, options) => {
  const { pmtPid } = options;

  if (!Number.isFinite(pmtPid) || pmtPid < 4 || pmtPid >= 0x1fff) {
    throw new TypeError('The "pmtPid" option is required and must be a number in the range of 4 to 8190.');
  }
  if (buffer.length - destination < 188) {
    throw new RangeError('The amount of destination buffer remaining is less than the 188 bytes required for a PAT packet.');
  }

  protoPAT.copy(buffer, destination);

  buffer[destination + 15] |= (pmtPid >>> 8 & 0x1f);
  buffer[destination + 16] |= (pmtPid & 0xff);

  const crcOffset = destination + 17;
  crc32(buffer, crcOffset, destination + 5, crcOffset);
};
