const mysql = require('mysql');
const Password = require('node-php-password');
const config = require('./dbConfig');
const pool = mysql.createPool(config);

// connection.connect();

// connection.query('select username,password from user  where username = ?', ['admin'], (err, res, fields) => {
//   if (err) throw err;
//   console.log(res);
//   if (res.length) {
//     const user = res[0];
//     console.log(Password.verify('admin', user['password']));
//     console.log(Password.verify('admin1', user['password']));
//   } else {
//     console.log('no user');
//   }
// });
const hexToRGB = (hexColor) => {
  if (!hexColor || hexColor.length !== 7) {
    return {r:1, g:1, b:1}; // when err, white color
  } else {
    const rStr = hexColor.substr(1,2);
    const gStr = hexColor.substr(3,2);
    const bStr = hexColor.substr(5,2);
    return {
      r: parseInt(rStr, 16) / 255,
      g: parseInt(gStr, 16) / 255,
      b: parseInt(bStr, 16) / 255
    };
  }
}
const verifyPassword = async (eventId, username, password) => {
  const result = await new Promise(resolve => {
    
    pool.getConnection((err, connection) => {
      if(err) throw err;
      connection.query(
        'select account.id, account.username, account.displayname, account.type, account.password from account ' +
          'LEFT JOIN eventxaccount on eventxaccount.accountid = account.id ' +
          'LEFT JOIN event on event.id = eventxaccount.eventid ' + 
          'where username = ? AND eventxaccount.eventid = ? AND event.status = ?', 
        [username, eventId, 1], 
        (err, res, fields) => {
          connection.release();
          if (err) {
            console.log(err);
            resolve(false);
          }
          // console.log(res);
          if (res.length) {
            const user = res[0];
            // console.log(user['username']);
            // console.log(user['password']);
            // console.log(password);
            const isSuccess = Password.verify(password, user['password']);
            if (isSuccess) {
              resolve({
                id: user['id'],
                displayname: user['displayname'],
                type: user['type']
              });
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        }
      );
    });
  });
  return result;
}

const getEventData = async (eventId) => {
  const rooms = await new Promise(resolve => {
    pool.getConnection((err, connection) => {
      connection.query(
        // 'select * from event where id = ?',
        'SELECT * FROM `event` ' +
          'LEFT JOIN roomsetting ON roomsetting.eventid = event.id ' +
          'WHERE event.id = ? ORDER BY roomsetting.roomid ASC',
        [eventId],
        (err, res, fields) => {
          connection.release();
          if (err) {
            console.log(err);
            resolve(false);
          }
          if (res.length) {
            const event = res[0];
            resolve(res);
            // resolve({
            //   eventName: event['eventname'],
            //   logo: event['logo'],
            //   startTime: event['starttime'],
            //   endTime: event['endtime'],
            //   description: event['description'],
            // })
          } else {
            resolve(false);
          }
        }
      );
    });
  });
  const eventData = {
    name: rooms[0]['eventname'],
    starttime: rooms[0]['starttime'],
    endtime: rooms[0]['endtime'],
    logo: (rooms[0]['logo']? '/api' + rooms[0]['logo']: ''),
    description: rooms[0]['description'],
  };
  let queryStr = '';
  let queryParams = [];
  // console.log(rooms);
  rooms.forEach(async room => {
    if (room['type'] === 'expo') {
      queryStr += 'SELECT *, exporoom.status FROM roomsetting ' + 
        'LEFT JOIN exporoom ON exporoom.roomsettingid = roomsetting.id ' +
        'WHERE roomsetting.id = ? ORDER BY exporoom.sortorder ASC;';
    } else if (room['type'] === 'private') {
      queryStr += 'SELECT * FROM roomsetting ' + 
        'LEFT JOIN privateroom ON privateroom.roomsettingid = roomsetting.id ' +
        'WHERE roomsetting.id = ?;';
    } else if (room['type'] === 'media') {
      queryStr += 'SELECT * FROM roomsetting ' + 
        'LEFT JOIN mediaroom ON mediaroom.roomsettingid = roomsetting.id ' +
        'WHERE roomsetting.id = ?;';
    } else { // speech, island
      queryStr += 'SELECT * FROM roomsetting ' + 
        // 'LEFT JOIN mediaroom ON mediaroom.roomsettingid = roomsetting.id ' +
        'WHERE roomsetting.id = ?;';
    }
    queryParams.push(room['id']);
  })
  // console.log(queryStr);
  const roomDetails = await new Promise(resolve => {
    
    pool.getConnection((err, connection) => {
      connection.query(
        queryStr,
        queryParams,
        (err, res, fields) => {
          connection.release();
          if (err) {
            console.log(err);
            resolve(false);
          }
          if (res.length) {
            let returnValue = [];
            res.forEach(room => {
              let roomReturn = {
                isEnabled: !!room[0]['enabled'],
                color: hexToRGB(room[0]['roomcolor']),
                type: room[0]['type'],
                logo: eventData['logo'],
              };
              if (room.length > 1) { // ['type'] === 'expo') {
                roomReturn['booth'] = [];
                room.forEach(booth => {
                  roomReturn['booth'].push({
                    isEnabled: !!booth['status'],
                    logo: (booth['logo']? '/api' + booth['logo']: ''),
                    banner: [
                      {
                        image: (booth['image1']? '/api' + booth['image1']: ''),
                        url: booth['url1']
                      },
                      {
                        image: (booth['image2']? '/api' + booth['image2']: ''),
                        url: booth['url2']
                      },
                      {
                        image: (booth['image3']? '/api' + booth['image3']: ''),
                        url: booth['url3']
                      },
                      {
                        image: (booth['image4']? '/api' + booth['image4']: ''),
                        url: booth['url4']
                      },
                      {
                        image: (booth['image5']? '/api' + booth['image5']: ''),
                        url: booth['url5']
                      },
                      {
                        image: (booth['image6']? '/api' + booth['image6']: ''),
                        url: booth['url6']
                      },
                      {
                        image: (booth['image7']? '/api' + booth['image7']: ''),
                        url: booth['url7']
                      }
                    ]
                  })
                })
                roomReturn["type"] = "Expo";
              } else if (room[0]['type'] === 'media') {
                roomReturn['url'] = room[0]['url'];
                roomReturn["type"] = "VPR";
              } else if (room[0]['type'] === 'private') {
                roomReturn['code'] = room[0]['password'];
                roomReturn["type"] = "Private";
              } else if (room[0]['type'] === 'speech') {
                roomReturn["type"] = "Stage";
              //   returnValue['code'] = res[0]['password'];
              } else if (room[0]['type'] === 'island') {
                roomReturn["type"] = "Island";
              //   returnValue['code'] = res[0]['password'];
              }
              returnValue.push(roomReturn);
            })
            // console.log(returnValue);
            // console.log(res[0]['type']);
            resolve(returnValue);
          } else {
            resolve([]);
          }
        }
      );
    });
  });
  // console.log(roomDetails);
  return {
    eventdata: eventData,
    roomData: roomDetails
  };
}

const saveDisplayname = (userId, displayName) => {
  pool.getConnection((err, connection) => {
    connection.query(
      'UPDATE account set displayname = ? WHERE id = ?',
      [displayName, userId],
      () => {
        connection.release();
      }
    )
  })
}

module.exports = {
  // connection,
  verifyPassword,
  getEventData,
  saveDisplayname
}