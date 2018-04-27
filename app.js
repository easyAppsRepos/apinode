const express = require('express');
const bodyParser = require('body-parser');
const gcm = require('node-gcm');

const mail = require("nodemailer").mail;
const path = require('path');
const multer  =   require('multer');
const upload = multer();
const cors = require('cors');
const Bcrypt = require('bcrypt');
 var _ = require('underscore');

const db = require('./config/db');
const moment = require('moment');

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

  expressApp.post('/buscarServicios', (req, res) => {
    db(`SELECT c.*, MAX(s.precio) as pMax, MIN(s.precio) as pMin, COUNT(DISTINCT ec.puntuacion) as cantRate, AVG(ec.puntuacion) as rate
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.idCategoria = ? 
      AND s.estado = 1 
      GROUP BY c.idCentro`,[req.body.idCategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/buscarServiciosGPS', (req, res) => {
    db(`SELECT c.*, 
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, 
      ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.idCategoria = ? 
      AND s.estado = 1 
      GROUP BY c.idCentro`,[req.body.lat, req.body.lon, req.body.lat, req.body.idCategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCentroInfo', (req, res) => {
     Promise.all([
    db(`SELECT c.*, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, (SELECT idUsuarioFavorito 
      FROM usuario_favorito WHERE idCentro = ? AND idCliente = ? AND estado = 1) as favorito
      FROM  centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro WHERE c.idCentro = ?
      GROUP BY c.idCentro`,[req.body.idCentro, req.body.idCliente, req.body.idCentro]), 
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCentro]),
    db(`SELECT ev.*, u.nombre as nombreUsuario 
      FROM evaluacionCentro as ev, cliente as u, cita as c 
      WHERE ev.idCentro = ? AND u.idCliente = c.idCliente AND c.idCita = ev.idCita`,[req.body.idCentro])])
      .then((data) => {

        if (!data) res.send().status(500);

        let comentarios = data[2].map((i, index) => {
          console.log(i);

        i.timeAgo =  moment(i.fechaCreacion).fromNow();
         console.log(i);
        return i;});


       

        var groups = _.groupBy(data[1], 'nombreCategoria');
        return res.send({info:data[0],servicios:groups, comentarios:comentarios});
      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/addCita', (req, res) => {

// console.log(req.body);
    //var password = req.body.pass;
   // var salt = Bcrypt.genSaltSync();
   // console.log(password+'-'+ salt);
    //var encryptedPassword = Bcrypt.hashSync(password, salt);
    //,[req.body.email, req.body.pass,req.body.nombre,req.body.telefono]

    let horaInicio = req.body.fecha;
    //let horaFinal = req.body.fecha;
    let horaFinal = moment(req.body.fecha).format("YYYY-MM-DD");


    db(`INSERT INTO cita (idCentro, idCliente, horaInicio, horaFinalEsperado, precioEsperado,
      notaCita, estado ) 
        VALUES (?,?,?,?,?,?,?)
        `,[req.body.data.idCentro, req.body.idCliente,horaFinal,
        horaFinal,req.body.total, req.body.notaCita, 1])
      .then((data) => {
        console.log(data);
        if (!data) {
          res.send().status(500);
        }

        let arrayFunctions = [];
        //
        req.body.servicios.forEach((elementw, index) => {

            arrayFunctions.push(db(`INSERT INTO servicio_cita (idCita, idServicio, estado) 
            VALUES (?,?,0)
            `,[data.insertId, elementw.idServicio]));

          });
      Promise.all(arrayFunctions).then((data) => {
        if (!data) res.send().status(500);
         return res.send({insertId:data.insertId });
      }).catch(err => res.send(err).status(500));


        //return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/getCentroServicios', (req, res) => {
     Promise.all([
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCentro]),
    db(`SELECT e.nombre, e.descripcion, e.idFoto, e.idEmpleado FROM empleado as e WHERE  e.idCentro = ? AND e.estado = 1`,[req.body.idCentro])
    ])
      .then((data) => {

        if (!data) res.send().status(500);




       

        //var groups = _.groupBy(data[0], 'nombreCategoria');
        return res.send({servicios:data[0], empleados:data[1]});
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
