const express = require('express');
const bodyParser = require('body-parser');
const gcm = require('node-gcm');
const apn = require('apn');
//const mail = require("nodemailer").mail;
//const nodemailer = require("nodemailer");
//var nodemailer = require('nodemailer');
const nodemailer = require('nodemailer');


const path = require('path');
const multer  =   require('multer');


require('events').EventEmitter.defaultMaxListeners = 15;

var options = {
  token: {
    key: "../AuthKey_2GCKPR3W9T.p8",
    keyId: "2GCKPR3W9T",
    teamId: "USR86W3X3G"
  },
  production: false
};

const apnProvider = new apn.Provider(options);

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null,  file.fieldname + '-' + Date.now()+ path.extname(file.originalname));
  }
});


const storage2 = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    console.log(req);
    cb(null,  req.body.num + 'banner');
  }
});



/*
const transport = nodemailer.createTransport("SMTP", {
        service: 'Gmail',
        auth: {
            user: "test.nodemailer@gmail.com",
            pass: "Nodemailer123"
        }
    });

*/

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing

/*
nodemailer.createTestAccount((err, account) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: account.user, // generated ethereal user
            pass: account.pass // generated ethereal password
        }
    });
  });
*/
const upload = multer({storage: storage});
const upload2 = multer({storage: storage2});


const cors = require('cors');
const Bcrypt = require('bcrypt');
 var _ = require('underscore');

const db = require('./config/db');
var moment = require('moment');


moment.updateLocale('en', {
    relativeTime : {
        future: " %s",
        past:   "%s ",
        s  : 'hace segundos',
        ss : 'hace %d s',
        m:  "hace un minuto",
        mm: "hace %d m",
        h:  "hace una hora",
        hh: "hace %d h",
        d:  "hace un dia",
        dd: "hace %d d",
        M:  "hace un mes",
        MM: "hace %d m",
        y:  "a year",
        yy: "hace %d a"
    }
});



