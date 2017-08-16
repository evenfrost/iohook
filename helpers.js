const upload = require('prebuild/upload');
const pkg = require('./package.json');

exports.uploadFiles = files => {
  return new Promise(function (resolve, reject) {
    console.log('Uploading ' + files.length + ' prebuilds(s) to Github releases');
    let opts = {
      pkg: pkg,
      files: files,
      upload: process.env.GITHUB_ACCESS_TOKEN
    };
    upload(opts, function (err, result) {
      if (err) {
        return reject(err);
      }
      console.log('Found ' + result.old.length + ' prebuild(s) on Github');
      if (result.old.length) {
        result.old.forEach(function (build) {
          console.log('-> ' + build)
        })
      }
      console.log('Uploaded ' + result.new.length + ' new prebuild(s) to Github');
      if (result.new.length) {
        result.new.forEach(function (build) {
          console.log('-> ' + build)
        })
      }
      resolve()
    })
  })
}
