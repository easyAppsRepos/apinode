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

  expressApp.post('/reservasUser', (req, res) => {
    db(`SELECT c.nombre as nombreCentro, r.idCita, r.idCentro, r.horaInicio,
      r.estado FROM centro as c, cita as r WHERE c.idCentro = r.idCentro AND r.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/cambiarFavorito', (req, res) => {
    db(`INSERT INTO usuario_favorito(idCentro,idCliente,estado) VALUES (?,?,1)
  ON DUPLICATE KEY UPDATE estado= 1 - estado`,[req.body.idCentro,req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({insertId:data.insertId});
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/editarServicio', (req, res) => {
    db(`UPDATE servicio set nombre=?,duracion=?,precio=?,estado=?, 
      descripcion=?, idCategoria=? WHERE idServicio = ?`,[req.body.nombre,req.body.duracion,
      req.body.precio,req.body.estado,req.body.descripcion,req.body.idCategoria,req.body.idServicio])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/editarCupon', (req, res) => {
    db(`UPDATE cupon set nombre=?,codigo=?,porcentajeDescuento=?,fechaExpira=?,estado=?
     WHERE idCupon = ?`,[req.body.nombre,req.body.codigo,
      req.body.porcentajeDescuento,req.body.fechaExpira,req.body.estado,req.body.idCupon])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/buscarOfertas', (req, res) => {
    db(`SELECT c.nombre as nombreCentro, 
      s.precio, 
      s.nombre as nombreOferta,
      s.precioOferta, 
      (SELECT COUNT(DISTINCT ec.puntuacion)  FROM  evaluacionCentro as ec WHERE ec.idCentro = c.idCentro) as cantRate, (SELECT AVG(ec.puntuacion) as rate  FROM  evaluacionCentro as ec WHERE ec.idCentro = c.idCentro) as rate,
       ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
        FROM servicio as s, centro as c 
      WHERE c.idCentro = s.idCentro 
      AND s.idCategoria = 8 
      AND s.estado = 1 
`,[req.body.lat, req.body.lon, req.body.lat])
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

  expressApp.post('/favoritosGPS', (req, res) => {
    db(`      SELECT c.*, 
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate,
       ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
          FROM usuario_favorito as uf, servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.idCentro = uf.idCentro AND uf.idCliente=? AND uf.estado = 1
      AND s.estado = 1 
      GROUP BY c.idCentro
      `,[req.body.lat, req.body.lon, req.body.lat, req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getOpiniones', (req, res) => {
    db(`SELECT ec.estado, ec.comentario, ec.puntuacion, ec.fechaCreacion, c.nombre, c.idFoto, ci.horaFinalEsperado,
 (SELECT SUM(s.precio) FROM servicio as s, servicio_cita as sc WHERE sc.idServicio = s.idServicio AND sc.idCita = ci.idCita) as total 
 FROM evaluacionCentro as ec, centro as c, cita as ci 
 WHERE ec.idCentro = c.idCentro AND ec.idCita = ci.idCita AND  ci.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCupones', (req, res) => {
    db(`SELECT c.nombre as nombreCupon, ce.nombre as nombreCentro, 
      c.fechaExpira, cc.estado, cc.fechaUso FROM cupon as c, centro as ce, cupon_cliente as cc 
      WHERE ce.idCentro = c.idCentro AND c.idCupon = cc.idCupon AND cc.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/getClienteCupones', (req, res) => {
  
    db(`SELECT c.nombre as nombreCupon, ce.nombre as nombreCliente, ce.email,
      c.fechaExpira, cc.estado, cc.fechaUso, cc.fechaActivacion FROM cupon as c, cliente as ce, cupon_cliente as cc 
      WHERE ce.idCliente = cc.idCliente AND c.idCupon = cc.idCupon AND cc.idCupon = ?`,[req.body.idCupon]).then((data) => {

        if (!data) res.send().status(500);

    var groups = _.groupBy(data, 'estado');
    

/*    let total = 0;
    data[1].forEach((elementw, index) => {
    total += elementw.precio;
    });
    data[0][0].total = total;

*/

        return res.send(groups);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/canjearCupon', (req, res) => {
    db(`INSERT INTO cupon_cliente(idCliente, idCupon, fechaActivacion, estado)
SELECT ?, c.idCupon, ?, 1 FROM cupon as c WHERE c.codigo = ? 
AND c.fechaExpira > CURRENT_TIMESTAMP 
AND c.estado = 1`,[req.body.idCliente,moment(Date.now()).format("YYYY-MM-DD"), req.body.codigo])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
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
    let idCita=null;

    db(`INSERT INTO cita (idCentro, idCliente, horaInicio, horaFinalEsperado, precioEsperado,
      notaCita, estado, idEmpleado ) 
        VALUES (?,?,?,?,?,?,?,?)
        `,[req.body.data.idCentro, req.body.idCliente,horaFinal,
        horaFinal,req.body.total, req.body.notaCita, 1, req.body.idEmpleado])
      .then((data) => {
        console.log(data);
        if (!data) {
          res.send().status(500);
        }

        let arrayFunctions = [];
        idCita = data.insertId;
        //
        req.body.servicios.forEach((elementw, index) => {

            arrayFunctions.push(db(`INSERT INTO servicio_cita (idCita, idServicio, estado) 
            VALUES (?,?,0)
            `,[data.insertId, elementw.idServicio]));

          });
      Promise.all(arrayFunctions).then((data) => {
        if (!data) res.send().status(500);
         return res.send({insertId:idCita });
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

  expressApp.post('/getCentroServiciosC', (req, res) => {
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, s.estado, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({servicios:data});
      }).catch(err => res.send(err).status(500));
  });
  expressApp.post('/getCuponesCentro', (req, res) => {
    db(`SELECT c.*,  CAST(DATE(c.fechaExpira) AS char) as soloFecha FROM cupon as c WHERE c.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({cupones:data});
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/getDataCita', (req, res) => {
     Promise.all([
    db(`SELECT c.idCentro, c.nombre, c.direccion, c.idFoto, c.telefono,c.latitud, c.longitud, 
      ci.idCita, ci.estado, ci.notaCita, ci.comentarioEstado, ci.idEmpleado, ci.horaInicio, ci.idCliente FROM centro as c, cita as ci 
      WHERE ci.idCita = ? AND c.idCentro = ci.idCentro`,[req.body.idCita]),
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c, servicio_cita as sc  
      WHERE s.idServicio = sc.idServicio AND sc.idCita = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCita])
    ])
      .then((data) => {

        if (!data) res.send().status(500);
    //var groups = _.groupBy(data[0], 'nombreCategoria');
    

    let total = 0;
    data[1].forEach((elementw, index) => {
    total += elementw.precio;
    });
    data[0][0].total = total;



        return res.send({cita:data[0], servicios:data[1]});
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/doLoginApi', (req, res) => {

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.email, 
      u.fbId, u.idFoto, u.estado FROM cliente as u WHERE u.email = ? AND u.password = ?`,[req.body.username,req.body.password]).then((data) => {
      console.log(data);
      if (data) {
        return res.send({
          data: data
          });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

//"INSERT INTO Usuarios(nombre, email, fbId, imagenFB) values(?, ?, ?, ?)"
    expressApp.post('/addUserEmail', (req, res) => {

    db(`INSERT INTO cliente(nombre,email,telefono,password) 
      VALUES(?, ?, ?, ?)`,[req.body.nombre,req.body.email,req.body.telefono,req.body.password]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/addNegocio', (req, res) => {

    db(`INSERT INTO centro(nombre,nombreTitular,telefono,email, estado) 
      VALUES(?, ?, ?, ?, 0)`,[req.body.nombre,req.body.nombre2,req.body.telefono,req.body.email]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });





        expressApp.post('/nuevoServicio', (req, res) => {

    db(`INSERT INTO servicio(nombre,duracion,precio,estado, descripcion,idCategoria, idCentro) 
      VALUES(?, ?, ?, ?, ?, ?, ?)`,[req.body.nombre,req.body.duracion,req.body.precio,req.body.estado,
      req.body.descripcion,req.body.idCategoria,req.body.idCentro]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });
        expressApp.post('/nuevoCupon', (req, res) => {

    db(`INSERT INTO cupon(nombre,idCentro,codigo,porcentajeDescuento, fechaExpira,estado) 
      VALUES(?, ?, ?, ?, ?, ?)`,[req.body.nombre,req.body.idCentro,req.body.codigo,req.body.porcentajeDescuento,
      req.body.fechaExpira,req.body.estado]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });
 
    expressApp.post('/addUserFb', (req, res) => {

    db(`INSERT INTO cliente(nombre,email,fbId,imagenFb) 
      VALUES(?, ?, ?, ?)`,[req.body.nombre,req.body.email,req.body.fbId,req.body.imagenFB]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/verificarFBLog', (req, res) => {

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.email, 
      u.fbId, u.idFoto, u.estado FROM cliente as u WHERE u.fbId = ? AND u.estado = 1`,[req.body.userId]).then((data) => {
      console.log(data);
      if (data) {
        return res.send({
          data: data
          });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });
    


  expressApp.post('/addPush', (req, res) => {
    db(`INSERT INTO pushHandler (idCliente, so, pushKey, deviceID) 
        VALUES (?, ?, ?, ?)
        `,[req.body.user, req.body.device, req.body.pushK, req.body.deviceId])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
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
