// const http = require("http");
// const https = require("https");
// const AWS = require("aws-sdk");
// const formidable = require("formidable");
import formidable from "formidable";
import uuid from "uuid";
import COS from "cos-nodejs-sdk-v5";

// let server = http.createServer(launch);
// let s3 = new AWS.S3({
//   // s3 credentials
// });


var cos = new COS({
  SecretId: "IKIDMXZJn382h6D4exzqTpujHckeYHmLdfS0",
  SecretKey: "RebIp79xWquiIdjZAXewTs2wa2JOJ1Uk",
});

function uploadToCos(file, destFileName, callback) {
  let uploadParams = {
    Bucket: config.bucket.name,
    Key: destFileName,
    Body: "",
  };
  let fileStream = fs.createReadStream(file.path);
  fileStream.on("error", function (err) {
    console.log("File Error", err);
  });

  uploadParams.Body = fileStream;

  //   s3.upload(uploadParams, callback);

  cos.sliceUploadFile(
    {
      Bucket: Bucket,
      Region: Region,
      Key: destFileName,
      FilePath: file.path,
    },
    function (err, data) {
      console.log(err, data);
    }
  );

  //   deleteFile(file.path);
}

function deleteFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err) {
      console.error(err);
    }
    console.log("Temp File Delete");
  });
}

function launch(request, response) {
  var form = new formidable.IncomingForm();
  form.parse(request, function (error, fields, files) {
    let fileId = uuid.v4();
    let filename = `user-photos/${fileId}.jpg`;
    let file = files.selfie;

    if (!/^image\/(jpe?g|png)$/i.test(file.type)) {
      deleteFile(file.path);
      response.write(
        '{"status": 403, "message": "Expects Image File. Please try again."}'
      );
      return response.end();
    }

    uploadToCos(file, filename, function (error, data) {
      if (error) {
        console.log(error);
        response.write(
          '{"status": 442, "message": "Yikes! Error uploading your photo. Please try again."}'
        );
        return response.end();
      } else if (data) {
        response.write(JSON.stringify({ status: 200, uri: data.Location }));
        return response.end();
      } else {
        response.write(
          '{"status": 442, "message": "Yikes! Error saving your photo. Please try again."}'
        );
        return response.end();
      }
    });
    
  });
}

export { uploadToCos };
