
// skidded from my notebot projects

var https = require("https");
var http = require("http");
var fs = require('fs');

var maxDownloadBytes = 10485760; //10mb

function download(url, dest, cb) {

  var file = null;
  var httpOrHttps = https;
  url.startsWith("https:") ? httpOrHttps = https : httpOrHttps = http;

  var request = httpOrHttps.get(url, (response) => {
    console.log("Download started!");
    var size;
    try {
    size = parseInt(response.headers["content-length"]);
    } catch(e) {size = null;}

    if(response.headers["content-disposition"] != null && dest == undefined) {
      dest = "./"+response.headers["content-disposition"].toString().split("filename=")[1].replace(/\//g, "");
    }
    if(dest == undefined || dest == "./") {
      if(url.toLowerCase().endsWith(".schem") || url.toLowerCase().endsWith(".schematic")) {
        var split = url.split("/");
        dest = "./downloaded/"+split[split.length - 1];
      } else {
        dest = "./downloaded/download.schem";
      }
    }
    if(fs.existsSync(dest)) {// delete local file sync if it already exists for some reason
      fs.unlinkSync(dest);
    }
    file = fs.createWriteStream(dest);
    
    if (size != null) {
      if (size > maxDownloadBytes) {
        if (cb) cb(`File was too big max allowed ${formatBytes(maxDownloadBytes)} (${maxDownloadBytes}) Recieved ${formatBytes(size)} (${size}) [header]`);
        request.abort();
        fs.unlink(dest, () => { });
        return;
      }
    }

    response.on("data", (data) => {
      size = 0;
      size += data.length;

      if (size > maxDownloadBytes) {
        if (cb) cb(`File was too big max allowed ${formatBytes(maxDownloadBytes)} (${maxDownloadBytes}) Recieved ${formatBytes(size)} (${size}) [data.length]`);

        request.abort();
        fs.unlink(dest);
        return;
      }
    }).pipe(file);

    response.on("error", (err) => {
      request.abort();
      fs.unlink(dest, () => { });
      if (cb) cb(err.message);
    })

    file.on("finish", () => {
      file.close(() => {
        cb(undefined, dest);
      });
    });

  }).on("error", (err) => {
    request.abort();
    fs.unlink(dest, () => { });
    if (cb) cb(err.message);
  });
};

module.exports.download = download;

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}