#!/usr/bin/env node

const generateID3Segment = require('../');

const args = process.argv.slice(2);

let videoPidIndex = args.indexOf('-v')

if (videoPidIndex === -1) {
  videoPidIndex = args.indexOf('--video-pid');
}
const videoPid = videoPidIndex !== -1 ? args.splice(videoPidIndex, 2)[1] || null : null;

let audioPidIndex = args.indexOf('-a');

if (audioPidIndex === -1) {
  audioPidIndex = args.indexOf('--audio-pid');
}
const audioPid = audioPidIndex !== -1 ? args.splice(audioPidIndex, 2)[1] || null : null;

let id3PtsIndex = args.indexOf('-p');

if (id3PtsIndex === -1) {
  id3PtsIndex = args.indexOf('--id3-pts');
}
const id3PTS = id3PtsIndex !== -1 ? Number(args.splice(id3PtsIndex, 2)[1]) || 282743 : 282743;

const data = args.pop();

if (data) {
  const options = {
    pmtPid: 0x100,
    id3Pid: 0x103,
    id3PTS,
    videoPid,
    audioPid,
    data
  };

  generateID3Segment(options).then((segment) => {
    process.stdout.write(segment);
  });
} else {
  console.error('Please add some data');
}
