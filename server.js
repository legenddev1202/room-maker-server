const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token');
const SocketIOFileUpload = require('socketio-file-upload');
const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const readline = require('readline');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  // apiKey: process.env.OPENAI_API_KEY,
  apiKey: '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',
});

const openai = new OpenAIApi(configuration);

// const {verifyPassword, getEventData, saveDisplayname} = require('./db');
const app = express();
const router = express.Router({ caseSensitive: false });
const server = require('http').createServer(app);
// const apiBaseUrl = 'http://dev.ioiocreative.com/sephora/api/api.php/';
const socketIO = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});
const formidable = require('formidable');
const COS = require('cos-nodejs-sdk-v5');
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const port = 8080;
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
let auth;

server.listen(port, () => {
  console.log(`Server started at ${port}.`);
});

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  } else {
    return next();
  }
});

app.use(SocketIOFileUpload.router);
app.set('case sensitive routing', false);

app.use(express.static(__dirname + '/static'));
//app.use(express.static(__dirname + '/build'));

// app.get('/', (req, res)=> res.end('index.html'));
app.get('/test', (req, res) => {
  res.json({ message: 'Welcome to Grwthx leoluca server again too.' });
});

app.get(/preview/i, (req, res) => {
  res.redirect('/preview');
});

app.get(/play/i, (req, res) => {
  res.redirect('/play');
});

app.get(/venus/i, (req, res) => {
  res.redirect('/venus');
});

app.get(/viewtest/i, (req, res) => {
  res.redirect('/viewtest');
});

app.get('/images/:img', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'image/jpeg' });
  const localImg = path.join(__dirname, req.url);
  const newLocalImg = req.url.replace(/static/, function (match) {
    return 'build';
  });
  const localImgBuild = path.join(__dirname, newLocalImg);
  res.end(fs.readFileSync(localImg));
});

app.get('/test', (req, res) => {
  // getEventData(1).then(event => res.end(JSON.stringify(event)))
  res.end('test');
});

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  //   if (req.method === 'OPTIONS') {
  //     return res.send(200);
  //   } else {
  return next();
  //   }
});

function deleteFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err) {
      console.error(err);
    }
    // console.log('Temp File Delete');
  });
}

// var Bucket = 'rm-be-1313285235';
var Bucket = 'grwth-x-1301860956'; //new
var Region = 'ap-hongkong';

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));
// app.use(express.json()); //For JSON requests
// app.use(express.urlencoded({ extended: true }));

//new
var cos = new COS({
  SecretId: 'IKIDJWimhdUCnETdpqx1wiHMQND0qWyLaQ6Y',
  SecretKey: 'CyYv9JNGvPjsrhMq9GWgfT9dvBPVZR7e',
  endPoint: "grwth-x-1301860956.cos.accelerate.myqcloud.com"
  
});
// var cos = new COS({
//   SecretId: 'IKIDmx2311382h6n4exzqTpujHckeYNadfS0',
//   SecretKey: 'RebIp7ixitquildjZAXerTs2m23C411Uk',
// });

app.post('/nft-metadatas', async function (req, res, next) {
  res.setHeader('Access-Control-Origin', '*');
  const form = new formidable.IncomingForm();
  let filePath = null;
  await form.parse(req, function (err, fields, files) {
    // // console.log("fields", fields);
    if (files.hasOwnProperty('fields')) {
      filePath = files.fields.filepath;
      const file = fs.readFileSync(files.fields.filepath);

      cos.putObject(
        {
          Bucket: `${Bucket}`,
          Region: Region,
          Key: `nft-metadatas/${files.fields.originalFilename}`,
          StorageClass: 'STANDARD',
          Body: `${file}`,
          onProgress: function (progressData) {
            // // console.log(JSON.stringify(progressData));
          },
        },
        function (err, data) {
          // // console.log('err', err);
          // // console.log('data', data);
          // res.json({
          //   // files: null,
          // });
        }
      );
      res.json({
        files: files,
      });
    }
  });
  if (filePath) {
    await deleteFile(filePath);
  }
});

