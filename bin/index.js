#!/usr/bin/env node

const generateID3Segment = require('../');

// Turn the first argument into a id3 tag
if (process.argv[2]) {
  const options = {
    pmtPid: 0x100,
    id3Pid: 0x103,
    videoPid: null,
    audioPid: null,
    id3PTS: 282743,
    data: process.argv[2],
  };
  generateID3Segment(options).then((segment) => {
    process.stdout.write(segment);
  });
}
