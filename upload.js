const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { uploadFiles } = require('./helpers');

const prebuildPath = path.join(__dirname, 'prebuilds');
console.log('prebuildPath', prebuildPath);
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

const error = chalk.bold.red;

if (!GITHUB_ACCESS_TOKEN) {
  console.log(error('GITHUB_ACCESS_TOKEN environment variable not found.'));
  console.log(error('Please specify valid GitHub access token and try again.'));
  process.exit(1);
}

const files = fs.readdirSync(prebuildPath)
  .map(file => path.join(prebuildPath, file))
  .filter(file => {
    try {
      const isDirectory = fs.lstatSync(file).isDirectory();

      return !isDirectory;
    } catch (err) {
      return false;
    }
  });


console.log('files', files);

uploadFiles(files);