app.get('/nft-metadatas/:tokenId', async function (req, res, next) {
  res.setHeader('Access-Control-Origin', '*');
  try {
    const tokenId = req.params.tokenId;
    // // console.log('tokenId', tokenId);

    const bucketContent = await cos.getBucket(
      {
        Bucket: Bucket,
        Region: Region,
      },
      function (err, data) {
        // // console.log(err || data.Contents);
        cos.getObject(
          {
            Bucket: Bucket,
            Region: Region,
            Key: `nft-metadatas/${tokenId}.json`,
            // Output: fs.createWriteStream(downloadPath),
          },
          function (err, data) {
            res.json({ data: data });
            // res.json({ data: data.data.body.data.toJSON() });
          }
        );
      }
    );

    // await res.json({ id: req.params.id });
  } catch (error) {
    await res.json({ error: error });
  }
});

app.post('/openai/generateImage', async function (req, res, next) {
  const { prompt } = req.body;

  // const imageSize = size === 'small' ? '256x256' : size === 'medium' ? '512x512' : '1024x1024';

  try {
    const response = await openai.createImage({
      prompt,
      n: 1,
      size: '512x512',
      response_format: 'b64_json',
    });

    const imageUrl = response.data.data[0].b64_json;

    res.status(200).json({
      success: true,
      data: imageUrl,
    });
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    res.status(400).json({
      success: false,
      error: 'The image could not be generated',
    });
  }
});

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content));
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    auth = oAuth2Client;
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      auth = authoAuth2Client;
    });
  });
}

app.get('/googleDrive/:fildId', async function (req, res, next) {
  res.setHeader('Access-Control-Origin', '*');
  const fileId = req.params.fildId;

  // var dir = `./downloads`; // directory from where node.js will look for downloaded file from google drive

  // var dest = fs.createWriteStream('./downloads/kamal-hossains.jfif'); // file path where google drive function will save the file

  const drive = google.drive({ version: 'v3', auth }); // Authenticating drive API

  let progress = 0; // This will contain the download progress amount

  console.log('/googleDrive/:fildId', fileId);

  // Uploading Single image to drive
  try {
    drive.files
      .get(
        { fileId, alt: 'media' },
        {
          responseType: 'arraybuffer',
          encoding: null,
        }
      ) //{ responseType: 'stream' })
      .then((driveResponse) => {
        var fileType = driveResponse.headers['content-type'];
        var base64 = Buffer.from(driveResponse.data, 'utf8').toString('base64');
        var dataURI = 'data:' + fileType + ';base64,' + base64;
        res.status(200).json({ src: dataURI });
        // res.json({ data: driveResponse.data });

        // driveResponse.data
        // .on('end', () => {
        //   console.log('\nDone downloading file.');
        //   const file = `${dir}/kamal-hossains.json`; // file path from where node.js will send file to the requested user
        //   res.download(file); // Set disposition and send it.
        // })
        // .on('error', err => {
        //   console.error('Error downloading file.');
        // })
        // .on('data', d => {
        //   progress += d.length;
        //   if (process.stdout.isTTY) {
        //     process.stdout.clearLine();
        //     process.stdout.cursorTo(0);
        //     process.stdout.write(`Downloaded ${progress} bytes`);
        //   }
        // })
        // .pipe(dest);
      })
      .catch((err) => console.log(err));
  } catch (err) {
    res.json({ error: error });
  }
});

app.post('/assignments', async function (req, res, next) {
  res.setHeader('Access-Control-Origin', '*');
  const form = new formidable.IncomingForm();
  let filePath = null;
  await form.parse(req, function (err, fields, files) {
    // // console.log('fields', fields);
    // // console.log('files', files);
    if (files.hasOwnProperty('fields')) {
      filePath = files.fields.filepath;
      const file = fs.readFileSync(files.fields.filepath);
      // // console.log('fileerror', file);

      cos.putObject(
        {
          Bucket: `${Bucket}`,
          Region: Region,
          Key: `assignments/${files.fields.originalFilename}`,
          StorageClass: 'STANDARD',
          Body: `${file}`,
          onProgress: function (progressData) {
            // // console.log(JSON.stringify(progressData));
          },
        },
        function (err, data) {
          // // console.log('err', err);
          // // console.log('data', data);
          // res.json({
          //   // files: null,
          // });
        }
      );

      res.json({
        files: files,
      });
    }
  });
  if (filePath) {
    await deleteFile(filePath);
  }
});

