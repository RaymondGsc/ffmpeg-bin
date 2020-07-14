'use strict'

var fs = require("fs");
var os = require("os");

var ffmpegPath = require(".");
var pkg = require("./package");

const exitOnError = (err) => {
  console.error(err)
  process.exit(1)
}
const exitOnErrorOrWarnWith = (msg) => (err) => {
  if (err.statusCode === 404) console.warn(msg)
  else exitOnError(err)
}

if (!ffmpegPath) {
  exitOnError('ffmpeg-static install failed: No binary found for architecture')
}

try {
  if (fs.statSync(ffmpegPath).isFile()) {
    console.info('ffmpeg is installed already.')
    process.exit(0)
  }
} catch (err) {
  if (err && err.code !== 'ENOENT') exitOnError(err)
}

function downloadFile(source, destinationPath) {
  let fulfill, reject;

  const promise = new Promise((x, y) => {
    fulfill = x;
    reject = y;
  });

  fs.copyFile(source, destinationPath, (err) => {
    if (err) reject(err);
    fulfill()
  })
  return promise;
}


const release = (
  process.env.FFMPEG_BINARY_RELEASE ||
  pkg['ffmpeg-static']['binary-release-tag']
)
const releaseName = (
  pkg['ffmpeg-static']['binary-release-name'] ||
  release
)
const arch = process.env.npm_config_arch || os.arch()
const platform = process.env.npm_config_platform || os.platform()
const downloadUrl = `./bin/${platform}-${arch}`
const readmeUrl = `${downloadUrl}.README`
const licenseUrl = `${downloadUrl}.LICENSE`

downloadFile(downloadUrl, ffmpegPath)
.then(() => {
  fs.chmodSync(ffmpegPath, 0o755) // make executable
})
.catch(exitOnError)

.then(() => downloadFile(readmeUrl, `${ffmpegPath}.README`))
.catch(exitOnErrorOrWarnWith('Failed to download the ffmpeg README.'))

.then(() => downloadFile(licenseUrl, `${ffmpegPath}.LICENSE`))
.catch(exitOnErrorOrWarnWith('Failed to download the ffmpeg LICENSE.'))
