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
 * @param {Number?} dataLength - The length of the contents that this packet will contain
 * @param {Boolean?} payloadUnitStartIndicator - Add flag to header to indicate that the TS packet contains a new PES packet
 */
exports.generateTSHeader = (buffer, destination, pid, continuityCounter = 0, dataLength = 0, payloadUnitStartIndicator = false) => {
  let adaptationFieldLength = 0;
  let adaptationFieldCode = 1;
  let headerLength = 4;

  if (!Number.isFinite(pid) || pid < 4 || pid >= 0x1fff) {
    throw new Error('The "pid" option is required for TS packets and must be a number in the range of 4 to 8190.');
  }
  if (buffer.length - destination < 188) {
    throw new Error('The amount of destination buffer remaining is less than the 188 bytes required for a TS packet.');
  }

  // sync-byte
  buffer[destination + 0] = 0x47;

  // transport_packet(), Rec. ITU-T H.222.0, Table 2-2
  if (dataLength < 184) {
    adaptationFieldCode = 3;
    adaptationFieldLength = 183 - dataLength;
  }

  buffer[destination + 1] = (payloadUnitStartIndicator ? 0x40 : 0x00) | (pid >>> 8 & 0x1f);
  buffer[destination + 2] = pid & 0xff;
  buffer[destination + 3] = (adaptationFieldCode << 4) | (continuityCounter & 0x0f);

  if (adaptationFieldCode !== 1) {
    // afl
    buffer[destination + 4] = adaptationFieldLength & 0xff;
    headerLength = 5 + adaptationFieldLength;
  }

  if (adaptationFieldLength > 0) {
    if (pusi) {
      // di:0 rai:1 espi:0 pf:0 of:0 spf:0 tpdf:0 afef:0
      buffer[destination + 5] = 0x40;
    } else {
      // di:0 rai:1 espi:0 pf:0 of:0 spf:0 tpdf:0 afef:0
      buffer[destination + 5] = 0x00;
    }
  }

  // Insert padding bytes if necessary for the adaption field to reach the correct length
  for (let i = 1; i < adaptationFieldLength; i ++) {
    buffer[destination + i + 5] = 0xff;
  }
};
