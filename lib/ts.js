/**
 * Transport Stream (packets)
 * @module lib/ts
 */

 /**
 * Write a TS header directly into a pre-allocated buffer
 *
 * @param {Buffer} buffer - The buffer to write the TS header into
 * @param {Number} destination -  The offset into buffer where we will start writing the TS header
 * @param {Number} pid - The Packet ID to use for this TS packet
 * @param {Number?} continuityCounter - A counter that must be incremeted for each packet with the same PID
 * @param {Boolean?} payloadUnitStartIndicator - Add flag to header to indicate that the TS packet contains a new PES packet
 */
exports.generateTSHeader = (buffer, destination, pid, continuityCounter = 0, payloadUnitStartIndicator = false) => {
  if (!Number.isFinite(pid) || pid < 4 || pid >= 0x1fff) {
    throw new TypeError('The "pid" option is required for TS packets and must be a number in the range of 4 to 8190.');
  }
  if (buffer.length - destination < 188) {
    throw new RangeError('The amount of destination buffer remaining is less than the 188 bytes required for a TS packet.');
  }

  // sync-byte
  buffer[destination + 0] = 0x47;
  // tei:0 pusi:1 tp:0 pid:0 0000...
  buffer[destination + 1] = (payloadUnitStartIndicator ? 0x40 : 0x00) | (pid >>> 8 & 0x1f);
  // pid: ...0001 0001
  buffer[destination + 2] = pid & 0xff;
  // tsc:00 afc:01 cc:0000
  buffer[destination + 3] = 0x10 | (continuityCounter & 0x0f);
};
