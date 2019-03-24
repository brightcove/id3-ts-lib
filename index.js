const { generatePATPacket } = require('./lib/pat');
const { generatePMTPacket } = require('./lib/pmt');
const { generatePESHeader } = require('./lib/pes');
const { generateTSHeader } = require('./lib/ts');
const { id3TagChunked } = require('./lib/id3');
const {
    sizeOf,
    calculateId3TagLength,
    calculateId3FrameLength,
    calculateOutputBufferLength,
  } = require('./lib/sizes');

const MAX_TS_PAYLOAD = sizeOf.TS_PACKET - sizeOf.TS_HEADER_NO_ADAPTATION;

const padding = Buffer.from([
  // padding... 300 bytes max
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
]);

/**
 * Write one or more TS headers directly into a buffer
 *
 * @param {Buffer} outputBuffer - The buffer to write TS headers into every 188 bytes
 * @param {Number} destination - The offset to begin writing into the buffer
 * @param {Number} pid - The PID to use for these new headers
 */
const fillOutTSHeaders = (outputBuffer, destination, pid) => {
  // The first TS packet always start a new PES
  let payloadUnitStartIndicator = true;
  // Where else should we start?
  let continuityCounter = 0;

  for (let packetOffset = destination; packetOffset < outputBuffer.length; packetOffset += sizeOf.TS_PACKET) {
    generateTSHeader(
      outputBuffer,
      packetOffset,
      pid,
      continuityCounter,
      MAX_TS_PAYLOAD,
      payloadUnitStartIndicator);

    // Make sure every other TS header indicates a continuation of the same PES packet
    payloadUnitStartIndicator = false;
    // The continutyCounter is only 4-bits but the rollover is handled by the generateTSHeader
    // so we don't have to worry about it here
    continuityCounter++;
  }
};

/**
 * Write out the appropriate amount of padding taking into account TS packet boundaries.
 * This is only designed to work with an amount of padding that completely fits into the
 * first and second TS packets. Greater amounts will fail.
 *
 * @param {Buffer} outputBuffer -The buffer to insert padding into
 * @param {Number} destination - The offset to begin writing into the buffer
 * @param {Number} paddingNeeded - Number of bytes of padding to insert
 * @returns {Number}
 */
const writeHeaderPadding = (outputBuffer, destination, paddingNeeded, id3Pid) => {
  const NEXT_PAYLOAD_START = destination + sizeOf.TS_PACKET + sizeOf.TS_HEADER_NO_ADAPTATION;
  // This is the padding remaining after fully-padding the TS first packet.
  //  - If it is less than zero, then we only need to pad a portion of the first TS packet.
  //  - If it is greater than zero then the padding runs into the second TS packet.
  const paddingRemaining = sizeOf.PES_HEADER + sizeOf.PTS + paddingNeeded - MAX_TS_PAYLOAD;

  // This math means that we are assuming outbuffer is TS boundary-aligned
  const paddingStart = destination + 4 + sizeOf.PES_HEADER + sizeOf.PTS;
  const paddingAmount = Math.min(destination + sizeOf.TS_PACKET, paddingNeeded + paddingStart) - paddingStart;

  // Write the padding into the first TS packet
  padding.copy(outputBuffer,
    paddingStart,
    0,
    paddingAmount);

  let destinationStart = destination + sizeOf.TS_PACKET + paddingRemaining;
  if (paddingRemaining >= 0) {
    generateTSHeader(
      outputBuffer,
      destination,
      id3Pid,
      1,
      MAX_TS_PAYLOAD,
      false);
    // The padding runneth over into the second TS packet
    destinationStart += sizeOf.TS_HEADER_NO_ADAPTATION;

    if (destinationStart > NEXT_PAYLOAD_START) {
      // Write the padding into the second TS packet
      padding.copy(outputBuffer,
        NEXT_PAYLOAD_START,
        0,
        destinationStart - NEXT_PAYLOAD_START);
    }
  }

  return destinationStart;
};

/**
 * Trivial function that calulcates the next `mod 188`-value after the index it was given
 *
 * @param {Number} value - The number we wish to find the next evenly-divisible-by-188 number after
 */
const packetEndBoundary = (value) => Math.ceil(value / sizeOf.TS_PACKET) * sizeOf.TS_PACKET;

