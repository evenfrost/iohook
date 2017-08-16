const upload = require('prebuild/upload');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const tar = require('tar-stream');
const zlib = require('zlib');
const pkg = require('./package.json');
const { uploadFiles } = require('./helpers');

function mode(octal) {
  return parseInt(octal, 8)
}

let arch = process.env.ARCH
  ? process.env.ARCH
    .replace('i686', 'ia32')
    .replace('x86_64', 'x64')
  : process.arch;

let cmakeJsPath = path.join(
  __dirname,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'cmake-js.cmd' : 'cmake-js'
);

let support = require('./support');
let targets = support.targets;
let abis = support.abis;
let files = [];

let chain = Promise.resolve();

targets.forEach(parts => {
  let runtime = parts[0];
  let version = parts[1];
  chain = chain
    .then(function () {
      return build(runtime, version)
    })
    .then(function () {
      return tarGz(runtime, version)
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    })
});

chain = chain.then(function () {
  return uploadFiles(files)
});

function build(runtime, version) {
  return new Promise(function (resolve, reject) {
    let args = [
      'rebuild',
      '--runtime-version=' + version,
      '--target_arch=' + arch,
      '--runtime=' + runtime
    ];
    let proc = spawn(cmakeJsPath, args, {
      env: process.env
    });
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on('exit', function (code, sig) {
      if (code === 1) {
        return reject(new Error('Failed to build...'))
      }
      resolve()
    })
  })
}

function tarGz(runtime, version) {
  return new Promise(function (resolve) {
    let filename = 'build/Release/iohook.node';
    let abi = abis[runtime][version];
    let tarPath = 'prebuilds/' + pkg.name + '-v' + pkg.version + '-' + runtime + '-v' + abi + '-' + process.platform + '-' + arch + '.tar.gz';
    files.push(tarPath);
    mkdirp(path.dirname(tarPath), function () {
      fs.stat(filename, function (err, st) {
        if (err) {
          return reject(err);
        }
        let tarStream = tar.pack();
        let ws = fs.createWriteStream(tarPath);
        let stream = tarStream.entry({
          name: filename.replace(/\\/g, '/').replace(/:/g, '_'),
          size: st.size,
          mode: st.mode | mode('444') | mode('222'),
          gid: st.gid,
          uid: st.uid
        });
        fs.createReadStream(filename)
          .pipe(stream)
          .on('finish', function () {
            tarStream.finalize()
          });
        tarStream
          .pipe(zlib.createGzip())
          .pipe(ws)
          .on('close', resolve)
      })
    })
  })
}
