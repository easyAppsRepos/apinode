const express = require('express');
const bodyParser = require('body-parser');
const gcm = require('node-gcm');

const mail = require("nodemailer").mail;
const path = require('path');
const multer  =   require('multer');



const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null,  file.fieldname + '-' + Date.now()+ path.extname(file.originalname));
  }
});



const upload = multer({storage: storage});


const cors = require('cors');
const Bcrypt = require('bcrypt');
 var _ = require('underscore');

const db = require('./config/db');
var moment = require('moment');




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
  expressApp.use('/uploads',express.static('uploads')); 
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

expressApp.get('/categoriasHome2', function(req, res) {
    db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1 `).then((data) => {
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



  expressApp.post('/buscarServiciosFiltro', (req, res) => {

var stringQuery = `SELECT c.*, MAX(s.precio) as pMax, MIN(s.precio) as pMin, COUNT(DISTINCT ec.puntuacion) as cantRate, AVG(ec.puntuacion) as rate
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.estado = 1 AND c.estado = 1 `;

     

         if(req.body.lat && req.body.long){

         stringQuery += ` AND ( 6371 * acos( cos( radians(`+req.body.lat+`) ) * cos( radians( c.latitud ) ) 
         * cos( radians(c.longitud) - radians(`+req.body.long+`)) + sin(radians(`+req.body.lat+`)) 
         * sin( radians(c.latitud)))) < 20 `;

      }


      if(req.body.palabra){
        stringQuery += ` AND c.sobreNosotros LIKE '%`+req.body.palabra+`%'`; 
      }

       if(req.body.servicios.length>0){
        stringQuery += ` AND s.idCategoria IN (`; 

        req.body.servicios.forEach((item, index) => {

          if(req.body.servicios.length == (index+1)){
            stringQuery += item+`)`;
          }
          else{
            stringQuery += item+`,`;
          }  
          

        });

        //req.body.servicios.forEach


      }

      //
      if(req.body.fecha){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro  AND hh.diaSemana=`+req.body.fecha+`) > 0 `;
      }

       if(req.body.filtroHora){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro  AND hh.horaAbrir<='`+req.body.filtroHora+`' 
  AND hh.horaCerrar>='`+req.body.filtroHora+`') > 0 `; 
      }


      if(req.body.abierto){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro AND hh.diaSemana=`+req.body.diaSemana+` AND hh.horaAbrir<='`+req.body.horaSemana+`' 
  AND hh.horaCerrar>='`+req.body.horaSemana+`') > 0 `; 
      }
      if(req.body.disponible){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro AND hh.diaSemana=`+req.body.diaSemana+`) > 0 `; 
      }

 stringQuery += ` GROUP BY c.idCentro`; 

  if(req.body.ordenOpiniones){
        //stringQuery += ` ORDER BY pMax `+req.body.orden+` `; 
    stringQuery += ` ORDER BY rate DESC `; 
        if(req.body.orden){
        stringQuery += ` , pMin `+req.body.orden+` `; 
      }


      }

else{
        if(req.body.orden){

                //stringQuery += ` ORDER BY rate DESC `; 
                  stringQuery += ` ORDER BY pMin `+req.body.orden+` `; 
              }
      }

   //  stringQuery += ` GROUP BY c.idCentro`; 

     console.log(stringQuery);

    //db(stringQuery,[req.body.idCategoria])
    db(stringQuery)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/reservasUser', (req, res) => {
    db(`SELECT c.nombre as nombreCentro, c.idFoto, r.idCita, r.idCentro, r.horaInicio,
      r.estado FROM centro as c, cita as r WHERE c.idCentro = r.idCentro AND r.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
  expressApp.post('/categoriaEmpleados', (req, res) => {
    db(`SELECT c.*, 
      (SELECT ec.estado 
      FROM empleado_categoria as ec 
      WHERE ec.idCategoria = c.idCategoria 
      AND ec.idEmpleado = ? AND ec.estado = 1) as estadoEmpleadoCategoria 
      FROM categoria as c WHERE c.estado = 1 
 `,[req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
 expressApp.post('/citasUserSA', (req, res) => {
    db("SELECT  df.nombre as nombreCentro, df.idFoto, r.precioEsperado, em.nombre as nombreEmpleado, r.idCita, r.idCentro, CONCAT(DATE_FORMAT(r.`horaInicio`, '%d/%m/%y %H:%i'), ' - ', DATE_FORMAT(r.`horaFinalEsperado`, '%H:%i')) as FechaCita, r.comentarioCita,r.comentarioEstado, r.notaCita, r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita AND sc.estado = 0) as totalServicios, (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  FROM centro as df, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado WHERE df.idCentro = r.idCentro AND r.idCliente  = ?",[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data, 'estado');
            return res.send(groups);
           //return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/citasCentroC', (req, res) => {
    db(`SELECT c.nombre as nombreCliente, r.precioEsperado, c.telefono, em.nombre as nombreEmpleado, (SELECT SUM(s.precio) FROM servicio as s, servicio_cita as sc WHERE sc.idServicio = s.idServicio AND sc.idCita = r.idCita) as total,
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita,r.comentarioEstado, r.notaCita, r.horaInicio,r.horaFinalEsperado,
      r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND r.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data, 'estado');
            return res.send(groups);

      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/citasCentroFiltro', (req, res) => {
    db(`SELECT c.nombre as nombreCliente, r.precioEsperado, c.telefono, em.nombre as nombreEmpleado, (SELECT SUM(s.precio) FROM servicio as s, servicio_cita as sc WHERE sc.idServicio = s.idServicio AND sc.idCita = r.idCita) as total,
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita,r.comentarioEstado, r.notaCita, r.horaInicio,r.horaFinalEsperado,
      r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND r.idCentro = ? AND DATE(r.horaInicio) = ?`,[req.body.idCentro, req.body.fecha])
      .then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data, 'estado');
            return res.send(groups);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/citasCentroC2', (req, res) => {
    db(`SELECT c.nombre as nombreCliente, c.telefono, em.nombre as nombreEmpleado, (SELECT SUM(s.precio) FROM servicio as s, servicio_cita as sc WHERE sc.idServicio = s.idServicio AND sc.idCita = r.idCita) as total,
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita, r.notaCita, r.horaInicio,
      r.estado FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND (r.estado = 1 OR r.estado = 2) AND r.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);

            return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCategoriasSA', (req, res) => {
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, s.estado, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado =  1`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);

            return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCategoriasAllSA', (req, res) => {
    db(`SELECT c.*, (SELECT COUNT(g.idServicio) FROM servicio as g WHERE idCategoria = c.idCategoria) as cantServicios FROM categoria as c`)
      .then((data) => {
        if (!data) res.send().status(500);

            return res.send(data);

      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/getCalendario', (req, res) => {
    db(`SELECT c.nombre as nombreCliente, c.telefono, em.nombre as nombreEmpleado, em.idEmpleado as idEmpleado, 
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita, r.notaCita, r.horaInicio,
      r.horaFinalEsperado,r.estado FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND (r.estado = 1 OR r.estado = 2)`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);

            return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getCalendario2', (req, res) => {
    db(`SELECT c.nombre as nombreCliente, c.telefono, em.nombre as nombreEmpleado, em.idEmpleado as idEmpleado, 
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita, r.notaCita, r.horaInicio,
      r.horaFinalEsperado,r.estado, (SELECT GROUP_CONCAT(x.nombre) FROM servicio as x, servicio_cita as sc
WHERE x.idServicio = sc.idServicio AND sc.idCita = r.idCita
) as servicios FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND (r.estado = 1 OR r.estado = 2) AND r.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
  //console.log('---s---');
       // console.log(req.body.idCentro);
        if (!data) res.send().status(500);


         let appointments = new Array();

              data.forEach((item, index) => {
moment.locale('es');
        let appnt = {
        id: item['idCita']+'',
        description: item['servicios'],
        location: "",
        detalle: item['nombreCliente']+'. '+moment.utc(item['horaInicio']).format("hh:mm a")+
        '-'+moment.utc(item['horaFinalEsperado']).format("hh:mm a"),
         subject: item['nombreCliente'],
        calendar: item['nombreEmpleado'],
        // start: new Date(item['horaInicio']).toUTCString(),
      //  end: new Date(item['horaFinalEsperado']).toUTCString()
       start: moment.utc(item['horaInicio']).format("YYYY-MM-DD HH:mm:ss"),
     end: moment.utc(item['horaFinalEsperado']).format("YYYY-MM-DD HH:mm:ss")

        };
        console.log(appnt);
        //appointments.push(appointmentDataFields);    
        appointments.push(appnt);

        });



            return res.json(appointments);

      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/getCalendario3', (req, res) => {
    db(`SELECT c.nombre as nombreCliente, c.telefono, em.nombre as nombreEmpleado, em.idEmpleado as idEmpleado, 
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita, r.notaCita, r.horaInicio,
      r.horaFinalEsperado,r.estado, CAST(DATE(r.horaInicio) AS char) as soloFecha, (SELECT GROUP_CONCAT(x.nombre) FROM servicio as x, servicio_cita as sc
WHERE x.idServicio = sc.idServicio AND sc.idCita = r.idCita
) as servicios FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND (r.estado = 1 OR r.estado = 2) AND r.idCentro = ? ORDER BY r.horaInicio ASC`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);

              data.forEach((item, index) => {

        data[index].detalle = item['nombreCliente']+'. '+moment.utc(item['horaInicio']).format("hh:mm a")+
        '-'+moment.utc(item['horaFinalEsperado']).format("hh:mm a");
        data[index].horaString = moment.utc(item['horaInicio']).format("MMM Do YY");

        });




            var groups = _.groupBy(data, 'soloFecha');


            return res.send(groups);


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


  expressApp.post('/updateCategoriaEmpleado', (req, res) => {
    db(`INSERT INTO empleado_categoria(idEmpleado,idCategoria,estado) VALUES (?,?,?)
  ON DUPLICATE KEY UPDATE estado= ?`,[req.body.idEmpleado,req.body.idCategoria, req.body.estado,req.body.estado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/marcarEnOferta', (req, res) => {
    db(`UPDATE control_oferta set idServicio=?, precioOferta=?,
      estado=1 WHERE idCentro = (SELECT idCentro FROM servicio WHERE idServicio = ?) 
      AND estado = 0 AND fechaCaducidad>CURRENT_TIMESTAMP  LIMIT 1`,[req.body.idServicio,req.body.precioOferta,req.body.idServicio])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/actulizarHorario', (req, res) => {
    db(`INSERT INTO horarioCentro(idCentro,diaSemana,horaAbrir,horaCerrar,estado) VALUES (?,?,?,?,?)
  ON DUPLICATE KEY UPDATE diaSemana=?,horaAbrir=?,horaCerrar=?,estado=?`,[req.body.idCentro,
  req.body.diaSemana,req.body.horaAbrir,req.body.horaCerrar,req.body.estado,req.body.diaSemana,
  req.body.horaAbrir,req.body.horaCerrar,req.body.estado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/agregarOpinion', (req, res) => {
    db(`UPDATE evaluacionCentro set puntuacion=?,comentario=?,estado=2
     WHERE idEvaluacionCentro = ?`,[req.body.evaluacion, req.body.comentario,req.body.idEvaluacionCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/editarUsuario', (req, res) => {
    db(`UPDATE cliente set nombre=?,telefono=?,genero=?
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.genero,
     req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/editarParametro', (req, res) => {
    db(`UPDATE parametros set valor=? WHERE idParametro=?`,[req.body.valor,req.body.idParametro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/editarUsuarioSA', (req, res) => {
    db(`UPDATE cliente set nombre=?,telefono=?,idGenero=?,estado=?
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.idGenero,req.body.estado,req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });







    expressApp.post('/subirImagen', upload.single('imageU'),(req, res) => {
      console.log(req.file);

/*    db(`UPDATE cliente set nombre=?,telefono=?,genero=?
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.genero,
     req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));*/


  });



  expressApp.post('/editarServicio', (req, res) => {
    db(`UPDATE servicio set nombre=?,duracion=?,precio=?,estado=?, 
      descripcion=?, idCategoria=?, idSubcategoria=? WHERE idServicio = ?`,[req.body.nombre,req.body.duracion,
      req.body.precio,req.body.estado,req.body.descripcion,req.body.idCategoria,req.body.idSubcategoria,req.body.idServicio])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  

    expressApp.post('/cancelarCita', (req, res) => {
    db(`UPDATE cita set estado=4 WHERE idCita = ?`,[req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/reprogramarCita2', (req, res) => {
    db(`UPDATE cita set horaInicio=?, horaFinalEsperado=?,comentarioEstado=?, estado=5  WHERE idCita = ?`,[req.body.fechaCompleta,
      req.body.horaFinalEsperado,req.body.comentarioEstado,req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/reprogramarCita', (req, res) => {
    db(`UPDATE cita set horaInicio=?, horaFinalEsperado=?, estado=1  WHERE idCita = ?`,[req.body.horaInicio,
      req.body.horaFinalEsperado,req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

/*
  expressApp.post('/reprogramarCita', (req, res) => {
    db(`UPDATE cita set horaInicio=?, estado=5 WHERE idCita = ?`,[req.body.fechaCompleta,req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
*/




    expressApp.post('/aceptarReprogramacion', (req, res) => {
    db(`UPDATE cita set estado=2  WHERE idCita = ?`,[req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/editarUC', (req, res) => {
    db(`UPDATE usuario_consola set nombre=?,email=?,password=?,estado=? 
      WHERE idUsuarioConsola = ?`,[req.body.nombre,req.body.email,
      req.body.password,req.body.estado,req.body.idUsuarioConsola])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/editarStaf', (req, res) => {
    db(`UPDATE empleado set nombre = ?, descripcion = ?, estado = ? 
      WHERE idEmpleado = ?`,[req.body.nombre,req.body.descripcion,
      req.body.estado,req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/editarStafImagen', upload.single('imageU'),(req, res) => {
    db(`UPDATE empleado set nombre = ?, descripcion = ?, estado = ?, idFoto=?  
      WHERE idEmpleado = ?`,[req.body.nombre,req.body.descripcion,
      req.body.estado,req.file.path,req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
    expressApp.post('/editarCategoriaN', (req, res) => {
    db(`UPDATE categoria set nombre = ?,  estado = ? 
      WHERE idCategoria = ?`,[req.body.nombre,
      req.body.estado,req.body.idCategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/editarSCategoriaN', (req, res) => {
    db(`UPDATE subcategoria set nombre = ?,  estado = ? 
      WHERE idSubcategoria = ?`,[req.body.nombre,
      req.body.estado,req.body.idSubcategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





    expressApp.post('/editarCategoriaImagen', upload.single('imageU'),(req, res) => {
      console.log(req.file);
    db(`UPDATE categoria set nombre = ?, estado = ?, idFoto=?  
      WHERE idCategoria = ?`,[req.body.nombre,
      req.body.estado,req.file.path,req.body.idCategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/nuevaCategoriaImagen', upload.single('imageU2'),(req, res) => {
      console.log(req.file);
    db(`INSERT INTO categoria(nombre,estado, idFoto) 
      VALUES(?, ?,?)`,[req.body.nombre,
      req.body.estado,req.file.path])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/nuevaCategoria', function(req, res) {

    db(`INSERT INTO categoria(nombre,estado) 
      VALUES(?, ?)`,[req.body.nombre,req.body.estado])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });
        expressApp.post('/nuevaSCategoria', function(req, res) {

    db(`INSERT INTO subcategoria(nombre,estado,idCategoria) 
      VALUES(?, ?,?)`,[req.body.nombre,req.body.estado,req.body.idCategoria])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/actualizarDCentro', upload.any(), (req, res) => {

    const retornoVar = (dato)=>{
      return dato === 'null' ?  null :  dato;
    };

    var rellenoQuery = ' ';
    var files = req.files;
    if(files){
        files.forEach(function(file){

          if(file.fieldname == 'imageU'){

            rellenoQuery+=` idFoto='`+file.path+`',`;
          }
          if(file.fieldname == 'imageB'){
            rellenoQuery+=` imagenBanner='`+file.path+`',`;
          }

        });
    }

    var stringQuery = `UPDATE centro set  nombre=?, `+rellenoQuery+`email=?,fbLink=?,latitud=?, 
      longitud=?, horarioAppBanner=?, sobreNosotros=?,
      direccion=?,telefono=? WHERE idCentro = ?`;

    db(stringQuery,[retornoVar(req.body.nombre),retornoVar(req.body.email),
      retornoVar(req.body.fbLink),retornoVar(req.body.latitud),retornoVar(req.body.longitud),retornoVar(req.body.horarioAppBanner),
        retornoVar(req.body.sobreNosotros),
      retornoVar(req.body.direccion),retornoVar(req.body.telefono),retornoVar(req.body.idCentro)])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/actualizarDCentroBA', (req, res) => {
    db(`UPDATE centro set nombre=?,email=?,fbLink=?,latitud=?, 
      longitud=?, horarioAppBanner=?, sobreNosotros=?,
      direccion=?,telefono=? WHERE idCentro = ?`,[req.body.nombre,req.body.email,
      req.body.fbLink,req.body.latitud,req.body.longitud,req.body.horarioAppBanner,req.body.sobreNosotros,
      req.body.direccion,req.body.telefono,req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  }); 
  
  expressApp.post('/editarCupon', (req, res) => {
    db(`UPDATE cupon set nombre=?,codigo=?,porcentajeDescuento=?,fechaExpira=?,estado=?, tipo=?, tipoDescuento=? 
     WHERE idCupon = ?`,[req.body.nombre,req.body.codigo,
      req.body.porcentajeDescuento,req.body.fechaExpira,req.body.estado,req.body.tipo, req.body.tipoDescuento,req.body.idCupon])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/confirmarCita', (req, res) => {
    db(`UPDATE cita set  estado=2 WHERE idCita = ?`,[req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/completasssrCita', (req, res) => {
    db(`UPDATE cita set  estado=3 WHERE idCita = ?`,[req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/completarCita', (req, res) => {
     Promise.all([
    db(`UPDATE cita set  estado=3 WHERE idCita = ?`,[req.body.idCita]), 
    db(`INSERT INTO evaluacionCentro (idCentro,idCita) 
      VALUES((SELECT x.idCentro FROM cita as x WHERE x.idCita = ?), ?)`,[req.body.idCita,req.body.idCita])])
      .then((data) => {

        if (!data) res.send().status(500);

           return res.send(data[0]);


      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getVentas', (req, res) => {
     Promise.all([
    db(`SELECT c.nombre, c.idCentro, c.estado, SUM(f.comision) as comision,
       (SELECT SUM(co.costo) FROM control_oferta AS co WHERE co.idCentro = c.idCentro  AND co.fechaCreacion between ? 
      AND LAST_DAY(?)) + (SELECT SUM(co.costo) FROM paquete_centro AS co WHERE co.idCentro = c.idCentro  AND co.fechaCreacion between ? 
      AND LAST_DAY(?)) AS extras, 
      (SELECT n.estadoAsignado FROM control_centro as n 
      WHERE n.fechaCreacion < ? 
      AND n.idCentro=c.idCentro ORDER BY n.fechaCreacion DESC LIMIT 1 ) as estadoMomento  
      FROM centro as c LEFT JOIN cita as f ON c.idCentro = f.idCentro AND
       f.horaFinalEsperado between ? 
      AND LAST_DAY(?) GROUP BY c.idCentro`,[req.body.fechaFixed,req.body.fechaFixed,req.body.fechaFixed,req.body.fechaFixed, req.body.fechaFixed,req.body.fechaFixed, req.body.fechaFixed]), 
    db(`SELECT cc.* FROM control_centro as cc 
      WHERE cc.fechaCreacion between ? 
      AND LAST_DAY(?) 
      ORDER BY cc.idControlCentro ASC`,[req.body.fechaFixed, req.body.fechaFixed])])
      .then((data) => {

        if (!data) res.send().status(500);
var groups = _.groupBy(data[1], 'idCentro');
           return res.send({info:data[0], periodo:groups});


      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getCentrosUsuario', (req, res) => {
    db(`SELECT a.idCentro, c.nombre FROM usuario_consola_centro as a, centro as c WHERE c.idCentro = a.idCentro
       AND a.idUsuarioConsola = ?`,[req.body.idUsuario])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
    expressApp.post('/getSubcategorias', (req, res) => {
    db(`SELECT * FROM subcategoria WHERE idCategoria = ?`,[req.body.idCategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
    



    expressApp.post('/getPaquetes', (req, res) => {
    Promise.all([db(`SELECT b.*, (SELECT  GROUP_CONCAT(DISTINCT f.nombre SEPARATOR ', ') as listaServicios 
      FROM servicio AS f WHERE f.idServicio
       IN (SELECT g.idServicio FROM paquete_servicio AS g 
       WHERE g.idPaqueteCentro = b.idPaqueteCentro) GROUP BY f.idCentro) as listaServicios 
       FROM paquete_centro AS b WHERE b.idCentro = ?  `,[req.body.idCentro]),
    db(`SELECT s.nombre, co.* FROM control_oferta AS co LEFT JOIN servicio AS s 
      ON s.idServicio = co.idServicio WHERE co.idCentro = ? AND co.fechaCaducidad > CURRENT_TIMESTAMP`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({paquetes:data[0], ofertas:data[1]});
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/getUsuariosConsolaSA', (req, res) => {
    db(`SELECT c.idCliente, c.nombre, c.telefono, c.email, c.idGenero,
    c.estado, c.idFoto, c.imagenFb, 
    (SELECT COUNT(f.idCita) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado IN (5,2,1)) as activas, 
    (SELECT COUNT(f.idCita) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado = 3) as completadas
     FROM cliente as c `,[req.body.idUsuario])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




    expressApp.post('/cargaUsuariosConsola', (req, res) => {
    db(`SELECT uc.* FROM usuario_consola  as uc WHERE uc.parentUser = ?`,[req.body.idUsuario])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/cargaUsuariosSA', (req, res) => {
    db(`SELECT uc.*, ucc.idUsuarioConsolaCentro FROM usuario_consola as uc  INNER JOIN usuario_consola_centro as ucc ON 
      ucc.idUsuarioConsola = uc.idUsuarioConsola WHERE ucc.idCentro = ? AND uc.tipo = 1`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/cargaUsuariosConsolaAd', (req, res) => {
    db(`SELECT uc.* FROM usuario_consola  as uc WHERE uc.tipo = 1`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/cargaUsuariosConsolaSA', (req, res) => {
    db(`SELECT uc.*, 
(SELECT COUNT(xs.idUsuarioConsolaCentro) FROM usuario_consola_centro as xs WHERE xs.idUsuarioConsola = uc.idUsuarioConsola) as sucursales,
(SELECT COUNT(r.idCita) FROM cita as r WHERE r.horaFinalEsperado > CURRENT_TIMESTAMP AND r.estado IN (1,2,5) AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as activos,
(SELECT COUNT(r.idCita) FROM cita as r WHERE r.horaFinalEsperado < CURRENT_TIMESTAMP AND r.estado IN (1,2,5) AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as sincerrar,
(SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 3 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as completos
 FROM usuario_consola as uc WHERE uc.tipo = 1`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/cargaCentrosUserSA', (req, res) => {
     Promise.all([db(` SELECT c.idCentro,c.telefono,c.nombre, c.idFoto, c.email, c.estado,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.horaFinalEsperado > CURRENT_TIMESTAMP AND r.estado IN (1,2,5) AND r.idCentro = c.idCentro) as activos,
  (SELECT COUNT(r.idCita) FROM cita as r WHERE r.horaFinalEsperado < CURRENT_TIMESTAMP AND r.estado IN (1,2,5) AND r.idCentro = c.idCentro) as sincerrar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE  r.estado = 3 AND r.idCentro = c.idCentro) as completos
  FROM centro as c WHERE c.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = ?)`,[req.body.idUsuarioConsola]),
     db("SELECT  sx.nombre as nombreCliente, df.nombre as nombreCentro,df.idFoto, r.precioEsperado, r.comision, em.nombre as nombreEmpleado, r.idCita, r.idCentro, CONCAT(DATE_FORMAT(r.`horaInicio`, '%d/%m/%y %H:%i'), ' - ', DATE_FORMAT(r.`horaFinalEsperado`, '%H:%i')) as FechaCita, r.comentarioCita,r.comentarioEstado, r.notaCita, r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita AND sc.estado = 0) as totalServicios, (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  FROM cliente as sx, centro as df, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado WHERE df.idCentro = r.idCentro AND r.idCentro IN (SELECT g.idCentro FROM usuario_consola_centro as g WHERE g.idUsuarioConsola = ? AND sx.idCliente = r.idCliente)",[req.body.idUsuarioConsola]),
      db("SELECT SUM(r.precioEsperado) as total, SUM(r.comision) as comision FROM cita as r WHERE r.estado = 3 AND r.idCentro IN (SELECT g.idCentro FROM usuario_consola_centro as g WHERE g.idUsuarioConsola = ?)",[req.body.idUsuarioConsola])
     ]).then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data[1], 'estado');
        var datav= {sucursales:data[0], info:groups, dataR:data[2]}
        return res.send(datav);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/buscarOfertas', (req, res) => {
    db(`SELECT c.nombre as nombreCentro, 
      s.precio, 
      c.idCentro,
      c.idFoto,
      s.nombre as nombreOferta,
      s.precioOferta, 
      (SELECT COUNT(DISTINCT ec.puntuacion)  FROM  evaluacionCentro as ec WHERE ec.idCentro = c.idCentro) as cantRate, (SELECT AVG(ec.puntuacion) as rate  FROM  evaluacionCentro as ec WHERE ec.idCentro = c.idCentro) as rate
        FROM servicio as s, centro as c 
      WHERE c.idCentro = s.idCentro 
      AND s.idCategoria = 8 
      AND s.estado = 1 
`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/busssscarOfertas', (req, res) => {
    db(`SELECT c.nombre as nombreCentro, 
      s.precio, 
      c.idCentro,
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



  expressApp.post('/getCentrosCuponSA', (req, res) => {
    db(`SELECT c.nombre, c.idCentro, c.idFoto, cc.idCuponCentro, (SELECT COUNT(f.idCuponServicio) FROM cupon_centro as s, cupon_servicio as f WHERE f.idCuponCentro = s.idCuponCentro AND s.idCupon = cc.idCupon AND s.idCentro = c.idCentro) as cantServicios  FROM centro as c 
      INNER JOIN cupon_centro as cc ON cc.idCentro = c.idCentro AND cc.idCupon = ?
`,[req.body.idCupon])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCentrosSucursales', (req, res) => {
    db(`SELECT uc.nombre as centro, uc.idUsuarioConsola as idCentro, c.nombre as nombreCentro, c.idCentro
     FROM usuario_consola as uc, centro as c WHERE uc.tipo = 1 AND c.idCentro IN (SELECT e.idCentro 
      FROM usuario_consola_centro as e WHERE e.idUsuarioConsola = uc.idUsuarioConsola)`)
      .then((data) => {
        if (!data) res.send().status(500);
        var groups = _.groupBy(data, 'centro');
        return res.send(groups);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getServiciosCupon', (req, res) => {
    Promise.all([db(`SELECT DISTINCT s.nombre,s.idServicio, s.precio, s.precioOferta FROM  servicio as s, cupon_centro as cc 
      INNER JOIN cupon_servicio as cs 
      ON  (cc.idCuponCentro = cs.idCuponCentro AND cs.idServicio)
      WHERE s.idCentro = cc.idCentro AND  cc.idCuponCentro = 5 AND  
      s.idServicio IN (SELECT iss.idServicio FROM cupon_servicio as iss 
      WHERE iss.idCuponCentro = ?)`,[req.body.idCuponCetro]),
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, s.estado, c.nombre as nombreCategoria  
      FROM cupon_centro as f, servicio as s, categoria as c 
      WHERE f.idCuponCentro = ? AND s.idCentro = f.idCentro AND c.idCategoria = s.idCategoria AND s.estado =  1`,[req.body.idCuponCetro])])
      .then((data) => {
        if (!data) res.send().status(500);
            var groups = _.groupBy(data[1], 'nombreCategoria');
    

        return res.send({centros:data[0], servicios:groups});
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCC', (req, res) => {
    db(`SELECT c.*, k.porcentajeDescuento, k.nombre as nombreCupon,
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin,COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate FROM  cupon as k, servicio as s, centro as c INNER JOIN cupon_centro AS cce ON cce.idCentro = c.idCentro AND cce.idCupon = ?
      LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro  WHERE c.idCentro = s.idCentro AND s.estado = 1 AND k.idCupon = cce.idCupon GROUP BY c.idCentro`,[req.body.idCupon])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/getOpiniones', (req, res) => {
    db(`SELECT ec.idEvaluacionCentro, ec.estado, ec.comentario, ec.puntuacion, ec.fechaCreacion, ci.idCita, c.nombre, c.idFoto, ci.horaFinalEsperado, ci.precioEsperado
 FROM evaluacionCentro as ec, centro as c, cita as ci 
 WHERE ec.idCentro = c.idCentro AND ec.idCita = ci.idCita AND  ci.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getOpinionesSA', (req, res) => {
     Promise.all([db(`SELECT ec.idEvaluacionCentro, ec.estado, ec.comentario, ec.idCita, ec.puntuacion, ec.fechaCreacion, c.nombre as nombreCliente 
 FROM evaluacionCentro as ec, cliente as c, cita as cx  
 WHERE ec.idCentro=?  AND ec.estado IN (2,3) AND ec.idCita=cx.idCita AND c.idCliente=cx.idCliente`,[req.body.idCentro]),
     db(`SELECT s.idServicio, s.estado, s.precioOferta,s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria`,[req.body.idCentro]),
      db(`SELECT *,  CAST(DATE(fechaCreacion) AS char) as soloFecha FROM control_centro WHERE idCentro = ? ORDER BY fechaCreacion DESC`,[req.body.idCentro]),
      db(`SELECT b.*, (SELECT  GROUP_CONCAT(DISTINCT f.nombre SEPARATOR ', ') as listaServicios 
      FROM servicio AS f WHERE f.idServicio
       IN (SELECT g.idServicio FROM paquete_servicio AS g 
       WHERE g.idPaqueteCentro = b.idPaqueteCentro) GROUP BY f.idCentro) as listaServicios 
       FROM paquete_centro AS b WHERE b.idCentro = ?`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({opiniones:data[0], servicios:data[1], actividad:data[2], paquetes:data[3]});
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

  expressApp.post('/getCuponesApp', (req, res) => {
    db(`SELECT (SELECT GROUP_CONCAT(gg.nombre) FROM centro as gg 
WHERE gg.idCentro IN(SELECT cp.idCentro FROM cupon_centro as cp WHERE cp.idCupon = c.idCupon)) as nombresCentro, c.nombre as nombreCupon, 
 c.fechaExpira, cc.estado, cc.fechaUso, c.idCupon FROM cupon as c, cupon_cliente as cc
WHERE c.idCupon = cc.idCupon AND cc.idCliente = ?`,[req.body.idCliente])
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
  expressApp.post('/agregarCuponCentro', (req, res) => {
    db(`INSERT INTO cupon_centro(idCupon, idCentro) VALUES (?,?)`,[req.body.idCupon, req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getInfoCentro', (req, res) => {
     Promise.all([
    db(`SELECT c.*, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, (SELECT COUNT(r.idCita) FROM cita as r WHERE r.idCentro = c.idCentro AND r.estado = 2) as programadas, (SELECT COUNT(d.idCita) FROM cita as d WHERE d.idCentro = c.idCentro AND d.estado = 3) as completadas,
      (SELECT COUNT(DISTINCT f.idCliente) FROM cliente as f, cita as h WHERE f.idCliente = h.idCliente AND h.estado = 3 AND h.idCentro = c.idCentro) as clientesActivos  
      FROM  centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro 
      WHERE c.idCentro = ?`,[req.body.idCentro]), 
    db(`SELECT  c.nombre, c.email, c.idCliente, COUNT(r.idCita) as cantidad, 
      SUM(r.precioEsperado) as total 
      FROM cliente as c, cita as r 
      WHERE r.idCentro = ? AND r.idCliente = c.idCliente 
      AND r.estado = 3 GROUP BY c.idCliente`,[req.body.idCentro]),
    db(`SELECT SUM(r.precioEsperado) as total, AVG(r.precioEsperado) as promedio 
      FROM cita as r WHERE r.idCentro = ? AND r.estado = 3`,[req.body.idCentro])])
      .then((data) => {

        if (!data) res.send().status(500);

        return res.send({info:data[0],clientes:data[1], dataV:data[2]});


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
      WHERE ev.idCentro = ? AND u.idCliente = c.idCliente AND c.idCita = ev.idCita`,[req.body.idCentro]),
    db(`SELECT c.*, cl.idCuponCliente FROM cupon as c 
      INNER JOIN cupon_centro as d ON ( d.idCupon = c.idCupon  AND d.idCentro = ?) 
      INNER JOIN cupon_cliente as cl ON (c.idCupon = cl.idCupon AND cl.idCliente = ? AND cl.estado = 1) 
WHERE  c.fechaExpira > CURRENT_TIMESTAMP AND c.estado = 1  ORDER BY c.porcentajeDescuento DESC LIMIT 1`,[req.body.idCentro,req.body.idCliente])])
      .then((data) => {

        if (!data) res.send().status(500);

        let comentarios = data[2].map((i, index) => {
          console.log(i);

        i.timeAgo =  moment(i.fechaCreacion).fromNow();
         console.log(i);
        return i;});


       

        var groups = _.groupBy(data[1], 'nombreCategoria');
        return res.send({info:data[0],servicios:groups, comentarios:comentarios, cupon:data[3]});
      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/addCita', (req, res) => {

// console.log(req.body);
    //var password = req.body.pass;
   // var salt = Bcrypt.genSaltSync();
   // console.log(password+'-'+ salt);
    //var encryptedPassword = Bcrypt.hashSync(password, salt);
    //,[req.body.email, req.body.pass,req.body.nombre,req.body.telefono]

    //let horaInicio = req.body.fecha;
    //let horaFinal = req.body.fecha;
   // let horaFinal = moment(req.body.fecha).format("YYYY-MM-DD");
    let idCita=null;

    db(`INSERT INTO cita (idCentro, idCliente, horaInicio, horaFinalEsperado, precioEsperado,
      notaCita, estado, idEmpleado,idCuponCliente ) 
        VALUES (?,?,?,?,?,?,?,?,?)
        `,[req.body.data.idCentro, req.body.idCliente,req.body.fechaInicio,
        req.body.fechaFinal,req.body.total, req.body.notaCita, 1, req.body.idEmpleado, req.body.idCuponCliente])
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



    expressApp.post('/getDataCita', (req, res) => {
     Promise.all([
    db(`SELECT c.idCentro, c.nombre, c.direccion, c.idFoto, c.telefono,c.latitud, c.longitud, 
      ci.idCita, ci.estado, ci.notaCita, ci.comentarioEstado, ci.idEmpleado, ci.horaInicio,
      ci.horaFinalEsperado,precioEsperado, ci.idCuponCliente, ci.idCliente, 
      (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = ci.idCuponCliente) as descuento FROM centro as c, cita as ci 
      WHERE ci.idCita = ? AND c.idCentro = ci.idCentro`,[req.body.idCita]),
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c, servicio_cita as sc  
      WHERE s.idServicio = sc.idServicio AND sc.idCita = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCita]),
    db(`SELECT h.* FROM horarioCentro AS h INNER JOIN cita as c 
      ON c.idCentro = h.idCentro AND c.idCita = ?`,[req.body.idCita])
    ])
      .then((data) => {

        if (!data) res.send().status(500);
    //var groups = _.groupBy(data[0], 'nombreCategoria');
  
        return res.send({cita:data[0], servicios:data[1], horario:data[2]});
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCentroServicios', (req, res) => {
     Promise.all([
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCentro]),
    db(`SELECT e.nombre, e.descripcion, e.idFoto, e.idEmpleado FROM empleado as e WHERE  e.idCentro = ? AND e.estado = 1`,[req.body.idCentro]),
    db(`SELECT * FROM horarioCentro WHERE idCentro = ?`,[req.body.idCentro])
    ])
      .then((data) => {

        if (!data) res.send().status(500);




       

        //var groups = _.groupBy(data[0], 'nombreCategoria');
        return res.send({servicios:data[0], empleados:data[1], horario:data[2]});
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getCentroServiciosC', (req, res) => {
     Promise.all([db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.estado, s.idSubcategoria, s.idCategoria, s.descripcion, c.nombre as nombreCategoria, co.precioOferta, co.duracion as duracionOferta  
      FROM  categoria as c, servicio as s LEFT JOIN control_oferta AS co ON (co.idServicio = s.idServicio AND  co.fechaCaducidad > CURRENT_TIMESTAMP )  
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria`,[req.body.idCentro]),
     db(`SELECT * FROM control_oferta WHERE idCentro = ? AND estado = 0 AND fechaCaducidad > CURRENT_TIMESTAMP`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({servicios:data[0], ofertas:data[1]});
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCentrosAll', (req, res) => {
    db(`SELECT * from centro ORDER BY FIELD(estado, 2, 1, 3) ASC`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getParametros', (req, res) => {
    db(`SELECT * from parametros`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/getParametrosFF', (req, res) => {
    db(`SELECT (SELECT valor FROM parametros WHERE idParametro = 3) AS duracionOferta, (SELECT valor FROM parametros WHERE idParametro = 4) AS costonOferta,  (SELECT valor FROM parametros WHERE idParametro = 5) AS duracionPaquete, (SELECT valor FROM parametros WHERE idParametro = 6) AS costoPaquete `)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/getStaff', (req, res) => {
    db(`SELECT e.nombre, e.descripcion, e.idFoto, e.estado, e.idEmpleado FROM empleado as e WHERE
       e.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




    expressApp.post('/getHorario', (req, res) => {
   db(`SELECT * FROM horarioCentro WHERE idCentro = ?`,[req.body.idCentro]).then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCuponesCentro', (req, res) => {
    db(`SELECT c.*,  CAST(DATE(c.fechaExpira) AS char) as soloFecha FROM cupon as c WHERE c.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({cupones:data});
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCuponesAll', (req, res) => {
    db(`SELECT c.*,  CAST(DATE(c.fechaExpira) AS char) as soloFecha FROM cupon as c`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({cupones:data});
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/borrarServicioCita', function(req, res) {
     db(`DELETE FROM servicio_cita WHERE idServicioCita = ?`,[req.body.idServicioCita])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/eliminarUsuarioC', function(req, res) {
     db(`DELETE FROM usuario_consola WHERE idUsuarioConsola = ?`,[req.body.idUsuarioConsola])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

    


    expressApp.post('/borrarServicioCita2', function(req, res) {

      console.log(req.body);
     Promise.all([
     
      db(`UPDATE cita as xx set xx.horaFinalEsperado = (xx.horaFinalEsperado - INTERVAL (SELECT l.duracion FROM servicio as l WHERE l.idServicio = ? ) MINUTE), xx.precioEsperado = 
      xx.precioEsperado-(SELECT (s.precio - (s.precio * (IFNULL(c.porcentajeDescuento, 0)/100))) as precioDescuento 
      FROM servicio as s , (SELECT * FROM cita) as r  
      LEFT JOIN cupon_cliente as cc ON ( cc.idCuponCliente = r.idCuponCliente ) 
      LEFT JOIN cupon as c ON cc.idCupon = c.idCupon 
      WHERE s.idServicio = ? AND r.idCita = ?) 
      WHERE xx.idCita = ? `,[req.body.idServicio,req.body.idServicio, req.body.idCita,req.body.idCita]),
       db(`DELETE FROM servicio_cita WHERE idServicioCita = ?`,[req.body.idServicioCita])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/agregarServicioCita', function(req, res) {

    Promise.all([db(`INSERT INTO servicio_cita(idCita,idServicio) 
      VALUES(?, ?)`,[req.body.idCita,req.body.idServicio]),
    db(`UPDATE cita as xx set xx.horaFinalEsperado = (xx.horaFinalEsperado + INTERVAL (SELECT l.duracion FROM servicio as l WHERE l.idServicio = ? ) MINUTE),xx.precioEsperado = 
      xx.precioEsperado+(SELECT (s.precio - (s.precio * (IFNULL(c.porcentajeDescuento, 0)/100))) as precioDescuento 
      FROM servicio as s , (SELECT * FROM cita) as r  
      LEFT JOIN cupon_cliente as cc ON ( cc.idCuponCliente = r.idCuponCliente ) 
      LEFT JOIN cupon as c ON cc.idCupon = c.idCupon 
      WHERE s.idServicio = ? AND r.idCita = ?) 
      WHERE xx.idCita = ? `,[req.body.idServicio, req.body.idServicio, req.body.idCita,req.body.idCita])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/nuevoStaf', function(req, res) {

    db(`INSERT INTO empleado(nombre,descripcion,estado, idCentro) 
      VALUES(?, ?,?,?)`,[req.body.nombre,req.body.descripcion,req.body.estado, req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/contratarOferta', function(req, res) {

    db(`INSERT INTO control_oferta(estado, idCentro, fechaCaducidad, costo) 
      VALUES(0, ?,(DATE_ADD(NOW(), INTERVAL (SELECT valor FROM parametros WHERE idParametro = 3) DAY)), (SELECT valor FROM parametros WHERE idParametro = 4))`,[req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/contratarPaquete', function(req, res) {

    db(`INSERT INTO paquete_centro(estado, idCentro, fechaVencimiento, costo) 
      VALUES(0, ?,(DATE_ADD(NOW(), INTERVAL (SELECT valor FROM parametros WHERE idParametro = 5) DAY)), (SELECT valor FROM parametros WHERE idParametro = 6))`,[req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/addServicioCupon', function(req, res) {

    db(`INSERT INTO cupon_servicio(idCuponCentro,idServicio) 
      VALUES(?, ?)`,[req.body.idCuponCentro,req.body.idServicio])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });
        expressApp.post('/addCentroCupon', function(req, res) {

    db(`INSERT INTO cupon_centro(idCupon,idCentro) 
      VALUES(?, ?)`,[req.body.idCupon,req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/nuevoUsuarioC', function(req, res) {

    db(`INSERT INTO usuario_consola(email,nombre,tipo,estado,password, parentUser) 
      VALUES(?, ?,2,?,?,?)`,[req.body.email,req.body.nombre,req.body.estado,req.body.password,req.body.parentUser])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/nuevoUsuarioCAD', function(req, res) {

    db(`INSERT INTO usuario_consola(email,nombre,tipo,estado,password) 
      VALUES(?, ?,1,?,?)`,[req.body.email,req.body.nombre,req.body.estado,req.body.password])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });




    expressApp.post('/getServiciosCita', (req, res) => {
     Promise.all([db(`SELECT vv.precioEsperado, sc.idServicioCita, s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM cita as vv, servicio as s, categoria as c, servicio_cita as sc  
      WHERE s.idServicio = sc.idServicio 
      AND sc.idCita = ? AND c.idCategoria = s.idCategoria AND vv.idCita = ? AND s.estado = 1`,[req.body.idCita,req.body.idCita]),
     db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, s.estado, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado =  1`,[req.body.idCentro])])

      .then((data) => {

        if (!data) res.send().status(500);
    var groups = _.groupBy(data[1], 'nombreCategoria');
    

    let total = 0;
    data.forEach((elementw, index) => {
    total += elementw.precio;
    });



        return res.send({servicios:data[0], total:total, categorias:groups});
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/cargarNegocios', (req, res) => {
     db(`SELECT cc.*, c.nombre FROM usuario_consola_centro as cc, centro as c  
      WHERE cc.idUsuarioConsola = ? AND c.idCentro = cc.idCentro`,[req.body.idUsuarioConsola])

      .then((data) => {

        if (!data) res.send().status(500);
    //var groups = _.groupBy(data[0], 'nombreCategoria');


        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





    expressApp.post('/login', (req, res) => {

    db(`SELECT u.idUsuarioConsola, u.email, u.nombre, u.tipo FROM usuario_consola as u 
      WHERE u.email = ? AND u.password = ?`,[req.body.username,req.body.password]).then((data) => {
      console.log(data);
      if (data[0].idUsuarioConsola) {
        data.status=true;
        return res.send(data);
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });
    expressApp.post('/doLoginApi', (req, res) => {

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.email, 
      u.fbId, u.idFoto, u.estado, COUNT(c.idCita) as completadas FROM cliente as u LEFT JOIN cita as c ON c.idCliente = u.idCliente AND c.estado = 3 
      WHERE u.email = ? AND u.password = ? GROUP BY u.idCliente`,[req.body.username,req.body.password]).then((data) => {
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
      VALUES(?, ?, ?, ?, 2)`,[req.body.nombre,req.body.nombre2,req.body.telefono,req.body.email]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/addNegocioSA', (req, res) => {

    db(`INSERT INTO centro(nombre,nombreTitular,telefono,email, estado) 
      VALUES(?, ?, ?, ?, 1)`,[req.body.nombre,req.body.nombre2,req.body.telefono,req.body.email]).then((data) => {
      console.log(data);
      if (data.insertId>0) {

      db(`INSERT INTO usuario_consola_centro(idUsuarioConsola,idCentro) 
      VALUES(?, ?)`,[req.body.parentUser, data.insertId]).then((datad) => {
        if (!datad) {return res.send(err).status(500);}

        return res.send({ insertId: datad.insertId });

      });

       
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/editNegocio', (req, res) => {

    db(`UPDATE centro SET nombre=?, nombreTitular=?, telefono=?,
      email=?, estado=? WHERE idCentro = ?`,[req.body.nombre,req.body.nombreTitular,
      req.body.telefono,req.body.email, req.body.estado, req.body.idCentro]).then((data) => {
      console.log(data);

      if (data.affectedRows>0) {

     
        if(req.body.estado !== req.body.estadoAnterior){
        db(`INSERT INTO control_centro(idCentro,estadoAsignado) 
      VALUES(?, ?)`,[req.body.idCentro, req.body.estado]).then((datad) => {

        }).catch(err => res.send(err).status(500));
      }

         return res.send(data);

       
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

/*        expressApp.post('/editNegocio', (req, res) => {

    db(`UPDATE centro SET nombre=?, nombreTitular=?, telefono=?,
      email=?, estado=? WHERE idCentro = ?`,[req.body.nombre,req.body.nombreTitular,
      req.body.telefono,req.body.email, req.body.estado, req.body.idCentro]).then((data) => {
      console.log(data);
      if (data) {
       return res.send(data);
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });*/

                expressApp.post('/updateOpinionSA', (req, res) => {

    db(`UPDATE evaluacionCentro SET estado=? WHERE idEvaluacionCentro = ?`,[req.body.estado,req.body.idEvaluacionCentro]).then((data) => {
      console.log(data);
      if (data) {
       return res.send(data);
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/agregarNegocioUsuario', (req, res) => {

    db(`INSERT INTO usuario_consola_centro(idUsuarioConsola,idCentro) 
      VALUES(?, ?)`,[req.body.idUsuarioConsola,req.body.idCentro]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ insertId: data.insertId });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });
    expressApp.post('/eliminarNegocioUsuario', function(req, res) {
     db(`DELETE FROM usuario_consola_centro WHERE idUsuarioConsolaCentro = ?`,[req.body.idUsuarioConsolaCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/eliminarCuponCentro', function(req, res) {
     db(`DELETE FROM cupon_centro WHERE idCentro = ? AND idCupon=?`,[req.body.idCentro,req.body.idCupon])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/nuevoServicio', (req, res) => {

    db(`INSERT INTO servicio(nombre,duracion,precio,estado, descripcion,idCategoria, idSubcategoria, idCentro) 
      VALUES(?, ?, ?, ?, ?, ?, ?,?)`,[req.body.nombre,req.body.duracion,req.body.precio,req.body.estado,
      req.body.descripcion,req.body.idCategoria,req.body.idSubcategoria,req.body.idCentro]).then((data) => {
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

    db(`INSERT INTO cupon(nombre,codigo,porcentajeDescuento, fechaExpira,estado, tipo, tipoDescuento) 
      VALUES(?, ?, ?, ?, ?, ?,?)`,[req.body.nombre,req.body.codigo,req.body.porcentajeDescuento,
      req.body.fechaExpira,req.body.estado,req.body.tipo, req.body.tipoDescuento]).then((data) => {
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