/**
 * Fill out the remaining data with ID3 packets in TS-payload-sized chunks
 *
 * @param {Buffer} outputBuffer -The buffer to insert the ID3 tag into
 * @param {Number} destinationStart - Offset into the buffer to start writing ID3 data
 * @param {String} data - The ID3 tag's TXXX frame payload
 * @returns {Number}
 */
const writeID3TagChunked = (outputBuffer, destinationStart, data, id3Pid) => {
  let sourceStart = 0;
  let sourceLength = packetEndBoundary(destinationStart) - destinationStart;
  let continuityCounter = 2;

  id3TagChunked(
    outputBuffer,
    destinationStart,
    sourceStart,
    Math.min(outputBuffer.length, sourceStart + sourceLength),
    data);

  sourceStart += sourceLength;
  destinationStart += sourceLength;
  sourceLength = MAX_TS_PAYLOAD;

  while (destinationStart < outputBuffer.length) {
    generateTSHeader(
      outputBuffer,
      destinationStart,
      id3Pid,
      continuityCounter++,
      MAX_TS_PAYLOAD,
      false);

    destinationStart += sizeOf.TS_HEADER_NO_ADAPTATION;

    id3TagChunked(
      outputBuffer,
      destinationStart,
      sourceStart,
      Math.min(outputBuffer.length, sourceStart + sourceLength),
      data);

    sourceStart += sourceLength;
    destinationStart += sourceLength;
    sourceLength = MAX_TS_PAYLOAD;
  }
};

/**
 * Generate one or more TS packets containing...
 * ...a single PES packet containing...
 * ...a single ID3 tag containing...
 * ...a single ID3 TXXX frame containing...
 * ...the specified text contents!
 *
 * @param {Buffer} outputBuffer -The buffer to insert everything into
 * @param {Number} destination - The offset to begin writing into the buffer
 * @param {Object} options - A list of parameters used to drive the segment generation process
 */
const generateID3Packets = (outputBuffer, destination, options) => {
  const { data, id3Pid, id3PTS } = options;

  const id3Length = calculateId3TagLength(data.length);
  const pesPacketLength = id3Length + sizeOf.PES_HEADER + sizeOf.PTS;
  const paddingNeeded = Math.ceil(pesPacketLength / MAX_TS_PAYLOAD) * MAX_TS_PAYLOAD - pesPacketLength;

  // First write out the TS packet headers - we will write *around* them in later functions
//  fillOutTSHeaders(outputBuffer, destination, id3Pid);
  generateTSHeader(
    outputBuffer,
    destination,
    id3Pid,
    0,
    MAX_TS_PAYLOAD,
    true);

  // Write the PES header
  generatePESHeader(outputBuffer, destination + 4, id3PTS, id3Length, paddingNeeded);
  // Write any PES header padding necessary
  const destinationStart = writeHeaderPadding(outputBuffer, destination, paddingNeeded, id3Pid);
  // Fill the rest with ID3 tag data
  writeID3TagChunked(outputBuffer, destinationStart, data, id3Pid);
};

/**
 * Returns a buffer that contains a completely valid MPEG2TS segment containing an ID3 payload
 *
 * @param {Object} options - A list of parameters used to drive the segment generation process
 * @returns {Promise<Buffer>}}
 */
module.exports = (options) => {
  return new Promise((accept, reject) => {
    const outputLength = calculateOutputBufferLength(options.data.length);
    const outputBuffer = Buffer.allocUnsafe(outputLength);

    generatePATPacket(outputBuffer, 0, options);
    generatePMTPacket(outputBuffer, 188, options);
    generateID3Packets(outputBuffer, 376, options);

    return accept(outputBuffer);
  });
};

/**
 * Returns a buffer that contains a completely valid MPEG2TS segment containing an ID3 payload
 *
 * @param {Object} options - A list of parameters used to drive the segment generation process
 * @returns {Promise<Buffer>}}
 */
module.exports.sync = (options) => {
  const outputLength = calculateOutputBufferLength(options.data.length);
  const outputBuffer = Buffer.allocUnsafe(outputLength);

  generatePATPacket(outputBuffer, 0, options);
  generatePMTPacket(outputBuffer, 188, options);
  generateID3Packets(outputBuffer, 376, options);

  return outputBuffer;
};