app.get('/assignments/:id', async function (req, res, next) {
  try {
    const id = req.params.id;
    // // console.log('idcheck', id);

    const bucketContent = await cos.getBucket(
      {
        Bucket: Bucket,
        Region: Region,
      },
      function (err, data) {
        // // console.log(err || data.Contents);
        // const filepath = path.join(tmpdir, basename + ".jpg");
        // const writeStream = fs.createWriteStream(filepath);
        cos.getObject(
          {
            Bucket: Bucket,
            Region: Region,
            Key: `assignments/${id}.json`,
            // Output: fs.createWriteStream(`${__dirname}/`),
          },
          function (err, data) {
            // // console.log(data);
            // res.sendFile(`${__dirname}/assignments/${id}.json`);
            if (data == undefined) {
              // // console.log('cccc');
              res.send({ data: 'empty' });
            } else {
              const json = JSON.parse(data.Body);
              res.json({ json: json });
            }

            // res.json({ data: data.data.body.data.toJSON() });
          }
        );
      }
    );

    // await res.json({ id: req.params.id });
  } catch (error) {
    await res.json({ error: error });
  }
});

app.post('/publishes/:assignmentId', async function (req, res, next) {
  res.setHeader('Access-Control-Origin', '*');
  const assignmentId = req.params.assignmentId;

  const form = new formidable.IncomingForm();
  let filePath = null;
  await form.parse(req, function (err, fields, files) {
    if (files.hasOwnProperty('fields')) {
      filePath = files.fields.filepath;
      const file = fs.readFileSync(filePath);

      cos.putObject(
        {
          Bucket: `${Bucket}`,
          Region: Region,
          Key: `publishes/${assignmentId}/${files.fields.originalFilename}`,
          StorageClass: 'STANDARD',
          Body: file,
          onProgress: function (progressData) {
            // // console.log(JSON.stringify(progressData));
          },
        },
        function (err, data) {
          res.json({
            files: files,
          });
          // // console.log('err', err);
          // // console.log('data', data);
          // res.json({
          //   // files: null,
          // });
        }
      );
    }
  });
  if (filePath) {
    await deleteFile(filePath);
  }
});

