# ID2-TS-LIB
The fat-free ID3-only MPEG2TS segment generator library!

## Installation
As a library (into your fancy project):
```sh
$> npm install id3-ts-lib
```

Usage:
```javascript
const fs = require('fs');

// The whole library exposes just a single function:
const generateID3Segment = require('id3-ts-lib');

// If a PID is falsey, then that track will not be included in the generated PMT
const options = {
  pmtPid: 0x100,
  id3Pid: 0x103,
  videoPid: null,
  audioPid: null,
  id3PTS: 282743,
  data: 'This is just some example payload...',
};

// The function returns a promise that resolves to a buffer
generateID3Segment(options).then((segment) => {
  fs.writeSync('test.ts', segment);
});
```

As a very rudimentary executable:
```sh
$> npm install -g id3-ts-lib

$> id3-ts 'This is just some example payload...' > test.ts
```

## Performance
The entire segment construction process is performed using a single Buffer allocation. All operations are done in place including the ID3-creation which is "chunked" so that the ID3 can be created in-place "around" the TS packet headers. As a result, this code can generate an entire segment for a 4kb payload in about *0.16ms*.
