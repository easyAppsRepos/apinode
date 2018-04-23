const express = require('express');
const bodyParser = require('body-parser');
const gcm = require('node-gcm');

const mail = require("nodemailer").mail;
const path = require('path');
const multer  =   require('multer');
const upload = multer();
const cors = require('cors');
const Bcrypt = require('bcrypt');


const db = require('./config/db');

//var sender = new gcm.Sender('AIzaSyB9NRBjhypcU9QZursZiiJuGJMulaCjEmA');
//var iap = require('in-app-purchase');

const { database } = require('./config/credentials');

//API PUSH APN CONFIG - WAITING'

/*var validationType = iap.APPLE;

iap.config({
    applePassword: database.iapSecret
});

*/

/*iap.setup(function (error) {
    if (error) {
        return console.error('something went wrong...');
    }
    // iap is ready
    iap.validate(iap.APPLE, appleReceipt, function (err, appleRes) {
        if (err) {
            return console.error(err);
        }
        if (iap.isValidated(appRes)) {
            // yay good!
        }
    });
});
*/


const app = () => {


  const expressApp = express();
  expressApp.use(bodyParser.urlencoded({ extended: true }));
  expressApp.use(bodyParser.json());
//expressApp.use(cors({origin: 'http://localhost:3003'}));
  expressApp.use(cors({origin: '*'}));


//API BEYOU START

expressApp.get('/categoriasHome', function(req, res) {
    db(`SELECT  s.*, sh.posicion FROM categoria as s INNER JOIN categorias_home as sh ON s.idCategoria = sh.idCategoria LIMIT 8`).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});


expressApp.get('/categoriasActivas', function(req, res) {
    db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1`).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});



  expressApp.get('/test', (req, res) =>
    res.send('Api is running in port 3000'));

  return expressApp.listen(
    3000,
    () => console.log('Connection has been established successfully.')
  );
};

module.exports = app();