app.post('/send-email', (req, res) => {
  const {  from, to, subject, message} = req.body;
  console.log( from, to, subject, message, "======");
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'phoenixdev0211@gmail.com',
      pass: "sitaumvnfuwmadtm"
    }
  });
  // to: "mrrki3334@gmail.com",
  const mailOptions = {
    from: from ,
    to: to,
    subject: subject,
    html: `<p>${message}</p>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Email sent successfully');
    }
  });
});

app.get('/publishes/:assignmentId/:fileId', async function (req, res, next) {
  try {
    const assignmentId = req.params.assignmentId;
    const fileId = req.params.fileId;
    const second = req.params.second;
    // // console.log('assignmentId1', assignmentId);
    // // console.log('fileId1', fileId);

    const bucketContent = await cos.getBucket(
      {
        Bucket: Bucket,
        Region: Region,
      },
      function (err, data) {
        // // console.log(err || data.Contents);
        // const filepath = path.join(tmpdir, basename + ".jpg");
        // const writeStream = fs.createWriteStream(filepath);

        // // console.log('assignmentId2', assignmentId);
        // // console.log('fileId2', fileId);
        cos.getObject(
          {
            Bucket: Bucket,
            Region: Region,
            Key: `publishes/${assignmentId}/${fileId}`,
            // Output: fs.createWriteStream(
            //   `${__dirname}/publishes/${assignmentId}/`
            // ),
          },
          function (err, data) {
            // // console.log('data', data);
            // // console.log('err', err);

            // res.writeHead(200, {
            //   'Content-Type': data.headers[`content-type`],
            //   'Content-disposition': 'attachment;filename=' + fileId,
            //   'Content-Length': data.headers[`content-length`]
            // });

            if (data !== undefined) {
              res.writeHead(200, {
                'Content-Type': data.headers[`content-type`],
                'Content-disposition': 'attachment;filename=' + fileId,
                'Content-Length': data.headers[`content-length`],
              });
              res.end(data.Body, 'binary');
            }

            // const json = JSON.parse(data.Body);
            // res.json({ json: json });
            // res.json({ data: data.data.body.data.toJSON() });
            // res.sendFile(`${__dirname}/publishes/${assignmentId}/${fileId}`);
          }
        );
      }
    );

    // await res.json({ id: req.params.id });
  } catch (error) {
    await res.json({ error: error });
  }
});

app.get('/publishes/:assignmentId/:fileId/:second', async function (req, res, next) {
  try {
    const assignmentId = req.params.assignmentId;
    const fileId = req.params.fileId;
    const second = req.params.second;
    // // console.log('assignmentId', assignmentId);
    // // console.log('fileId', fileId);
    // // console.log('second', second);

    const bucketContent = await cos.getBucket(
      {
        Bucket: Bucket,
        Region: Region,
      },
      function (err, data) {
        // // console.log(err || data.Contents);
        // const filepath = path.join(tmpdir, basename + ".jpg");
        // const writeStream = fs.createWriteStream(filepath);

        cos.getObject(
          {
            Bucket: Bucket,
            Region: Region,
            Key: `publishes/${assignmentId}/${fileId}/${second}`,
            // Output: fs.createWriteStream(
            //   `${__dirname}/publishes/${assignmentId}/`
            // ),
          },
          function (err, data) {
            // // console.log('data', data);
            // // console.log('err', err);

            res.writeHead(200, {
              'Content-Type': data.headers[`content-type`],
              'Content-disposition': 'attachment;filename=' + second,
              'Content-Length': data.headers[`content-length`],
            });
            res.end(data.Body, 'binary');

            // const json = JSON.parse(data.Body);
            // res.json({ json: json });
            // res.json({ data: data.data.body.data.toJSON() });
            // res.sendFile(`${__dirname}/publishes/${assignmentId}/${fileId}`);
          }
        );
      }
    );

    // await res.json({ id: req.params.id });
  } catch (error) {
    await res.json({ error: error });
  }
});

app.get('/library/:type/:id', async function (req, res, next) {
  try {
    const type = req.params.type;
    const id = req.params.id;
    console.log('/library/:type/:id', type, id);

    const bucketContent = await cos.getBucket(
      {
        Bucket: Bucket,
        Region: Region,
      },
      function (err, data) {
        cos.getObject(
          {
            Bucket: Bucket,
            Region: Region,
            Key: `library/${type}/${id}.json`,
          },
          function (err, data) {
            if (data == undefined) {
              res.send({ data: 'empty' });
            } else {
              const json = JSON.parse(data.Body);
              res.json({ json: json });
            }
          }
        );
      }
    );
  } catch (error) {
    await res.json({ error: error });
  }
});

app.get('/', async (req, res) => {
  try {
    res.json(`The GrwthX Server`);
  } catch (error) {}
});

const speaker = {};
var io = socketIO;

var players = {};
function Player(id) {
  this.id = id;
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.rx = 0;
  this.ry = 0;
  this.rz = 0;
  this.entity = null;
  this.email = '';
  this.name = '';
  this.companyName = '';
  this.chat = '';
  this.roomId = '';
  this.channelId = 0;
  this.webCamUID = null;
  this.shareScreenUID = null;
  this.isPersenter = false;
  this.walk = 0;
  this.textureIdx = 0;
  this.headIdx = 0;
  this.faceIdx = 0;
  this.skinIdx = 0;
  this.bodyIdx = 0;
  this.footIdx = 0;
  this.headColor = 0;
  this.faceColor = 0;
  this.skinColor = 0;
  this.bodyColor = 0;
  this.footColor = 0;
  this.haveCam = true;
  this.customTexturePath = null;
  this.speaking = false;
}

io.on('connection', async (socket) => {
  var id = socket.id;
  var newPlayer = new Player(id);
  players[id] = newPlayer;

  socket.on('Room:Join', async ({ assignmentName, from }) => {
    // console.log('Room:Join', assignmentName, from);
    try {
      socket.join(assignmentName);
      socket.to(assignmentName).emit(`Room:Join`, `${from} joined space ${assignmentName}`);
    } catch (error) {}
  });

  socket.on('Room:Create', async ({ assignmentName, cmd, objUuid, objJson, url }) => {
    try {
      // console.log('Room:Create', assignmentName, cmd, objJson, url);
      socket.to(assignmentName).emit(`Room:Create`, { assignmentName, cmd, objUuid, objJson, url });
    } catch (error) {}
  });

  socket.on('Room:Execute', async ({ assignmentName, cmd, objUuid, args, optionalName }) => {
    try {
      // console.log('Room:Execute', assignmentName, cmd, objUuid, args, optionalName);
      socket.to(assignmentName).emit(`Room:Execute`, { cmd, objUuid, args, optionalName });
    } catch (error) {}
  });

  socket.on('Room:Undo', async ({ assignmentName }) => {
    try {
      // console.log('Room:Undo', assignmentName);
      socket.to(assignmentName).emit(`Room:Undo`, { assignmentName });
    } catch (error) {}
  });

  socket.on('Room:Redo', async ({ assignmentName }) => {
    try {
      // console.log('Room:Redo', assignmentName);
      socket.to(assignmentName).emit(`Room:Redo`, { assignmentName });
    } catch (error) {}
  });

  socket.on('Communicate:Chat', async ({ assignmentName, userName, chatContent, time }) => {
    try {
      // console.log('Communicate:Chat', assignmentName, userName, chatContent, time);
      socket.to(assignmentName).emit(`Communicate:Chat`, { userName, chatContent, time });
    } catch (error) {}
  });

  socket.on('broadcast', async (assignmentName, eventName, payload) => {
    try {
      socket.to(assignmentName).emit(eventName, payload);
    } catch (error) {}
  });

  socket.onAny((event) => {
    socket.emit('debug', event);
  });

  socket.on('getPlayersData', () => {
    socket.join('admin');
    delete players[socket.id];
    socket.emit('playersData', players);
  });
  socket.on('getSocketsData', () => {
    socket.emit('socketsData', {
      'io.of(/).sockets.size': io.of('/').sockets.size,
      'io.of(/).sockets': io.of('/').sockets,
    });
  });
  // socket.emit ('getRoomsData', {rooms: rooms});

  socket.emit('initSocket', { id: id });

  socket.on('positionUpdate', function (data) {
    var player = players[data.id];
    if (player) {
      var room = player.roomId;
      player.x = data.x;
      player.y = data.y;
      player.z = data.z;
      player.rx = data.rx;
      player.ry = data.ry;
      player.rz = data.rz;
      player.walk = data.walk;

      socket.broadcast.to(room).emit('playerMoved', { id: data.id, x: data.x, y: data.y, z: data.z, rx: data.rx, ry: data.ry, rz: data.rz, walk: data.walk });
    }
    // io.to('admin').emit('playersData', players);
  });

  socket.on('updatePlayerWithToken', function (data) {
    // var token = data.token;
    // var roomId = data.room;
    // apiUpdateInfo({token: token}).then(result => {
    //   if (result.data.status === 'success') {
    //     userCount++;
    //     if (!players[socket.id]) {
    //       players[socket.id] = new Player(socket.id);
    //       // console.log('new player');
    //     // } else {
    //       // console.log('player created');
    //     }
    //     players[socket.id].name = result.data.data.displayname;
    //     players[socket.id].companyName = result.data.data.company;
    //     players[socket.id].stamps = result.data.data.stamps;
    //     players[socket.id]['token'] = result.data.data.token;
    //     // user floor so 0.001 to 0.999 still go into channel 0
    //     players[socket.id].channelId = +Math.floor(userCount / userPerChannel);
    //     players[socket.id].textureIdx = result.data.data.textureIdx;
    //     roomId = roomId + players[socket.id].channelId;
    //     players[socket.id].roomId = roomId;
    //     socket.join(roomId);
    //     // console.log('roomId: ', roomId);
    //     var stampCount = 0;
    //     var sameRoomPlayer = {};
    //     for(var pid in players){
    //         var p = players[pid];
    //         if(p.roomId == roomId)
    //           sameRoomPlayer[pid] = p;
    //     }
    //     // console.log(sameRoomPlayer);
    //     var values = Object.values(players[socket.id].stamps);
    //     for(let i=0, lth=values.length; i < lth; ++i){
    //       if(values[i]) stampCount++;
    //     }
    //     socket.emit ('initialPlayersData', {id: socket.id, players: sameRoomPlayer, count:stampCount, allPlayers: players});
    //     socket.broadcast.to(roomId).emit ('playerJoined', players[socket.id]);
    //     io.to('admin').emit('playersData', players);
    //     if (result.data.data.texturePath) {
    //       players[socket.id].customTexturePath = `https://sephora.ioiocreative.com/images/${result.data.data.texturePath}`;
    //     }
    //   } else {
    //     socket.disconnect();
    //   }
    // })
  });
  socket.on('login', function (data) {
    var email = data.email;
    var pw = data.pw;
    var event = data.event || 1;
    // verifyPassword(event, email, pw).then(isSuccess => {
    //   newPlayer.email = email;
    //   newPlayer.type = isSuccess['type'];
    //   newPlayer.name = isSuccess['displayname'];
    //   if (isSuccess) {
    //     newPlayer['userId'] = isSuccess['id'];
    //     getEventData(event).then(res => {
    socket.emit('loginStatus', {
      status: 'success',
      displayName: data['name'],
      name: data['name'],
      // type: isSuccess['type'],
      eventData: res['eventData'],
    });
    //    })
    //   } else {
    //     socket.emit ('loginStatus',{
    //       status: false
    //     });
    //   }
    // })
  });

  socket.on('initData', function (data) {
    var sameRoomPlayer = {};
    var name = data.name || newPlayer.name;
    // var name = ' ';
    if (name === "unnamed") {
      name = " ";
    }
    var roomId = 'public'; // + newPlayer.channelId;
    var textureIdx = data.textureIdx;
    var headIdx = data.headIdx;
    var faceIdx = data.faceIdx;
    var skinIdx = data.skinIdx;
    var bodyIdx = data.bodyIdx;
    var footIdx = data.footIdx;
    var headColor = data.headColor;
    var faceColor = data.faceColor;
    var skinColor = data.skinColor;
    var bodyColor = data.bodyColor;
    var footColor = data.footColor;
    var haveCam = data.haveCam;

    let stampCount = 0;
    // console.log("initData", data);
    io.to('admin').emit('initData', data);

    socket.join(roomId);

    // apiLogRoom({
    //   token: players[socket.id]['token'],
    //   room: 'public'
    // });

    newPlayer.name = name;
    newPlayer.roomId = roomId;
    newPlayer.textureIdx = textureIdx;
    newPlayer.headIdx = headIdx;
    newPlayer.faceIdx = faceIdx;
    newPlayer.skinIdx = skinIdx;
    newPlayer.bodyIdx = bodyIdx;
    newPlayer.footIdx = footIdx;
    newPlayer.headColor = headColor;
    newPlayer.faceColor = faceColor;
    newPlayer.skinColor = skinColor;
    newPlayer.bodyColor = bodyColor;
    newPlayer.footColor = footColor;
    newPlayer.haveCam = haveCam;

    // saveDisplayname(newPlayer.userId, name);
    // find same room player
    for (var id in players) {
      var p = players[id];
      if (p.roomId == roomId) sameRoomPlayer[id] = p;
    }

    players[socket.id].textureIdx = data.textureIdx;
    players[socket.id].headIdx = data.headIdx;
    players[socket.id].faceIdx = data.faceIdx;
    players[socket.id].skinIdx = data.skinIdx;
    players[socket.id].bodyIdx = data.bodyIdx;
    players[socket.id].footIdx = data.footIdx;
    players[socket.id].headColor = data.headColor;
    players[socket.id].faceColor = data.faceColor;
    players[socket.id].skinColor = data.skinColor;
    players[socket.id].bodyColor = data.bodyColor;
    players[socket.id].footColor = data.footColor;
    players[socket.id].haveCam = data.haveCam;

    // apiUpdateAvatorIndex({
    //   token: players[socket.id]['token'],
    //   avator: players[socket.id].textureIdx
    // });

    socket.emit('initialPlayersData', { id: data.id, players: sameRoomPlayer, count: stampCount });
    socket.emit('startGame', {
      name: name,
      textureIdx: textureIdx,
      headIdx: headIdx,
      faceIdx: faceIdx,
      skinIdx: skinIdx,
      bodyIdx: bodyIdx,
      footIdx: footIdx,
      headColor: headColor,
      faceColor: faceColor,
      skinColor: skinColor,
      bodyColor: bodyColor,
      footColor: footColor,
      haveCam: haveCam,
    });
    socket.broadcast.to(roomId).emit('playerJoined', newPlayer);
    io.to('admin').emit('playersData', players);
  });

  socket.on('getRoomData', function (roomIdx) {
    // getEventData(1) // replace to event id later
    //   .then(res => {
    //     if (roomIdx !== undefined && roomIdx !== null) {
    //       // console.log(roomIdx);
    //       socket.emit('getRoomData', res['roomData'][roomIdx]);
    //     } else {
    //       socket.emit('getRoomData', res['roomData'])
    //     }
    //   });
  });

  socket.on('speaking', function (data, ack) {
    if (speaker[data.roomId]) {
      ack(false);
    } else {
      // if (players[data.id].type === 2) {
      ack(true);
      //   speaker[data.roomId] = data.id;
      //   players[data.id].speaking = true;
      // } else {
      //   ack(false);
      // }
    }
  });

  socket.on('stopSpeaking', function (data, ack) {
    // if (speaker[data.roomId] === data.id) {
    ack(true);
    players[data.id].speaking = false;
    delete speaker[data.roomId];
    // } else {
    //   ack(true);
    //   delete(speaker[data.roomId]);
    // }
  });
  socket.on('changeRoom', function (data) {
    var oldRoomId = players[socket.id].roomId;
    var newRoomId = data.roomId; // + newPlayer.channelId;
    var sameRoomPlayer = {};
    // var otherRoomPlayer = {};

    for (var id in players) {
      var p = players[id];
      if (p.roomId == newRoomId) sameRoomPlayer[id] = p;
    }
    // apiLogRoom({
    //   token: players[id]['token'],
    //   room: data.roomId
    // }).then(res => {
    //   // nth
    //   // console.log(res.data);
    // });
    socket.broadcast.to(oldRoomId).emit('removePlayer', socket.id);
    socket.emit('removeAllPlayers');
    socket.leave(oldRoomId);

    renewToken(socket, { channel: newRoomId });

    players[socket.id].roomId = newRoomId;
    socket.join(newRoomId);
    socket.emit('initialPlayersData', { id: data.id, players: sameRoomPlayer, newRoomId: newRoomId });
    socket.broadcast.to(newRoomId).emit('playerJoined', newPlayer);
    io.to('admin').emit('playersData', players);
  });

  // socket.on ('lockRoom', function (data) {
  //   io.sockets.emit ('lockRoom', data);
  // });

  socket.on('playerChatUpdate', function (data) {
    var room = players[socket.id].roomId;
    players[socket.id].chat = data.chat;
    io.sockets.in(room).emit('playerChatChanged', data);
  });

  socket.on('chatBoxUpdate', function (data) {
    var room = players[socket.id].roomId;
    io.sockets.in(room).emit('updateChatBox', { ...data, name: players[socket.id].name });
    // io.sockets.in(room).emit('updateChatBox', { ...data, name: " " });
  });

  socket.on('setWebCamUID', function (data) {
    var room = players[data.id].roomId;
    var webCamUID = data.webCamUID;
    players[data.id].webCamUID = webCamUID;
    socket.broadcast.to(room).emit('publishWebCamToOtherPlayer', { id: data.id, roomId: room, webCamUID: webCamUID });
  });

  socket.on('setShareScreenUID', function (data) {
    var room = players[data.id].roomId;
    var shareScreenUID = data.shareScreenUID;
    var webCamUID = players[data.id].webCamUID;
    players[data.id].isPersenter = true;
    players[data.id].shareScreenUID = shareScreenUID;
    socket.emit('setMainPlayerSpeakerUID', { id: data.id, roomId: room, webCamUID: webCamUID });
    socket.broadcast.to(room).emit('publishScreenToOtherPlayer', { id: data.id, roomId: room, webCamUID: webCamUID, shareScreenUID: shareScreenUID });
  });

  socket.on('closeAllPlayersSpeakerScreen', function (data) {
    var room = players[data.id].roomId;
    io.sockets.in(room).emit('closeAllPlayersSpeakerScreen');
  });

  socket.on('renewToken', function (data) {
    renewToken(socket, data);
  });

  socket.on('enterPrivateRoom', function (data) {
    const passcode = +data.passcode; //.toString();
    // const clients = io.sockets.adapter.rooms.get(data.toRoom);
    // const numClients = clients ? clients.size : 0;

    // if(numClients === 0){
    //   // store passcode
    //   rooms[data.toRoomIdx].privateRoomPasscode = passcode;
    //   socket.emit ('privateRoomStatus',{status: 'success'});
    // }
    // else{

    // getEventData(1) // replace to event id later
    //   .then(res => {
    //     const privateRoomData = res['roomData'][data.roomIdx];

    //     if(passcode === +privateRoomData.code)
    //       socket.emit ('privateRoomStatus',{status: 'success', roomId:privateRoomData.type});
    //     else
    //       socket.emit ('privateRoomStatus',{status: 'fail'});

    //     // if (data.roomIdx !== undefined && data.roomIdx !== null) {
    //     //   // console.log(data.roomIdx);
    //     //   socket.emit('getRoomData', res['roomData'][data.roomIdx]);
    //     // } else {
    //     //   socket.emit('getRoomData', res['roomData'])
    //     // }
    //   });

    // }
  });

  socket.on('disconnect', function (data) {
    if (!players[socket.id]) return;
    if (fs.existsSync(players[socket.id].texturePath)) {
      fs.unlinkSync(players[socket.id].texturePath);
    }
    var room = players[socket.id].roomId;
    var token = players[socket.id].token;
    // apiLogout({
    //   'token': token
    // });
    delete players[socket.id];
    socket.broadcast.to(room).emit('removePlayer', socket.id);
    io.to('admin').emit('playersData', players);
  });

  const maskPath = path.join(__dirname, 'avator', 'mask.png');
  var uploader = new SocketIOFileUpload();
  uploader.dir = path.join(__dirname, '/images/');
  uploader.listen(socket);
  uploader.on('saved', function (event) {
    var file = event.file;
    if (file.success) {
      var newName = new Date().getTime() + '.jpg';
      var newTexturePath = path.join(__dirname, 'images', newName);
      fs.renameSync(file.pathName, newTexturePath);

      const prevTexture = players[socket.id].texturePath;
      const customTexture = `https://live.rond.fi/images/${newName}`;
      // const customTexture = `https://live.rond.fi/images/${newName}`;
      players[socket.id].customTexturePath = customTexture;
      players[socket.id].texturePath = newTexturePath;
      socket.emit('uploaded', customTexture);
      if (fs.existsSync(prevTexture)) {
        // delete the image uploaded
        fs.unlinkSync(prevTexture);
      }
    }
  });
});

const renewToken = function (socket, data) {
  const id = data.id ? data.id : null;
  // Rtc Examples
  const appID = 'dda37488f95149d392d832800ad020ad';
  const appCertificate = 'a219c05d51004baaa5d33c639aa3e9a4';
  const channelName = data.channel;
  const uid = 0;
  // const account = "2882341273";
  const role = RtcRole.PUBLISHER;

  const expirationTimeInSeconds = 3600;

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // IMPORTANT! Build token with either the uid or with the user account. Comment out the option you do not want to use below.

  // Build token with uid
  const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
  // console.log("Token With Integer Number Uid: " + token);

  socket.emit('getToken', { token: token });
  // socket.emit ('getToken', {id:id, channel:channelName, token:token, type:data.type});
  // Build token with user account
  // const tokenB = RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channelName, account, role, privilegeExpiredTs);
  // console.log("Token With UserAccount: " + tokenB);
};
