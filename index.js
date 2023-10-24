/**
 * node http server here
 */
const http = require('http');

// const path = require('path');
// const fs = require('fs-extra');
// const event = require('./eventEmitter');
// const fileExtension = require('./fileExtension').ext;

// let basePath = process.env.APP_DEV? path.join(process.cwd()): path.join(process.resourcesPath);

let port = 8080;

// let webrootFolder = 'webroot';
// let webrootPath = path.join(basePath, webrootFolder);

// const setSettings = (newSettingsJSON) => {
//   port = newSettingsJSON['port'] || port;
//   webrootFolder = newSettingsJSON['webrootFolder'] || webrootFolder;
//   basePath = newSettingsJSON['basePath'] || basePath;
//   webrootPath = path.join(basePath, webrootFolder);
//   fs.ensureDirSync(webrootPath);
// }

const startServer = () => {
  const httpServer = http.createServer((req, res) => {
    /*
      // cors header
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Request-Method', '*');
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
      res.setHeader('Access-Control-Allow-Headers', '*');
    // */
    res.end('It works!');

    //  if (req.url === '/') {
    //    req.url = 'index.html';
    //  }
    //  let filePath = path.join(webrootPath, decodeURI(req.url));
    //  if (req.url.startsWith('/render')) {
    //    const pathArray = req.url.split('/');
    //    filePath = path.join(basePath, 'temp', pathArray[2], pathArray[3]);
    //  }
    //  if (fs.existsSync(filePath)) {
    //    const contentType = fileExtension.getContentTypeOfPath(filePath);
    //    res.statusCode = 200;
    //    res.setHeader("Content-Type", contentType);
    //    const stream = fs.createReadStream(filePath);
    //    stream.pipe(res);
    //  } else {
    //    res.writeHead(404);
    //    res.end('404 not found');
    //  }
  });
  httpServer.listen(port);
  console.log(`server is now listening to port ${port}`);
};

startServer();