function makeid() {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function makeidEmail() {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRS";

  for (var i = 0; i < 7; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


var sender = new gcm.Sender('AIzaSyBH4d4XhTbiJDW2QYwkgABH6nmthapELd0');
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



    expressApp.post('/editarCF', upload.single('ionicfile'),(req, res) => {
      console.log(req.file);

    
     db(`UPDATE cliente set nombre=?,
      telefono=?,genero=?, idFoto=? 
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.genero,
     req.file.path,req.body.idCliente])
      .then((data) => {

        if (!data) res.send().status(500);

        return res.send({data:data,idFoto:req.file.path});


      }).catch(err => res.send(err).status(500));

      

  });




expressApp.get('/categoriasHome2', function(req, res) {
    db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1 `).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});

expressApp.get('/categoriasHome3', function(req, res) {
      Promise.all([db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1 `),
        db(`SELECT  d.* FROM subcategoria as d WHERE d.estado = 1 `)]).then((data) => {
      console.log(data);
      //res.json(data);
        var groups = _.groupBy(data[1], 'idCategoria');
      return res.send({categorias:data[0],subcategorias:groups});
    }).catch(err => res.send(err).status(500));
});




expressApp.get('/categoriasActivas', function(req, res) {
    db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1`).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});


expressApp.get('/horaMinMax', function(req, res) {
    db(`SELECT (SELECT horaAbrir FROM 
      horarioCentro WHERE estado=1 ORDER BY horaAbrir ASC LIMIT 1) as minHora, 
      (SELECT horaCerrar FROM 
      horarioCentro WHERE estado=1 ORDER BY horaCerrar DESC LIMIT 1) as maxHora`).then((data) => {
      if (!data) res.send().status(500);
      return res.send(data);
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

  expressApp.post('/recuperarPass', (req, res) => {


  var claveNeva = makeid();
  console.log(claveNeva);
 //var claveNeva = 'asdasd';
    var resultadoEmail=1;
    db(`UPDATE cliente set password=? WHERE email=?`,[claveNeva,req.body.email])
      .then((dataf) => {
        if (!dataf) {res.send().status(500)}
        else{

          nodemailer.createTestAccount((err, account) => {
            console.log(err);
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'beyourself_sender@outlook.com', // generated ethereal user
            pass: 'be123456789' // generated ethereal password
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'beyourself_sender@outlook.com', // sender address
        to: req.body.email+','+req.body.email, // list of receivers
        subject: 'Recuperacion de contraseña yourBeauty', // Subject line
        text: 'Hemos recuperado tu contraseña! Tu contraseña yourBeaty nueva es: '+claveNeva
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {

            if(error){
            console.log('Error occured');
            console.log(error.message);
            //return;
            resultadoEmail=0;
            }
            console.log(info);
           return res.send({data:dataf,email:resultadoEmail});


        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
          console.log(dataf);
        }
        //return res.send(data);
      }).catch(err => {
        console.log(err);
        res.send(err).status(500);
      });
  });



  expressApp.post('/buscarServiciosFiltro', (req, res) => {

var stringQuery = `SELECT c.*, MAX(s.precio) as pMax, MIN(s.precio) as pMin, 
COUNT(DISTINCT ec.puntuacion) as cantRate, 
(6371 * acos( cos( radians(`+(req.body.lat || 0)+`) ) * cos( radians( c.latitud ) ) 
         * cos( radians(c.longitud) - radians(`+(req.body.long || 0)+`)) + sin(radians(`+(req.body.lat || 0)+`)) 
         * sin( radians(c.latitud)))) AS distance,
AVG(ec.puntuacion) as rate
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.estado = 1 AND c.estado = 1 `;

     /*

         if(req.body.lat && req.body.long){

         stringQuery += ` AND ( 6371 * acos( cos( radians(`+req.body.lat+`) ) * cos( radians( c.latitud ) ) 
         * cos( radians(c.longitud) - radians(`+req.body.long+`)) + sin(radians(`+req.body.lat+`)) 
         * sin( radians(c.latitud)))) < 20 `;

      }
*/

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

      if(req.body.horaSeleccionadaDesde){

        if(req.body.filtroFecha){

          stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as mm 
          WHERE c.idCentro = mm.idCentro AND
           mm.horaAbrir<='`+req.body.horaSeleccionadaDesde+`' 
           AND mm.diaSemana=WEEKDAY('`+req.body.filtroFecha+`') AND mm.estado=1) > 0 AND

           (SELECT COUNT(*) FROM horario_especial as cc 
          WHERE c.idCentro = cc.idCentro 
          AND cc.fecha='`+req.body.filtroFecha+`' AND cc.abierto=0 AND cc.estado=1) <= 0 AND

           (SELECT COUNT(*) FROM horario_especial as csc 
          WHERE c.idCentro = csc.idCentro AND
           csc.horaAbrir>='`+req.body.horaSeleccionadaDesde+`' 
           AND csc.fecha='`+req.body.filtroFecha+`' AND csc.abierto=1 AND csc.estado=1) <= 0`; 

        }
        else{
          stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as mm 
          WHERE c.idCentro = mm.idCentro AND
           mm.horaAbrir<='`+req.body.horaSeleccionadaDesde+`' 
           AND mm.diaSemana=`+req.body.diaSemana+` AND mm.estado=1) > 0 `; 
        }  



      }


      if(req.body.horaSeleccionadaHasta){

        if(req.body.filtroFecha){

          stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as mm 
          WHERE c.idCentro = mm.idCentro AND
           mm.horaCerrar>='`+req.body.horaSeleccionadaHasta+`' 
           AND mm.diaSemana=WEEKDAY('`+req.body.filtroFecha+`') AND mm.estado=1) > 0 AND

           (SELECT COUNT(*) FROM horario_especial as cc 
          WHERE c.idCentro = cc.idCentro 
          AND cc.fecha='`+req.body.filtroFecha+`' AND cc.abierto=0 AND cc.estado=1) <= 0 AND

           (SELECT COUNT(*) FROM horario_especial as csc 
          WHERE c.idCentro = csc.idCentro AND
           csc.horaCerrar<='`+req.body.horaSeleccionadaHasta+`' 
           AND csc.fecha='`+req.body.filtroFecha+`' AND csc.abierto=1 AND csc.estado=1) <= 0`; 

        }
        else{
          stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as mm 
          WHERE c.idCentro = mm.idCentro AND
           mm.horaCerrar>='`+req.body.horaSeleccionadaHasta+`' 
           AND mm.diaSemana=`+req.body.diaSemana+` AND mm.estado=1) > 0 `; 
        }  



      }



      if(req.body.disponible){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro AND hh.diaSemana=`+req.body.diaSemana+`) > 0 `; 
      }



 stringQuery += ` GROUP BY c.idCentro HAVING distance < 25 `; 

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
    db(`SELECT c.nombre as nombreCentro, c.idFoto, r.idCita, r.idCentro, r.horaInicio, ee.nombre as nombreEmpleado,
      (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita) as cantServicios,
      (SELECT m.nombre FROM servicio as m WHERE m.idServicio IN 
      (SELECT idServicio FROM servicio_cita as ccc WHERE ccc.idCita = r.idCita ORDER BY ccc.idServicioCita ASC) LIMIT 1) as servicioMain,
      r.estado FROM centro as c, cita as r 
      LEFT JOIN empleado as ee ON ee.idEmpleado = r.idEmpleado 
      WHERE c.idCentro = r.idCentro AND r.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




    expressApp.post('/getHorasDispo', (req, res) => {


      var fecha = req.body.fechaSeleccionada;//2018-07-30
      var d = new Date(fecha);
      var diaSem = d.getDay();
      console.log(diaSem);
      var duracion = parseInt(req.body.duracion); //30
      var horarioDisponible=[];

var inicioCita = moment({year:fecha.split('-')[0],month:(parseInt(fecha.split('-')[1])-1),
day:fecha.split('-')[2], hours: req.body.horaAbrir.split(':')[0], 
minutes: req.body.horaAbrir.split(':')[1]});


var horaCerrar = moment({year:fecha.split('-')[0],month:(parseInt(fecha.split('-')[1])-1),
day:fecha.split('-')[2], hours: req.body.horaCerrar.split(':')[0], 
minutes: req.body.horaCerrar.split(':')[1]});

var finCita = moment({year:fecha.split('-')[0],month:(parseInt(fecha.split('-')[1])-1),
day:fecha.split('-')[2], hours: req.body.horaAbrir.split(':')[0], minutes: req.body.horaAbrir.split(':')[1]}).add(duracion,'m');

var funcionesBase = [];
var idCategoria = req.body.idCategoria;
var idCentro =   req.body.idCentro;

//console.log(time.format("HH:mm"));
//mientras que la hora de cerrar del centro sea mayor o igual que la hora final de la cita
while (moment(finCita).isSameOrBefore(horaCerrar)) {

   // text += "The number is " + i;
    //i++;
//8 830
funcionesBase.push(db(`SELECT ? as inicio, ? as fin, COUNT(DISTINCT e.idEmpleado) as disponibles FROM horarioEmpleado as he, empleado as e 

        LEFT JOIN cita as c ON (c.idEmpleado = e.idEmpleado AND c.estado IN (1,2,5) 
        AND ((?  BETWEEN c.horaInicio  AND c.horaFinalEsperado)  
        OR  (? BETWEEN c.horaInicio  AND c.horaFinalEsperado)))

    LEFT JOIN reservaManual as rm ON (rm.idEmpleado = e.idEmpleado  AND ((?  BETWEEN rm.horaInicio  AND rm.horaFinalEsperado)  
        OR  (? BETWEEN rm.horaInicio  AND rm.horaFinalEsperado)) )

        WHERE e.idEmpleado IN (SELECT ec.idEmpleado FROM empleado_categoria as ec 
        WHERE ec.idCategoria = ? AND ec.estado = 1) AND e.idCentro = ? 
        AND (he.idEmpleado = e.idEmpleado AND he.diaSemana = ? AND he.estado = 1 AND he.horaEntrar < ? AND he.horaSalir > ?)
        AND c.idCita IS NULL
        AND rm.idReservaManual IS NULL`,[inicioCita.format("YYYY-MM-DD HH:mm:ss"), 
        finCita.format("YYYY-MM-DD HH:mm:ss"),inicioCita.format("YYYY-MM-DD HH:mm:ss"), 
        finCita.format("YYYY-MM-DD HH:mm:ss"), inicioCita.format("YYYY-MM-DD HH:mm:ss"), 
        finCita.format("YYYY-MM-DD HH:mm:ss"),idCategoria,idCentro, 
        diaSem, inicioCita.format("HH:mm:ss"), finCita.format("HH:mm:ss")]));
  
    inicioCita = moment(finCita);
  console.log(inicioCita);
    finCita.add(duracion,'m');
    
}

  Promise.all(funcionesBase).then((data) => {

    if (!data) res.send().status(500);

        var disponibleTodas=1;
         var horariosDisponibles=0;
        data.forEach((item, index) => {

            if(item[0].disponibles<1){
              disponibleTodas=0;
            }
            if(item[0].disponibles>1){
              horariosDisponibles=1;
            }

        });
/*

    data[0].forEach((item, index) => {

      })
        if (!data) res.send().status(500);

        var verif = 0;
        console.log(data[0].length);
         console.log(data[1].length);
        if(data[0].length>0 || data[1].length>0){
          verif = 1;
        }
*/
        return res.send({disponible:disponibleTodas, horasDispo:data,horariosDispo:horariosDisponibles});
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/categoriaEmpleados', (req, res) => {
    db(`SELECT c.*, 
      (SELECT ec.estado 
      FROM empleado_categoria as ec 
      WHERE ec.idCategoria = c.idCategoria 
      AND ec.idEmpleado = ? AND ec.estado = 1) as checked 
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

 expressApp.post('/citasUserFiltroSA', (req, res) => {
    db("SELECT  df.nombre as nombreCentro, df.idFoto, r.precioEsperado, em.nombre as nombreEmpleado, r.idCita, r.idCentro, CONCAT(DATE_FORMAT(r.`horaInicio`, '%d/%m/%y %H:%i'), ' - ', DATE_FORMAT(r.`horaFinalEsperado`, '%H:%i')) as FechaCita, r.comentarioCita,r.comentarioEstado, r.notaCita, r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita AND sc.estado = 0) as totalServicios, (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  FROM centro as df, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado WHERE df.idCentro = r.idCentro AND r.idCliente  = ? AND DATE(r.horaInicio) BETWEEN ? AND ? ",[req.body.idCliente,req.body.fecha, req.body.fechaF])
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
      WHERE c.idCliente = r.idCliente AND r.idCentro = ? AND DATE(r.horaInicio) BETWEEN ?  
      AND ?`,[req.body.idCentro, req.body.fecha, req.body.fechaF])
      .then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data, 'estado');
            return res.send(groups);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/citasCentroFiltroSA', (req, res) => {
      db("SELECT  sx.nombre as nombreCliente, df.nombre as nombreCentro,df.idFoto, r.precioEsperado, r.comision, em.nombre as nombreEmpleado, r.idCita, r.idCentro, CONCAT(DATE_FORMAT(r.`horaInicio`, '%d/%m/%y %H:%i'), ' - ', DATE_FORMAT(r.`horaFinalEsperado`, '%H:%i')) as FechaCita, r.comentarioCita,r.horaInicio,r.comentarioEstado, r.notaCita, r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita AND sc.estado = 0) as totalServicios, (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  FROM cliente as sx, centro as df, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado WHERE df.idCentro = r.idCentro AND r.idCentro IN (SELECT g.idCentro FROM usuario_consola_centro as g WHERE g.idUsuarioConsola = ? AND sx.idCliente = r.idCliente) AND DATE(r.horaInicio) BETWEEN ? AND ?",[req.body.idUsuarioConsola, req.body.fecha, req.body.fechaF])
      .then((data) => {
        if (!data) res.send().status(500);

        var groups = _.groupBy(data, 'estado');
        var datav= {info:groups};


        return res.send(datav);
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
     Promise.all([db(`SELECT c.nombre as nombreCliente, c.telefono, em.nombre as nombreEmpleado, em.idEmpleado as idEmpleado, 
c.email, r.idCita, r.idCentro, r.horaFinalReal, r.comentarioCita, r.notaCita, r.horaInicio,
      r.horaFinalEsperado,r.estado, (SELECT GROUP_CONCAT(x.nombre) FROM servicio as x, servicio_cita as sc
WHERE x.idServicio = sc.idServicio AND sc.idCita = r.idCita
) as servicios FROM cliente as c, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
      WHERE c.idCliente = r.idCliente AND 
      (r.estado = 1 OR r.estado = 2) AND r.idCentro = ?`,[req.body.idCentro]),
     db(`SELECT  rm.*, e.nombre FROM reservaManual as rm, 
      empleado as e WHERE rm.idCentro = ? AND rm.estado = 1 
      AND rm.horaInicio >= DATE(NOW()) 
      AND e.idEmpleado = rm.idEmpleado`,[req.body.idCentro])])
      .then((data) => {
  //console.log('---s---');
       // console.log(req.body.idCentro);
        if (!data) res.send().status(500);


         let appointments = new Array();

              data[0].forEach((item, index) => {
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


      data[1].forEach((item, index) => {

        moment.locale('es');
        let manual = {
        id: 'manual'+index,
        description: '',
        location: "",
        detalle: (item['detalle'] + '(Reserva Manual)'),
        subject: 'Reserva Manual',
        calendar: item['nombre'],
        start: moment.utc(item['horaInicio']).format("YYYY-MM-DD HH:mm:ss"),
        end: moment.utc(item['horaFinalEsperado']).format("YYYY-MM-DD HH:mm:ss")

        };

        appointments.push(manual);
        
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

        data[index].detalle = item['nombreCliente']+' / '+moment.utc(item['horaInicio']).format("hh:mm a")+
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


    expressApp.post('/agregarBloque', (req, res) => {
    db(`INSERT INTO reservaManual(idEmpleado,idCentro,horaInicio, 
      horaFinalEsperado, detalle) 
      VALUES (?,?,?,?,?)`,[req.body.idEmpleado,req.body.idCentro,req.body.horaInicio,req.body.horaFinalEsperado,req.body.detalle])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getBloques', (req, res) => {
    db(`SELECT  rm.*, e.nombre FROM reservaManual as rm, 
      empleado as e WHERE rm.idCentro = ? AND rm.estado = 1 
      AND rm.horaInicio >= DATE(NOW()) 
      AND e.idEmpleado = rm.idEmpleado`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getEmpleadosDisponibles', (req, res) => {
    db(`SELECT e.nombre, e.descripcion, e.idFoto,e.idEmpleado FROM empleado as e 
  
  LEFT JOIN reservaManual as rm ON (rm.estado = 1 AND rm.idEmpleado = e.idEmpleado AND 
        ((? BETWEEN rm.horaInicio AND rm.horaFinalEsperado ) OR  (? BETWEEN rm.horaInicio AND rm.horaFinalEsperado) OR (? < rm.horaInicio AND rm.horaFinalEsperado < ?)))
        
    LEFT JOIN cita as r ON (r.idEmpleado = e.idEmpleado AND r.estado IN (1,2,5) AND 
    ((? BETWEEN r.horaInicio AND r.horaFinalEsperado ) OR  (? BETWEEN r.horaInicio AND r.horaFinalEsperado) OR (? < r.horaInicio AND r.horaFinalEsperado < ?)))
    
    LEFT JOIN horarioEmpleado as he ON (he.idEmpleado = e.idEmpleado AND he.diaSemana = ? AND (he.estado = 0 OR (he.estado = 1 AND ? < he.horaEntrar  OR ? > he.horaSalir)))
    
  WHERE  e.idCentro = ? AND e.estado = 1 AND ? IN (SELECT ec.idCategoria FROM empleado_categoria as ec WHERE ec.idEmpleado = e.idEmpleado AND ec.estado = 1) 
  AND rm.idReservaManual IS NULL 
  AND r.idCita IS NULL 
  AND he.idEmpleado IS NULL`,[req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,
  req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.diaN,
  req.body.soloHI,req.body.soloHF,req.body.idCentro,req.body.idCategoria])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/agregarPaqueteSA', (req, res) => {

    var insertQ = ''; 

    req.body.servicios.forEach((item, index)=>{

      if(index==0){

          insertQ += ' ('+req.body.idPaqueteCentro+','+item.idServicio+')';

       }
       else{

          insertQ += ',('+req.body.idPaqueteCentro+','+item.idServicio+')';

       }

    

    });


    Promise.all([db(`UPDATE paquete_centro set estado = 1,
      nombre=?, tiempo=?, precioTotal = ? 
      WHERE idPaqueteCentro = ?`,[req.body.nombre,req.body.duracion,
      req.body.precio,req.body.idPaqueteCentro]),
    db(`INSERT INTO paquete_servicio(idPaqueteCentro,idServicio) VALUES `+insertQ+` `)])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data[0]);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/verificarDispoStaff', (req, res) => {
      Promise.all([db(`SELECT rm.* FROM reservaManual as rm 
      WHERE rm.estado = 1 AND 
      rm.idEmpleado = ? AND 
      ((rm.horaInicio BETWEEN ? AND ?) 
      OR  (rm.horaFinalEsperado  BETWEEN ? AND ?))`,[req.body.idEmpleado, req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF]),
      db(`SELECT r.idCita FROM  cita as r 
        WHERE (r.idEmpleado = ? AND r.estado IN (1,2,5) 
        AND ((r.horaInicio BETWEEN ? 
        AND ?) 
        OR  (r.horaFinalEsperado BETWEEN ? 
        AND ?)))`,[req.body.idEmpleado, req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF])])
      .then((data) => {

        if (!data) res.send().status(500);

        var verif = 0;
        console.log(data[0].length);
         console.log(data[1].length);
        if(data[0].length>0 || data[1].length>0){
          verif = 1;
        }

        return res.send({disponible:verif});
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

  expressApp.post('/actualizarDataSA', (req, res) => {
    db(`UPDATE usuario_consola set password = ? WHERE idUsuarioConsola = 11 AND password = ?`,[req.body.nueva2,req.body.actual])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  


  expressApp.post('/updateSeccionSA', (req, res) => {
    db(`INSERT INTO usuario_seccion(idUsuarioConsola,idSeccion,estado) VALUES (?,?,?)
  ON DUPLICATE KEY UPDATE estado= ?`,[req.body.idUsuarioConsola,req.body.idSeccion, req.body.estado,req.body.estado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/responderOpinion', (req, res) => {
    db(`UPDATE evaluacionCentro set respuestaCentro = ? 
      WHERE idEvaluacionCentro = ?`,[req.body.respuestaCentro,req.body.idEvaluacionCentro])
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

  expressApp.post('/actualizarHorarioEmpleado', (req, res) => {
    db(`INSERT INTO horarioEmpleado(idEmpleado,diaSemana,horaEntrar,horaSalir,estado) VALUES (?,?,?,?,?)
  ON DUPLICATE KEY UPDATE diaSemana=?,horaEntrar=?,horaSalir=?,estado=?`,[req.body.idEmpleado,
  req.body.diaSemana,req.body.horaEntrar,req.body.horaSalir,req.body.estado,req.body.diaSemana,
  req.body.horaEntrar,req.body.horaSalir,req.body.estado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  



  expressApp.post('/actualizarFechaEspecial', (req, res) => {
    db(`UPDATE horario_especial set horaAbrir=?,horaCerrar=?,abierto=? 
      WHERE idHorarioEspecial=?`,[req.body.horaAbrir,req.body.horaCerrar,req.body.abierto,req.body.idHorarioEspecial])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/nuevaFechaEspecial', (req, res) => {
    db(`INSERT INTO horario_especial(idCentro,fecha,horaAbrir,horaCerrar,abierto) VALUES (?,?,?,?,?)
  ON DUPLICATE KEY UPDATE horaAbrir=?,horaCerrar=?,abierto=?`,[req.body.idCentro,
  req.body.fecha,req.body.horaAbrir,req.body.horaCerrar,req.body.abierto,
  req.body.horaAbrir,req.body.horaCerrar,req.body.abierto])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/borrarFechaEspecial', function(req, res) {
     db(`DELETE FROM horario_especial WHERE idHorarioEspecial = ?`,[req.body.idHorarioEspecial])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/borrarRmanual', function(req, res) {
     db(`DELETE FROM reservaManual WHERE idReservaManual = ?`,[req.body.idReservaManual])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/eliminarServicio', function(req, res) {
     db(`DELETE FROM servicio WHERE idServicio = ?`,[req.body.idServicio])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });
        expressApp.post('/eliminarEmpleado', function(req, res) {
     db(`DELETE FROM empleado WHERE idEmpleado = ?`,[req.body.idEmpleado])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/eliminarUC', function(req, res) {
     db(`DELETE FROM usuario_consola WHERE idUsuarioConsola = ?`,[req.body.idUsuarioConsola])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


   
        expressApp.post('/eliminarCentro', function(req, res) {
     db(`DELETE FROM centro WHERE idCentro = ?`,[req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  }); 


        expressApp.post('/eliminarCupon', function(req, res) {
     db(`DELETE FROM cupon WHERE idCupon = ?`,[req.body.idCupon])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  }); 

        expressApp.post('/eliminarCategoria', function(req, res) {
     db(`DELETE FROM categoria WHERE idCategoria = ?`,[req.body.idCategoria])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  }); 

                expressApp.post('/eliminarSubCategoria', function(req, res) {
     db(`DELETE FROM subcategoria WHERE idSubcategoria = ?`,[req.body.idSubcategoria])
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

      if(req.body.fechaNacimiento){
        req.body.fechaNacimiento = req.body.fechaNacimiento.split('T')[0];
      }
    db(`UPDATE cliente set nombre=?,telefono=?,genero=?, fechaNacimiento = ? 
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.genero,req.body.fechaNacimiento,
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








    expressApp.post('/subirImagen2', upload2.single('image'),(req, res) => {
      console.log(req.file);
    return res.send(req.file);
/*    db(`UPDATE cliente set nombre=?,telefono=?,genero=?
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.genero,
     req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));*/


  });



    expressApp.post('/actualizarBannerNC', upload.single('imageU'),(req, res) => {
    db(`UPDATE centro set imagenBanner = ? WHERE idCentro = ?`,[req.file.path,req.body.idCentro])
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
     Promise.all([db(`UPDATE cita set horaInicio=?, horaFinalEsperado=?,comentarioEstado=?, estado=5  WHERE idCita = ?`,[req.body.fechaCompleta,
      req.body.horaFinalEsperado,req.body.comentarioEstado,req.body.idCita]),
       db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'Android'`,[req.body.idCita]),
     db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'iOS'`,[req.body.idCita])])
      .then((data) => {
        if (!data) res.send().status(500);

                            if(data[2]){

              var note = new apn.Notification();

              note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    
              note.sound = "ping.aiff";
              note.alert = "El centro ha solicitado la reprogramacion del a cita.";
              note.payload = {'tipoNoti': 3,"idCita":req.body.idCita};
              note.topic = "com.ionicframework.beyou";

                 var regTokens = [];

              data[2].forEach((elementwa, index) => {

                  apnProvider.send(note, elementwa.pushKey).then( (result) => {
                  console.log(result);
                  });

              });


            }

            if(data[1]){


            var message = new gcm.Message({
          "data":{
                       "title": "Reprogramada",
                       "icon": "ic_launcher",
                       "body": "El centro ha solicitado la reprogramacion de la cita.",
                       "tipoNoti": "1", "idCita":req.body.idCita}
                     });





              // Specify which registration IDs to deliver the message to
              var regTokens = [];

              data[1].forEach((elementw, index) => {
              regTokens.push(elementw.pushKey);
              });



              //var regTokens = ['dY98OGfoOJE:APA91bFVAw74t-YO0Oh5DXYFOZbgLzhglyMMhSLsEb2jFpnqn44N6e-mt90V6NbMQ9TkYRUfN3kZw2G7D9Xuv1BKReiJ7khrt2zloVkTx3acZ6tcLevhlg3mb70YDocE0LGaeft7APh7yZYgTgAMErouTV5p3m9H0A'];

              // Actually send the message
              sender.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) console.error(err);
              else console.log(response);
              });

            }




        return res.send(data[0]);
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
    db(`UPDATE usuario_consola set nombre=?,email=?,password=?,estado=?,ruc=?,
      inicioContrato=?,finContrato=?, tipoContrato=?, observaciones=? 
      WHERE idUsuarioConsola = ?`,[req.body.nombre,req.body.email,
      req.body.password,req.body.estado,
      req.body.ruc,req.body.inicioContratoF,req.body.finContratoF,req.body.tipoContrato,req.body.observaciones,req.body.idUsuarioConsola])
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


    expressApp.post('/nuevaEmpleadoImagen', upload.single('imageU2'),(req, res) => {
      console.log(req.file);
    db(`INSERT INTO empleado(nombre,estado,descripcion,idCentro,idFoto) 
      VALUES(?,?,?,?,?)`,[req.body.nombre,
      req.body.estado,req.body.descripcion,req.body.idCentro,req.file.path])
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
      direccion=?,telefono=?, tipoReserva=? WHERE idCentro = ?`;

    db(stringQuery,[retornoVar(req.body.nombre),retornoVar(req.body.email),
      retornoVar(req.body.fbLink),retornoVar(req.body.latitud),retornoVar(req.body.longitud),retornoVar(req.body.horarioAppBanner),
        retornoVar(req.body.sobreNosotros),
      retornoVar(req.body.direccion),retornoVar(req.body.telefono),
      (req.body.tipoReserva || 1),retornoVar(req.body.idCentro)])
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
    db(`UPDATE cupon set nombre=?,codigo=?,porcentajeDescuento=?,fechaExpira=?,estado=?, premio=?,tipo=?, tipoDescuento=? 
     WHERE idCupon = ?`,[req.body.nombre,req.body.codigo,
      req.body.porcentajeDescuento,req.body.fechaExpira,req.body.estado,req.body.premio,req.body.tipo, req.body.tipoDescuento,req.body.idCupon])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/confirmarCita', (req, res) => {
     Promise.all([db(`UPDATE cita set  estado=2 WHERE idCita = ?`,[req.body.idCita]),
      db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'Android'`,[req.body.idCita]),
     db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'iOS'`,[req.body.idCita])])
      .then((data) => {
        if (!data) res.send().status(500);


                    if(data[2]){

              var note = new apn.Notification();

              note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    
              note.sound = "ping.aiff";
              note.alert = "Felicidades! Tu cita ha sido confirmada";
              note.payload = {'tipoNoti': 1,"idCita":req.body.idCita};
              note.topic = "com.ionicframework.beyou";

                 var regTokens = [];

              data[2].forEach((elementwa, index) => {

                  apnProvider.send(note, elementwa.pushKey).then( (result) => {
                  console.log(result);
                  });

              });


            }

            if(data[1]){
              var message = new gcm.Message({
              data: { tipoNoti: 1 },
              notification: {
              title: "Cita confirmada",
              icon: "ic_launcher",
              body: "Felicidades! Tu cita ha sido confirmada"
              }
              });

              var message = new gcm.Message({
                          "data":{
                                       "title": "Cita confirmada",
                                       "icon": "ic_launcher",
                                       "body": "Felicidades! Tu cita ha sido confirmada",
                                       "tipoNoti": "1", "idCita":req.body.idCita}
                                     });



              // Specify which registration IDs to deliver the message to
              var regTokens = [];

              data[1].forEach((elementw, index) => {
              regTokens.push(elementw.pushKey);
              });



              //var regTokens = ['dY98OGfoOJE:APA91bFVAw74t-YO0Oh5DXYFOZbgLzhglyMMhSLsEb2jFpnqn44N6e-mt90V6NbMQ9TkYRUfN3kZw2G7D9Xuv1BKReiJ7khrt2zloVkTx3acZ6tcLevhlg3mb70YDocE0LGaeft7APh7yZYgTgAMErouTV5p3m9H0A'];

              // Actually send the message
              sender.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) console.error(err);
              else console.log(response);
              });

            }


        return res.send(data[0]);
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
    db(`UPDATE cita set  estado=3,
      exp=(precioEsperado*(SELECT valor FROM parametros WHERE idParametro=2)),
      comision=(precioEsperado*((SELECT valor FROM parametros WHERE idParametro=1)/100)) WHERE idCita = ?`,[req.body.idCita]), 
    db(`INSERT INTO evaluacionCentro (idCentro,idCita) 
      VALUES((SELECT x.idCentro FROM cita as x WHERE x.idCita = ?), ?)`,[req.body.idCita,req.body.idCita]),
    db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'Android'`,[req.body.idCita]),
     db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'iOS'`,[req.body.idCita]),
      db(`SELECT (SELECT valor FROM parametros WHERE idParametro = 7) as max,
(SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = (SELECT gm.idCliente FROM cita as gm WHERE gm.idCita = ? LIMIT 1) AND f.estado = 3) as expCliente,
(SELECT dx.exp FROM cita as dx WHERE dx.idCita = ?) as expCita`,[req.body.idCita,req.body.idCita]),

       db(`INSERT IGNORE INTO cupon_cliente(idCliente, idCupon,estado,regalo, fechaActivacion)
select (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?),
 (SELECT idc.idCupon FROM cupon as idc WHERE idc.estado = 1 
 AND idc.premio = 1 ORDER BY RAND() LIMIT 1), 
 1,1, CURRENT_TIMESTAMP cupon_cliente
where  exists (SELECT SUM(f.exp) as sss FROM
 cita as f 
 WHERE f.idCliente = 
 (SELECT gm.idCliente FROM cita as gm 
 WHERE gm.idCita = ? LIMIT 1) AND f.estado = 3 AND f.idCita != ? 
 HAVING (sss+(SELECT exp FROM cita WHERE idCita = ?))>(SELECT valor FROM parametros WHERE idParametro = 7))`,
 [req.body.idCita,req.body.idCita,req.body.idCita,req.body.idCita])])
      .then((data) => {

        if (!data) res.send().status(500);

           var pg = data[4][0].expCita;
               var te = data[4][0].max;
                var pa = parseInt(data[4][0].expCliente) - parseInt(data[4][0].expCita);
                var idCC = 0;

                if(data[5].insertId > 0){
                   idCC = data[5].insertId;
                }
            if(data[3]){

           
              var note = new apn.Notification();

              note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    
              note.sound = "ping.aiff";
              note.alert = "Felicidades! Tu cita ha sido completada. Valora al negocio";
              note.payload = {'tipoNoti': 2, 'puntosGanados':pg,'totalExc':te,'puntosActual':pa,'idCC':idCC};
              note.topic = "com.ionicframework.beyou";

/*
data.additionalData.puntosGanados,
                                data.additionalData.totalExc,
                                data.additionalData.puntosActual
                                */
                 var regTokens = [];

              data[3].forEach((elementwa, index) => {

                  apnProvider.send(note, elementwa.pushKey).then( (result) => {
                  console.log(result);
                  });

              });


            }

            if(data[2]){

                   /*  
              var message = new gcm.Message({
              "data": {"tipoNoti": "2","puntosGanados":pg,
              "totalExc":te,"puntosActual":pa },
              "notification": {
              "title": "Cita Finalizada",
              "icon": "ic_launcher",
              "body": "Felicidades! Tu cita ha sido completada. Valora al negocio"
              }
              });
              */
                         var message = new gcm.Message({
                          "data":{
                                       "title": "Cita Finalizada",
                                       "icon": "ic_launcher",
                                       "body": "Felicidades! Tu cita ha sido completada. Valora al negocio",
                                       "tipoNoti": "2","puntosGanados":pg,
                                       "totalExc":te,"puntosActual":pa,'idCC':idCC
                                       
                                       }});

              // Specify which registration IDs to deliver the message to
              var regTokens = [];

              data[2].forEach((elementw, index) => {
              regTokens.push(elementw.pushKey);
              });



              //var regTokens = ['dY98OGfoOJE:APA91bFVAw74t-YO0Oh5DXYFOZbgLzhglyMMhSLsEb2jFpnqn44N6e-mt90V6NbMQ9TkYRUfN3kZw2G7D9Xuv1BKReiJ7khrt2zloVkTx3acZ6tcLevhlg3mb70YDocE0LGaeft7APh7yZYgTgAMErouTV5p3m9H0A'];

              // Actually send the message
              sender.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) console.error(err);
              else console.log(response);
              });

            }

           return res.send(data[0]);


      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getVentas', (req, res) => {

    db(`SELECT c.nombre, c.idCentro, c.estado, SUM(f.comision) as comision, 
      SUM(f.precioEsperado) as sumCitas,COUNT(f.idCita) as cantCitas,
      (SELECT k.nombre FROM usuario_consola as k, usuario_consola_centro as kk 
      WHERE k.tipo = 1 AND kk.idCentro = c.idCentro 
      AND k.idUsuarioConsola = kk.idUsuarioConsola LIMIT 1) as nombreCentro,
(SELECT SUM(co.costo) FROM control_oferta AS co WHERE co.idCentro = c.idCentro  
      AND co.fechaCreacion between ? AND ?) as costoOferta, (SELECT COUNT(co.costo) FROM control_oferta AS co WHERE co.idCentro = c.idCentro  
      AND co.fechaCreacion between ? AND ?) as cantOferta, (SELECT SUM(co.costo) FROM paquete_centro AS co WHERE co.idCentro = c.idCentro  
      AND co.fechaCreacion between ? AND ?) as costoPaquete, (SELECT COUNT(co.costo) FROM paquete_centro AS co WHERE co.idCentro = c.idCentro  
      AND co.fechaCreacion between ? AND ?) as cantPaquete FROM centro as c LEFT JOIN cita as f ON c.idCentro = f.idCentro 
      AND f.horaFinalEsperado between ? AND ? AND f.estado = 3 GROUP BY c.idCentro`,[req.body.fecha1, req.body.fecha2,req.body.fecha1, req.body.fecha2,req.body.fecha1, req.body.fecha2,req.body.fecha1, req.body.fecha2,req.body.fecha1, req.body.fecha2])
      .then((data) => {

        if (!data) res.send().status(500);

           return res.send(data);


      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getCentrosUsuario', (req, res) => {
    db(`SELECT a.idCentro, c.nombre FROM usuario_consola_centro as a, centro as c WHERE c.estado = 1 AND c.idCentro = a.idCentro
       AND a.idUsuarioConsola = ?`,[req.body.idUsuario])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/getSeccionesUsuario', (req, res) => {
    db(`SELECT GROUP_CONCAT(DISTINCT(ec.idSeccion)) as secciones FROM 
  usuario_seccion as ec WHERE  ec.idUsuarioConsola = ? AND ec.estado=1 GROUP BY
  ec.idUsuarioConsola`,[req.body.idUsuarioConsola])
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
       FROM paquete_centro AS b WHERE b.idCentro = ?  AND b.fechaVencimiento > CURRENT_TIMESTAMP`,[req.body.idCentro]),
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
    (SELECT COUNT(f.idCita) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado = 3) as completadas,
    (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado = 3) as exp,
    (SELECT valor FROM parametros WHERE idParametro = 7) as appexp
     FROM cliente as c`,[req.body.idUsuario])
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
(SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 2 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola))*(SELECT valor/100 FROM parametros WHERE idParametro = 1) as comision,
(SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 3 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as completos
 FROM usuario_consola as uc WHERE uc.tipo = 1`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/cargaUsuariosConsolaSA2', (req, res) => {
    db(`SELECT uc.*, 
(SELECT COUNT(xs.idUsuarioConsolaCentro) FROM usuario_consola_centro as xs WHERE xs.idUsuarioConsola = uc.idUsuarioConsola AND xs.idCentro IN (SELECT gs.idCentro FROM centro as gs)) as sucursales,
(SELECT COUNT(r.idCita) FROM cita as r WHERE  r.estado = 4 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as canceladas,
(SELECT SUM(r.precioEsperado)ƒ FROM cita as r WHERE  r.estado = 4 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as comisionCanceladas,
(SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE  r.estado = 1 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as comisionPorConfirmar,
(SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE  r.estado = 5 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as comisionEConfirmar,
(SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE  r.estado = 2 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as comisionConfirmadas,
(SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE  r.estado = 3 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as comisionCompletadas,

(SELECT COUNT(r.idCita) FROM cita as r WHERE  r.estado = 1 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as porconfirmar,
(SELECT COUNT(r.idCita) FROM cita as r WHERE  r.estado = 5 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as econfirmar,
(SELECT COUNT(r.idCita) FROM cita as r WHERE  r.estado = 2 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as confirmadas,
(SELECT COUNT(r.idCita) FROM cita as r WHERE  r.estado = 3 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola)) as completadas,
(SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 2 AND r.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = uc.idUsuarioConsola))*(SELECT valor/100 FROM parametros WHERE idParametro = 1) as comision
 FROM usuario_consola as uc WHERE uc.tipo = 1`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/cargaCentrosUserSA', (req, res) => {
     Promise.all([db(` SELECT c.*,
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

        expressApp.post('/cargaCentrosUserSA2', (req, res) => {
     Promise.all([db(` SELECT c.*,
       (SELECT SUM(r.comision) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro) as comision,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro) as canceladas,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro) as comisionCanceladas,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 1 AND r.idCentro = c.idCentro) as porconfirmar,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 1 AND r.idCentro = c.idCentro) as comisionPorConfirmar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro) as econfirmar,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro) as comisionEConfirmar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro) as confirmadas,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro) as comisionConfirmadas,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro) as completadas,
   (SELECT ROUND(AVG(ecc.puntuacion), 2) FROM evaluacionCentro as ecc WHERE ecc.idCentro = c.idCentro AND ecc.estado = 2 ) as calificacion,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro) as comisionCompletadas 
  FROM centro as c WHERE c.idCentro IN (SELECT f.idCentro FROM usuario_consola_centro as f WHERE f.idUsuarioConsola = ?)`,[req.body.idUsuarioConsola]),
     db("SELECT  sx.nombre as nombreCliente, df.nombre as nombreCentro,df.idFoto, r.precioEsperado, r.comision, em.nombre as nombreEmpleado, r.idCita, r.idCentro, CONCAT(DATE_FORMAT(r.`horaInicio`, '%d/%m/%y %H:%i'), ' - ', DATE_FORMAT(r.`horaFinalEsperado`, '%H:%i')) as FechaCita, r.comentarioCita,r.horaInicio,r.comentarioEstado, r.notaCita, r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita AND sc.estado = 0) as totalServicios, (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  FROM cliente as sx, centro as df, cita as r LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado WHERE df.idCentro = r.idCentro AND r.idCentro IN (SELECT g.idCentro FROM usuario_consola_centro as g WHERE g.idUsuarioConsola = ? AND sx.idCliente = r.idCliente)",[req.body.idUsuarioConsola]),
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

  expressApp.post('/buscarServiciosGPS2', (req, res) => {
     Promise.all([db(`SELECT c.*, 
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, 
      ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.idSubcategoria IN (`+req.body.idSubcategoria+`)  
      AND s.estado = 1   
      GROUP BY c.idCentro HAVING distance < 25 ORDER BY -distance DESC LIMIT ?,10`,[req.body.lat, req.body.lon, req.body.lat, req.body.pagina]),
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
      AND s.idSubcategoria IN (`+req.body.idSubcategoria+`)  
      AND c.idCentro IN (SELECT bb.idCentro FROM usuario_favorito as bb WHERE bb.idCliente = ? 
      AND estado = 1)  
      AND s.estado = 1   
      GROUP BY c.idCentro ORDER BY -distance DESC`,[req.body.lat, req.body.lon, req.body.lat,req.body.idCliente])])
      .then((data) => {
        if (!data) res.send().status(500);

        return res.send({cercania:data[0], favoritos:data[1]});


      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCentrosMapa', (req, res) => {
    db(`SELECT c.nombre, c.idFoto, c.latitud, c.longitud, c.idCentro, 
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin, 
       (SELECT  GROUP_CONCAT(DISTINCT xs.idCategoria SEPARATOR ',') FROM
      servicio as xs WHERE xs.idCentro = s.idCentro ) as categoriasCentro,
            (SELECT  GROUP_CONCAT(DISTINCT xss.idsubcategoria SEPARATOR ',') FROM
      servicio as xss WHERE xss.idCentro = s.idCentro ) as subcategoriasCentro,
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, 
      ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.estado = 1 AND c.latitud IS NOT NULL AND c.longitud IS NOT NULL 
      GROUP BY c.idCentro ORDER BY distance DESC LIMIT 10`,[req.body.lat, req.body.lon, req.body.lat])
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




  expressApp.post('/favoritosGPS2', (req, res) => {
    db(`      SELECT c.*, 
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin, 
      (SELECT  GROUP_CONCAT(DISTINCT xs.idCategoria SEPARATOR ',') FROM
      servicio as xs WHERE xs.idCentro = s.idCentro ) as categoriasCentro,
            (SELECT  GROUP_CONCAT(DISTINCT xss.idsubcategoria SEPARATOR ',') FROM
      servicio as xss WHERE xss.idCentro = s.idCentro ) as subcategoriasCentro,
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




  expressApp.post('/paquetesActivos', (req, res) => {
    db(`SELECT ps.idPaqueteServicio, ca.idFoto as imagenCategoria,pc.idPaqueteCentro, pc.nombre as nombrePaquete, pc.tiempo as duracionPaquete, 
      pc.precioTotal as precioPaquete, 
      (SELECT  AVG(esc.puntuacion) FROM evaluacionCentro as esc WHERE esc.idCentro = c.idCentro AND esc.estado = 2 ) as rate,
      (SELECT (6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
      * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
      * sin( radians(c.latitud))))) AS distance,
    c.idCentro, c.nombre as nombreCentro, c.idFoto, s.nombre as nombreServicio, s.idServicio, s.idCategoria, s.idSubcategoria, s.precio as precioServicio   
    FROM paquete_servicio as ps, paquete_centro as pc, centro as c, servicio as s LEFT JOIN categoria as ca ON ca.idCategoria = s.idCategoria    
    WHERE pc.idPaqueteCentro = ps.idPaqueteCentro 
    AND s.idServicio = ps.idServicio 
    AND pc.idCentro = c.idCentro AND pc.fechaVencimiento > CURRENT_TIMESTAMP HAVING distance < 25`,[req.body.lat,req.body.lon,req.body.lat])
      .then((data) => {
        if (!data) res.send().status(500);

        var groupss = _.groupBy(data, 'idPaqueteCentro');


 
/*
    for (var k in groupss) {

            dataE.push({
            'idPaqueteCentro':groupss[k][0].idPaqueteCentro,
            'nombrePaquete':groupss[k][0].nombrePaquete,
            'duracionPaquete':groupss[k][0].duracionPaquete,
            'precioPaquete':groupss[k][0].precioPaquete,
            'nombreCentro':groupss[k][0].nombreCentro,
            'idCentro':groupss[k][0].idCentro,
            'distance':groupss[k][0].distance,
            'servicios':item[k]

          });


    }
*/


        return res.send(groupss);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/ofertasActivas', (req, res) => {
    db(`SELECT s.*, co.precioOferta as precio2,co.fechaCaducidad, c.nombre as nombreCentro, 
      c.idFoto as imagenCentro, ca.nombre as nombreCategoria FROM servicio as s, control_oferta as co, 
      centro as c, categoria as ca WHERE ca.idCategoria = s.idCategoria AND co.idServicio = s.idServicio 
      AND co.fechaCaducidad > CURRENT_TIMESTAMP 
      AND co.estado = 1 AND c.idCentro = s.idCentro ORDER BY co.fechaCaducidad ASC`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/ofertasActivas2', (req, res) => {
    db(`SELECT s.*, co.precioOferta as precio2,co.fechaCaducidad, c.nombre as nombreCentro, 
    (SELECT  COUNT(DISTINCT ec.puntuacion) FROM evaluacionCentro as ec WHERE ec.idCentro = c.idCentro  AND ec.estado = 2 ) as cantRate,
    (SELECT  AVG(esc.puntuacion) FROM evaluacionCentro as esc WHERE esc.idCentro = c.idCentro AND esc.estado = 2 ) as rate,
    (SELECT (6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud))))) AS distance,
      c.idFoto as imagenCentro FROM servicio as s, control_oferta as co, 
      centro as c WHERE co.idServicio = s.idServicio 
      AND co.fechaCaducidad > CURRENT_TIMESTAMP 
      AND co.estado = 1 AND c.idCentro = s.idCentro ORDER BY co.fechaCaducidad ASC`,[req.body.lat,req.body.lon,req.body.lat])
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
      WHERE s.idCentro = cc.idCentro AND  cc.idCuponCentro = ? AND  
      s.idServicio IN (SELECT iss.idServicio FROM cupon_servicio as iss 
      WHERE iss.idCuponCentro = ?)`,[req.body.idCuponCetro,req.body.idCuponCetro]),
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
    db(`SELECT c.idCentro,c.idFoto,c.nombre as nombreCentro, k.*,
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin,COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate FROM  cupon as k, servicio as s, centro as c INNER JOIN cupon_centro AS cce ON cce.idCentro = c.idCentro AND cce.idCupon = ?
      LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro  WHERE c.idCentro = s.idCentro AND s.estado = 1 AND k.idCupon = cce.idCupon GROUP BY c.idCentro`,[req.body.idCupon])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });
  


  expressApp.post('/getOpinionesCentro', (req, res) => {
    db(`SELECT c.nombre AS nombreCliente, e.*,
      (SELECT jj.nombre FROM empleado as jj, cita as ss WHERE jj.idEmpleado = ss.idEmpleado AND ss.idCita = e.idCita) as nombreStaff,
      (SELECT nn.precioEsperado FROM cita as nn WHERE nn.idCita = e.idCita) as totalCita    
      FROM  evaluacionCentro as e, cliente AS c  
      WHERE  c.idCliente = (SELECT u.idCliente FROM cita as u WHERE u.idCita = e.idCita) AND 
      e.idCentro = ? AND e.estado = 2 ORDER BY e.fechaCreacion DESC`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/getOpinionesCentroFiltro', (req, res) => {
    db(`SELECT c.nombre AS nombreCliente, e.*,
      (SELECT jj.nombre FROM empleado as jj, cita as ss WHERE jj.idEmpleado = ss.idEmpleado AND ss.idCita = e.idCita) as nombreStaff,
      (SELECT nn.precioEsperado FROM cita as nn WHERE nn.idCita = e.idCita) as totalCita    
      FROM  evaluacionCentro as e, cliente AS c  
      WHERE  c.idCliente = (SELECT u.idCliente FROM cita as u WHERE u.idCita = e.idCita) AND 
      e.idCentro = ? AND e.estado = 2 AND DATE(e.fechaCreacion) BETWEEN ?  
      AND ? ORDER BY e.fechaCreacion DESC`,[req.body.idCentro, req.body.fecha, req.body.fechaF])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getOpiniones', (req, res) => {
    db(`SELECT ec.idEvaluacionCentro, ec.estado, ec.comentario, ec.respuestaCentro,ec.puntuacion, ec.fechaCreacion, ci.idCita, c.nombre, c.idFoto, ci.horaFinalEsperado, ci.precioEsperado
 FROM evaluacionCentro as ec, centro as c, cita as ci 
 WHERE ec.idCentro = c.idCentro AND ec.idCita = ci.idCita AND  ci.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);


                        data = data.map((i, index) => {
          console.log(i);

        i.timeAgo =  moment(i.fechaCreacion).fromNow();
        // console.log(i);
        return i;});



        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getOpinionesSA', (req, res) => {
     Promise.all([db(`SELECT ec.idEvaluacionCentro, ec.estado, ec.comentario, ec.idCita, ec.puntuacion, ec.fechaCreacion, c.nombre as nombreCliente 
 FROM evaluacionCentro as ec, cliente as c, cita as cx  
 WHERE ec.idCentro=?  AND ec.estado IN (2,3) AND ec.idCita=cx.idCita AND c.idCliente=cx.idCliente`,[req.body.idCentro]),
     db(`SELECT s.idServicio, s.estado, s.precioOferta,s.nombre, s.duracion, s.precio, s.idCategoria, s.idSubcategoria, s.descripcion, c.nombre as nombreCategoria, b.nombre as nombreSubcategoria   
      FROM servicio as s, categoria as c, subcategoria as b 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND b.idSubcategoria = s.idSubcategoria`,[req.body.idCentro]),
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
WHERE gg.idCentro IN(SELECT cp.idCentro FROM cupon_centro as cp 
WHERE cp.idCupon = c.idCupon)) as nombresCentro, 
c.nombre as nombreCupon,c.fechaExpira, c.tipo, c.tipoDescuento, c.porcentajeDescuento, cc.estado, cc.fechaUso, c.idCupon 
FROM cupon as c, cupon_cliente as cc WHERE c.idCupon = cc.idCupon 
AND cc.idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getCuponPremio', (req, res) => {
    db(`SELECT (SELECT GROUP_CONCAT(gg.nombre) FROM centro as gg 
WHERE gg.idCentro IN(SELECT cp.idCentro FROM cupon_centro as cp 
WHERE cp.idCupon = c.idCupon)) as nombresCentro, 
c.nombre as nombreCupon,c.fechaExpira, c.idCupon 
FROM cupon as c, cupon_cliente as cc WHERE c.idCupon = cc.idCupon 
AND cc.idCuponCliente = ?`,[req.body.idCuponCliente])
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



    expressApp.post('/agregarRegistroManual', (req, res) => {
    db(`INSERT INTO control_centro(idCentro, estadoAsignado,mensaje) VALUES (?,3,?)`,[req.body.idCentro,req.body.mensaje ])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });





  expressApp.post('/getInfoCentro', (req, res) => {
     Promise.all([
    db(`SELECT c.*, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, (SELECT COUNT(r.idCita) FROM cita as r WHERE r.idCentro = c.idCentro) as total, (SELECT COUNT(d.idCita) FROM cita as d WHERE d.idCentro = c.idCentro AND d.estado = 3) as completadas,
      (SELECT COUNT(d.idCita) FROM cita as d WHERE d.idCentro = c.idCentro AND d.estado = 4) as canceladas  
      FROM  centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro 
      WHERE c.idCentro = ?`,[req.body.idCentro]), 
    db(`SELECT s.nombre, cc.nombre as nombreCategoria, cc.idFoto, 
      sc.idServicio, COUNT(sc.idServicioCita) as cantidad 
      FROM categoria as cc, servicio as s, servicio_cita as sc 
      INNER JOIN cita as c ON sc.idCita = c.idCita 
      AND c.idCentro = ? AND c.estado = 3 
      WHERE s.idServicio = sc.idServicio 
      AND cc.idCategoria = s.idCategoria 
      GROUP BY sc.idServicio 
      ORDER BY cantidad DESC LIMIT 5`,[req.body.idCentro]),
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
      AVG(ec.puntuacion) as rate, 
      (SELECT CONCAT(DATE_FORMAT(xxz.horaAbrir, '%l:%i  %p'), ' - ', DATE_FORMAT(xxz.horaCerrar, '%l:%i   %p')) FROM horarioCentro as xxz WHERE xxz.idCentro = ? AND xxz.diaSemana = ? AND xxz.estado = 1) as horarioHoy,
      (SELECT idUsuarioFavorito 
      FROM usuario_favorito WHERE idCentro = ? AND idCliente = ? AND estado = 1) as favorito
      FROM  centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro WHERE c.idCentro = ?
      GROUP BY c.idCentro`,[req.body.idCentro,req.body.numDia,req.body.idCentro, req.body.idCliente, req.body.idCentro]), 
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, c.idFoto as imagenCategoria, c.nombre as nombreCategoria, 
      (SELECT co.precioOferta FROM control_oferta AS co WHERE co.idServicio = s.idServicio AND co.idCentro = ? AND co.fechaCaducidad > CURRENT_TIMESTAMP LIMIT 1) as oferta  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCentro,req.body.idCentro]),
    db(`SELECT ev.*, u.nombre as nombreUsuario, u.idFoto as fotoUsuario, u.imagenFb as fotoFb   
      FROM evaluacionCentro as ev, cliente as u, cita as c 
      WHERE ev.idCentro = ? AND u.idCliente = c.idCliente AND c.idCita = ev.idCita ORDER BY ev.fechaCreacion DESC`,[req.body.idCentro]),
    db(`SELECT c.*, cl.idCuponCliente,
(SELECT GROUP_CONCAT(DISTINCT cs.idServicio SEPARATOR ', ')
FROM cupon_servicio as cs WHERE cs.idCuponCentro=d.idCuponCentro GROUP BY NULL) as serviciosCupon
     FROM cupon as c 
      INNER JOIN cupon_centro as d ON ( d.idCupon = c.idCupon  AND d.idCentro = ?) 
      INNER JOIN cupon_cliente as cl ON (c.idCupon = cl.idCupon AND cl.idCliente = ? AND cl.estado = 1) 
WHERE  c.fechaExpira > CURRENT_TIMESTAMP AND c.estado = 1  ORDER BY c.porcentajeDescuento DESC LIMIT 1`,[req.body.idCentro,req.body.idCliente])])
      .then((data) => {

        if (!data) res.send().status(500);

        let comentarios = data[2].map((i, index) => {
          //console.log(i);

        i.timeAgo =  moment(i.fechaCreacion).fromNow();
         console.log(i);
        return i;});


       

        var groups = _.groupBy(data[1], 'nombreCategoria');
        return res.send({info:data[0],servicios:groups, comentarios:comentarios, cupon:data[3]});
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/reproCitaApp', (req, res) => {

    db(`UPDATE cita set estado=1,horaInicio = ?, horaFinalEsperado=?,
    idEmpleado=? WHERE idCita = ? `,
      [req.body.fechaInicio,
        req.body.fechaFinal, req.body.idEmpleado, req.body.idCita]).then((data) => {
      console.log(data);
      if (data) {
       return res.send(data);
      }
      else{
        return res.send(err).status(500);
      }
      
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

        if(req.body.idCuponCliente && req.body.idCuponCliente>0){

      arrayFunctions.push(db(`UPDATE cupon_cliente set estado=2 WHERE idCuponCliente = ?`,[req.body.idCuponCliente]));

        }


        req.body.servicios.forEach((elementw, index) => {

            arrayFunctions.push(db(`INSERT INTO servicio_cita (idCita, idServicio, estado,precioCobrado) 
            VALUES (?,?,0,?)
            `,[data.insertId, elementw.idServicio,(parseFloat(elementw.precioFinal) || 0)]));

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
    db(`SELECT c.idCentro, c.nombre, c.direccion, c.idFoto, c.telefono,c.latitud, c.longitud, vv.nombre as nombreEmpleado, 
      ci.idCita, ci.estado, ci.notaCita, ci.comentarioEstado, ci.idEmpleado, ci.horaInicio,
      ci.horaFinalEsperado,precioEsperado, ci.idCuponCliente, ci.idCliente, 
      (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = ci.idCuponCliente) as descuento FROM centro as c, cita as ci LEFT JOIN empleado as vv ON vv.idEmpleado = ci.idEmpleado  
      WHERE ci.idCita = ? AND c.idCentro = ci.idCentro`,[req.body.idCita]),
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, sc.precioCobrado, s.idCategoria, s.descripcion,c.idFoto as imagenCategoria, c.nombre as nombreCategoria  
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


    expressApp.post('/getCentroServicios2', (req, res) => {
     Promise.all([
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCentro]),
    db(`SELECT hhe.* FROM horario_especial as hhe WHERE hhe.idCentro = ? AND hhe.fecha >= CURDATE()`,[req.body.idCentro]),
    db(`SELECT * FROM horarioCentro WHERE idCentro = ?`,[req.body.idCentro]),
    db(`SELECT tipoReserva FROM centro WHERE idCentro = ?`,[req.body.idCentro])
    ])
      .then((data) => {

        if (!data) res.send().status(500);




       

        //var groups = _.groupBy(data[0], 'nombreCategoria');
        return res.send({servicios:data[0], horarioEspecial:data[1], horario:data[2],tipoReserva:data[3]});
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCentroServiciosC', (req, res) => {
     Promise.all([db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.estado, s.idSubcategoria, s.idCategoria, s.descripcion, c.nombre as nombreCategoria, co.precioOferta, co.duracion as duracionOferta  
      FROM  categoria as c, servicio as s LEFT JOIN control_oferta AS co ON (co.idServicio = s.idServicio AND  co.fechaCaducidad > CURRENT_TIMESTAMP )  
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria`,[req.body.idCentro]),
     db(`SELECT * FROM control_oferta WHERE idCentro = ? AND estado = 0 AND fechaCaducidad > CURRENT_TIMESTAMP`,[req.body.idCentro]),
     db(`SELECT * FROM paquete_centro WHERE idCentro = ? AND estado = 0 AND fechaVencimiento > CURRENT_TIMESTAMP`,[req.body.idCentro]),
      db(`SELECT pc.*, 
        (SELECT GROUP_CONCAT(s.nombre SEPARATOR ' - ') FROM servicio as s WHERE s.idServicio IN (SELECT ps.idServicio FROM paquete_servicio as ps WHERE ps.idPaqueteCentro = pc.idPaqueteCentro)) as serviciosPaquete FROM paquete_centro as pc 
        WHERE pc.idCentro = ? AND pc.estado = 1 AND pc.fechaVencimiento > CURRENT_TIMESTAMP`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({servicios:data[0], ofertas:data[1], paquetes:data[2],
          paquetesV:data[3]});
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



  expressApp.post('/getServiciosCategoria', (req, res) => {
     Promise.all([db(`SELECT ss.*,  
      (SELECT co.precioOferta FROM control_oferta AS co 
      WHERE co.idServicio = ss.idServicio AND co.idCentro = ? 
      AND co.fechaCaducidad > CURRENT_TIMESTAMP LIMIT 1) as oferta, c.idFoto as imagenCategoria FROM servicio as ss, categoria as c  
      WHERE ss.idCategoria = ? AND ss.idCentro = ? AND c.idCategoria = ss.idCategoria 
      AND ss.estado = 1`,[req.body.idCentro, req.body.idCategoria,req.body.idCentro]),
      db(`SELECT c.*, cl.idCuponCliente,
(SELECT GROUP_CONCAT(DISTINCT cs.idServicio SEPARATOR ', ')
FROM cupon_servicio as cs WHERE cs.idCuponCentro=d.idCuponCentro GROUP BY NULL) as serviciosCupon
     FROM cupon as c 
      INNER JOIN cupon_centro as d ON ( d.idCupon = c.idCupon  AND d.idCentro = ?) 
      INNER JOIN cupon_cliente as cl ON (c.idCupon = cl.idCupon AND cl.idCliente = ? AND cl.estado = 1) 
WHERE  c.fechaExpira > CURRENT_TIMESTAMP 
AND c.estado = 1  
ORDER BY c.porcentajeDescuento DESC LIMIT 1`,[req.body.idCentro,req.body.idCliente])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({servicios:data[0], cupon: data[1]});
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getSAInfo', (req, res) => {
    db(`SELECT email, password FROM usuario_consola WHERE idUsuarioConsola = 11`)
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
    db(`SELECT e.nombre, e.descripcion, e.idFoto, e.estado, e.tipo, e.idEmpleado FROM empleado as e WHERE
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

        expressApp.post('/getHorario2', (req, res) => {
   Promise.all([db(`SELECT * FROM horarioCentro WHERE idCentro = ?`,[req.body.idCentro]),
    db(`SELECT * FROM horario_especial WHERE idCentro =1 AND fecha >= DATE(NOW())`,[req.body.idCentro])]).then((data) => {
        if (!data) res.send().status(500);
        return res.send({horario:data[0], especiales:data[1]});
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/getHorarioEmpleado', (req, res) => {
   Promise.all([db(`SELECT * FROM horarioEmpleado WHERE idEmpleado = ?`,[req.body.idEmpleado]),
    db(`SELECT * FROM horario_especial_empleado WHERE idEmpleado = ?`,[req.body.idEmpleado])]).then((data) => {
        if (!data) res.send().status(500);
        return res.send({horario:data[0], especiales:data[1]});
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

        expressApp.post('/serviciosC', function(req, res) {

    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.idSubcategoria, s.descripcion, c.nombre as nombreCategoria, cs.nombre as nombreSubcategoria,  (SELECT precioOferta FROM control_oferta as co WHERE co.idServicio = s.idServicio AND co.fechaCaducidad>CURRENT_TIMESTAMP  LIMIT 1) as oferta    
      FROM servicio as s, categoria as c, subcategoria as cs  
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND cs.idSubcategoria = s.idSubcategoria AND s.estado = 1`,[req.body.idCentro]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/serviciosGroupNC', function(req, res) {

    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, 
      c.nombre as nombreCategoria, cs.nombre as nombreSubcategoria, 
      (SELECT precioOferta FROM control_oferta as co WHERE co.idServicio = s.idServicio AND co.fechaCaducidad>CURRENT_TIMESTAMP  LIMIT 1) as oferta   
      FROM servicio as s, categoria as c, subcategoria as cs  
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND cs.idSubcategoria = s.idSubcategoria AND s.estado = 1`,[req.body.idCentro]).then((data) => {
         if (!data) res.send().status(500);

            var groups = _.groupBy(data, 'nombreCategoria');

        return res.send(groups);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/marcarEnOfertaNC', (req, res) => {
    db(`INSERT INTO control_oferta(idServicio,precioOferta,
      fechaCaducidad,idCentro, costo, estado) 
      VALUES(?,?,(DATE_ADD(NOW(), INTERVAL (SELECT valor FROM parametros WHERE idParametro = 3) DAY)),
      (SELECT idCentro FROM servicio WHERE idServicio = ?),
      (SELECT valor FROM parametros WHERE idParametro = 4),
      1)`,[req.body.idServicio,req.body.precioOferta,req.body.idServicio]).then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/getServicioNC', function(req, res) {

    Promise.all([db(`SELECT s.idServicio, s.idCentro, s.idCategoria, s.idSubcategoria,
      s.nombre, s.duracion, s.precio, co.precioOferta FROM servicio as s 
      LEFT JOIN control_oferta AS co ON (co.idServicio = s.idServicio AND co.fechaCaducidad > CURRENT_TIMESTAMP ) 
       WHERE s.idServicio = ?`,[req.body.idServicio]),
      db(`SELECT  e.idEmpleado, e.nombre, e.idFoto, e.descripcion, se.idServicioEmpleado, se.estado as checke     
       FROM empleado as e LEFT JOIN servicioEmpleado as se 
       ON (se.idEmpleado = e.idEmpleado AND se.idServicio = ?)
       WHERE e.idCentro = ?`,[req.body.idServicio, req.body.idCentro])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send({servicio:data[0],empleados:data[1]});

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/nuevoUsuarioNC', function(req, res) {

    Promise.all([db(`INSERT INTO usuario_consola(email,nombre,tipo,password, nombreTitular) 
      VALUES(?, ?,1,?,?)`,[req.body.correoElectronico,req.body.nombreNegocio,req.body.password,req.body.nombreUsuario]),
      db(`INSERT INTO centro(nombre,email,nombreTitular) 
      VALUES(?, ?,?)`,[req.body.nombreNegocio,req.body.correoElectronico,req.body.nombreUsuario])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data[1]);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/addStaffNC', function(req, res) {

    var insertQ = ''; 
    req.body.forEach((item, index)=>{
      if(index==0){
    insertQ +='('+item.idCentro+',"'+item.nombre+'",'+item.tipo+',"'+item.descripcion+'","'+item.telefono+'","'+item.email+'")';
       }
       else{
          insertQ +=', ('+item.idCentro+',"'+item.nombre+'",'+item.tipo+',"'+item.descripcion+'","'+item.telefono+'","'+item.email+'")';
       }
    });


    db(`INSERT INTO empleado(idCentro,nombre,tipo,descripcion,telefono,email) VALUES `+insertQ+` `)
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/addServicioNC', function(req, res) {

    var insertQ = ''; 
    var duracion = req.body.duracionH + req.body.duracionM;
     db(`INSERT INTO servicio(idCentro, nombre, idCategoria, idSubcategoria, duracion, precio ) 
      VALUES (?,?,?,?,?,?)`,[req.body.idCentro,req.body.nombreServicio,req.body.idCategoria,
      req.body.idSubcategoria,duracion,req.body.precio]).then((data) => {

         if (!data) {res.send().status(500);}
       
          if(req.body.empleados.length>0){
              var servicioId = data.insertId;
              req.body.empleados.forEach((item, index)=>{
              if(index==0){
              insertQ+= '('+item.idEmpleado+','+servicioId+', 1)';
              }
              else{
              insertQ+= ',('+item.idEmpleado+','+servicioId+', 1)';
              }
              });

              
              db(`INSERT INTO servicioEmpleado (idEmpleado, idServicio, estado)
              VALUES `+insertQ+` `).then((datas) => {

                return res.send(datas);

              });

               
          }
          else{
            return res.send(data);
          }
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/addServiciosNC', function(req, res) {

    var insertQ = ''; 
    req.body.servicios.forEach((item, index)=>{
      if(index==0){
    insertQ +='('+req.body.idCentro+',"'+item.nombreServicio+'",'+item.categoriaServicio+','+item.subcategoriaServicio+','+(parseInt(item.minutoServicio)+parseInt(item.horaServicio))+','+item.precioServicio+',1)';
       }
       else{
          insertQ +=', ('+req.body.idCentro+',"'+item.nombreServicio+'",'+item.categoriaServicio+','+item.subcategoriaServicio+','+(parseInt(item.minutoServicio)+parseInt(item.horaServicio))+','+item.precioServicio+',1)';
       }
    });


    db(`INSERT INTO servicio(idCentro, nombre, idCategoria, idSubcategoria, duracion, precio, estado ) 
      VALUES `+insertQ+` `)
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/updateServicioNC', function(req, res) {

          var duracion = req.body.duracionH + req.body.duracionM;
          var arrayEmpleadoServicio = req.body.empleados.filter(emp => (emp.idServicioEmpleado > 0 || emp.checke));
          var insertQ = ''; 
          arrayEmpleadoServicio.forEach((item, index)=>{
            var estado = item.checke ? 1 : 0;
            if(index==0){
                insertQ +='('+item.idEmpleado+','+req.body.idServicio+','+estado+')';
             }
             else{
                insertQ +=',('+item.idEmpleado+','+req.body.idServicio+','+estado+')';
             }
          });

    if(arrayEmpleadoServicio.length>0){

      Promise.all([db(`INSERT INTO servicioEmpleado (idEmpleado, idServicio, estado)
      VALUES `+insertQ+` ON DUPLICATE KEY UPDATE estado=VALUES(estado)`),
     db(`UPDATE servicio set nombre = ?, idCategoria=?, idSubcategoria=?,duracion=?,precio=? 
        WHERE idServicio = ?`,
      [req.body.nombre,req.body.idCategoria,req.body.idSubcategoria,
      duracion,req.body.precio, req.body.idServicio])]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data[1]);
      }).catch(err => res.send(err).status(500));
    }
    else{
      db(`UPDATE servicio set nombre = ?, idCategoria=?, idSubcategoria=?,duracion=?,precio=? 
        WHERE idServicio = ?`,
      [req.body.nombre,req.body.idCategoria,req.body.idSubcategoria,
      duracion,req.body.precio, req.body.idServicio]).then((data) => {
         if (!data) res.send().status(500);
         return res.send(data);
      }).catch(err => res.send(err).status(500));
    }  

  });





        expressApp.post('/addInfoCentroNC', function(req, res) {

    var direccionC = req.body.direccion || '';
    var insertQ = ''; 
    req.body.horario.forEach((item, index)=>{
      if(index==0){
    insertQ +='('+req.body.idCentro+','+item.diaSemana+',"'+(item.abrir || '00:00:00')+'","'+(item.cerrar || '00:00:00')+'",1)';
       }
       else{
          insertQ +=',('+req.body.idCentro+','+item.diaSemana+',"'+(item.abrir || '00:00:00')+'","'+(item.cerrar || '00:00:00')+'",1)';
       }
    });

    if(req.body.horario.length>0){

      Promise.all([db(`INSERT INTO horarioCentro(idCentro,diaSemana,horaAbrir,horaCerrar,estado) VALUES `+insertQ+` `),
     db(`UPDATE centro set direccion = ?, latitud=?, longitud=?,telefono=?,fbLink=?, estado=1  
      WHERE idCentro = ?`,
      [direccionC,req.body.latitud,req.body.longitud,req.body.telefono,req.body.webUsuario,req.body.idCentro])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data[1]);

      }).catch(err => res.send(err).status(500));

    }
    else{

      db(`UPDATE centro set direccion = ?, latitud=?, longitud=?,telefono=?,fbLink=?, estado=1  
      WHERE idCentro = ?`,
      [direccionC,req.body.latitud,req.body.longitud,req.body.telefono,req.body.webUsuario,req.body.idCentro]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
    }  

  });




        expressApp.post('/nuevoUsuarioCAD', function(req, res) {

    db(`INSERT INTO usuario_consola(email,nombre,tipo,estado,password, ruc, inicioContrato,
      finContrato,tipoContrato,observaciones) 
      VALUES(?, ?,1,?,?,?,?,?,?,?)`,[req.body.email,req.body.nombre,req.body.estado,req.body.password,
      req.body.ruc,req.body.inicioContratoF,req.body.finContratoF,req.body.tipoContrato,req.body.observaciones])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/getServiciosCita4', function(req, res) {

    db(`SELECT vv.precioEsperado, sc.idServicioCita, sc.precioCobrado, s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM cita as vv, servicio as s, categoria as c, servicio_cita as sc  
      WHERE s.idServicio = sc.idServicio 
      AND sc.idCita = ? AND c.idCategoria = s.idCategoria AND vv.idCita = ? AND s.estado = 1`,[req.body.idCita,req.body.idCita])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/getServiciosCita', (req, res) => {
     Promise.all([db(`SELECT vv.precioEsperado, sc.idServicioCita, sc.precioCobrado, s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
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


    expressApp.post('/cargarNegocios2', (req, res) => {
      Promise.all([db(`SELECT cc.*, c.nombre FROM usuario_consola_centro as cc, centro as c  
      WHERE cc.idUsuarioConsola = ? AND c.idCentro = cc.idCentro`,[req.body.idUsuarioConsola]),
      db(`SELECT c.*, 
      (SELECT ec.estado 
      FROM usuario_seccion as ec 
      WHERE ec.idSeccion = c.idSeccion 
      AND ec.idUsuarioConsola = ?) as checked 
      FROM seccion as c WHERE c.estado = 1`,[req.body.idUsuarioConsola])])

      .then((data) => {

        if (!data) res.send().status(500);
    //var groups = _.groupBy(data[0], 'nombreCategoria');


        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/loginNC', (req, res) => {

    db(`SELECT c.idCentro, u.idUsuarioConsola, u.email, u.nombre, u.tipo, u.estado FROM usuario_consola as u, centro as c  
      WHERE u.email = ? AND u.password = ? AND c.email = u.email`,[req.body.email,req.body.password]).then((data) => {
      console.log(data);

      if (data[0].idUsuarioConsola) {
        //data.status=true;
        var dataSend = data[0];
        dataSend.accessToken='access-token-' + Math.random();
        dataSend.refreshToken='access-token-' + Math.random();
        dataSend.roles=["ADMIN"];
        return res.send(dataSend);
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/login', (req, res) => {

    db(`SELECT u.idUsuarioConsola, u.email, u.nombre, u.tipo, u.estado, 
      (SELECT x.estado FROM  usuario_consola AS x WHERE x.idUsuarioConsola = u.parentUser) as estadoCentro FROM usuario_consola as u 
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

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.email, u.imagenFb, u.fechaNacimiento, u.genero,
      u.fbId, u.idFoto, u.estado, COUNT(c.idCita) as completadas,
       (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = u.idCliente AND f.estado = 3) as exp,
              (SELECT valor FROM parametros WHERE idParametro = 7) as appexp
        FROM cliente as u LEFT JOIN cita as c ON c.idCliente = u.idCliente AND c.estado = 3 
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

      var hashEmail = makeid();


    db(`INSERT INTO cliente(nombre,email,telefono,password, verificacionKey, estado) 
      VALUES(?, ?, ?, ?,?,?)`,[req.body.nombre,req.body.email,req.body.telefono,req.body.password,hashEmail,0]).then((data) => {
      console.log(data);
      var numss='123456789';
      if (data) {

          nodemailer.createTestAccount((err, account) => {
          console.log(err);
          // create reusable transporter object using the default SMTP transport
          let transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
          user: 'yourBeautyMessageCenter@gmail.com', // generated ethereal user
          pass: 'be'+numss // generated ethereal password
          }
          });


          // setup email data with unicode symbols
          let mailOptions = {
          from: 'beyourself_sender@outlook.com', // sender address
          to: req.body.email, // list of receivers
          subject: 'Verifica tu cuenta yourBeauty', // Subject line
          text: 'Tu codigo de verificacion es: '+hashEmail
          };

          // send mail with defined transport object
          transporter.sendMail(mailOptions, (error, info) => {

          if(error){
          console.log('Error send email occured');
          console.log(error.message);
          }
          return res.send({ insertId: data.insertId });

          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
          // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
          });
          });

       
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/verificarCuenta', (req, res) => {

    db(`UPDATE cliente set estado = 1 WHERE idCliente = ? and verificacionKey = ?`,
      [req.body.email,req.body.codigo]).then((data) => {
      console.log(data);
      if (data) {
       return res.send({ data: data });
      }
      else{
        return res.send(err).status(500);
      }
      
    }).catch(err => res.send(err).status(500));
  });

        expressApp.post('/addNegocio2', (req, res) => {

    db(`INSERT INTO solicitud_centro(nombreNegocio,nombreContacto,telefono,email, estado,comentario) 
      VALUES(?, ?, ?, ?, 1,?)`,[req.body.nombre,req.body.nombre2,req.body.telefono,req.body.email,req.body.comentario]).then((data) => {
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


       return res.send({ insertId: 0 });

      
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

    db(`INSERT INTO cupon(nombre,codigo,porcentajeDescuento, fechaExpira,estado, tipo, tipoDescuento,premio) 
      VALUES(?, ?, ?, ?, ?, ?,?,?)`,[req.body.nombre,req.body.codigo,req.body.porcentajeDescuento,
      req.body.fechaExpira,1,req.body.tipo, req.body.tipoDescuento,req.body.premio]).then((data) => {
      console.log(data);
      if (data) {
       return res.send(data);
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

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.email, u.imagenFb, u.fechaNacimiento, u.genero,
      u.fbId, u.idFoto, u.estado, COUNT(c.idCita) as completadas,
       (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = u.idCliente AND f.estado = 3) as exp,
              (SELECT valor FROM parametros WHERE idParametro = 7) as appexp 
              FROM cliente as u LEFT JOIN cita as c ON c.idCliente = u.idCliente AND c.estado = 3 
              WHERE u.fbId = ? GROUP BY u.idCliente`,[req.body.userId]).then((data) => {
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
  expressApp.post('/cerrarS', (req, res) => {
    db(`UPDATE  pushHandler set logOut = CURRENT_TIMESTAMP WHERE idCliente = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
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
