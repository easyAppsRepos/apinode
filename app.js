const express = require('express');
const bodyParser = require('body-parser');
const gcm = require('node-gcm');
const apn = require('apn');
//const mail = require("nodemailer").mail;
//const nodemailer = require("nodemailer");
//var nodemailer = require('nodemailer');
var cron = require('node-cron');
var fs = require('fs');
var https = require('https');
var http = require('http');

const { twilo } = require('../../twilocred');

const accountSid = twilo.sid;
const authToken = twilo.token;
const clientTwilo = require('twilio')(accountSid, authToken);


var https_options = {
  key: fs.readFileSync("../../private.key"),
  cert: fs.readFileSync("../../_yourbeauty_com_pa.crt"),
  ca: [
          fs.readFileSync('../../COMODO_RSA_Certification_Authority.crt'),
          fs.readFileSync('../../AddTrust_External_CA_Root.crt') 
       ]

};

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

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


/*CRONJOBLOGIC START*/
/*
  var taskCupon = cron.schedule('10 10 * * *', () =>  {

  console.log('stoped task');

      db(`SELECT cli.idCliente, cu.idCupon, cu.nombre as nombreCupon FROM cupon as cu, cliente as cli, 
  cupon_cliente as cc WHERE DATE(DATE_ADD(CONVERT_TZ(now(),'+00:00','-05:00'), INTERVAL 1 DAY)) = DATE(cu.fechaExpira) AND cc.idCupon = cu.idCupon AND cli.idCliente = cc.idCliente`,[])
      .then((data) => {

         if (!data) res.send().status(500);

         var clientesCupon = data;
          return res.send(data);

      }).catch(err => console.log('errorEnCron2'));
  });

  taskCupon.start();
*/

function registrarIdCC(idAnimacion, idCC){

db(`UPDATE animacionUser set idCC = ? WHERE idAnimacionesUser = ?`,[idCC,idAnimacion]).then((data) => {
  console.log('animSetOK');

      }).catch(err => console.log('errorEnCron1'));


}


  var task = cron.schedule('0,30 * * * *', () =>  {

  console.log('task cronjob');

      Promise.all([db(`SELECT c.idCita, c.horaInicio FROM cita as c  WHERE TIMEDIFF(c.horaInicio, CONVERT_TZ(now(),'+00:00','-05:00')) BETWEEN  '01:30:00' AND '02:00:00' AND
 TIMEDIFF(CONVERT_TZ(now(),'+00:00','-05:00'),CONVERT_TZ(c.fechaCreacion,'+00:00','-05:00')) < '24:00:00' AND c.estado = 2`,[]),
   db(`SELECT c.idCita, c.horaInicio FROM cita as c  WHERE TIMEDIFF(c.horaInicio, CONVERT_TZ(now(),'+00:00','-05:00')) BETWEEN  '23:30:00' AND '24:00:00' AND
 TIMEDIFF(CONVERT_TZ(now(),'+00:00','-05:00'),CONVERT_TZ(c.fechaCreacion,'+00:00','-05:00')) > '24:00:00' AND c.estado = 2`,[])])
      .then((data) => {

         if (!data) res.send().status(500);

         var itemsReservaHoy = data[0];
          var itemsReservaVariosDias = data[1];

          itemsReservaHoy.forEach(item => {
            enviarPush(item.idCita,4);
          });

          itemsReservaVariosDias.forEach(item => {
            enviarPush(item.idCita,4);
          });

        //return res.send(data);

      }).catch(err => console.log('errorEnCron1'));


  });

  task.start();
  //task.stop();
  //task.destroy();


/*CRONJOBLOGIC ENDS*/

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

function makeid2() {
  var text = "";
  var possible = "0123456789";

  for (var i = 0; i < 4; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}



function enviarEmailStaff(email, clave,nombreCli,nombreCen){

  var numss='123456789';

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
        from: 'yourBeautyMessageCenter@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Cuenta ByStaff', // Subject line
        html: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title></title>
  <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" type="text/css">
    <style type="text/css" id="media-query">
      body {
  margin: 0;
  padding: 0; }
table, tr, td {
  vertical-align: top;
  border-collapse: collapse; }
.ie-browser table, .mso-container table {
  table-layout: fixed; }
* {
  line-height: inherit; }
a[x-apple-data-detectors=true] {
  color: inherit !important;
  text-decoration: none !important; }
[owa] .img-container div, [owa] .img-container button {
  display: block !important; }
[owa] .fullwidth button {
  width: 100% !important; }
[owa] .block-grid .col {
  display: table-cell;
  float: none !important;
  vertical-align: top; }
.ie-browser .num12, .ie-browser .block-grid, [owa] .num12, [owa] .block-grid {
  width: 600px !important; }

.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
  line-height: 100%; }

.ie-browser .mixed-two-up .num4, [owa] .mixed-two-up .num4 {
  width: 200px !important; }

.ie-browser .mixed-two-up .num8, [owa] .mixed-two-up .num8 {
  width: 400px !important; }

.ie-browser .block-grid.two-up .col, [owa] .block-grid.two-up .col {
  width: 300px !important; }

.ie-browser .block-grid.three-up .col, [owa] .block-grid.three-up .col {
  width: 200px !important; }

.ie-browser .block-grid.four-up .col, [owa] .block-grid.four-up .col {
  width: 150px !important; }

.ie-browser .block-grid.five-up .col, [owa] .block-grid.five-up .col {
  width: 120px !important; }

.ie-browser .block-grid.six-up .col, [owa] .block-grid.six-up .col {
  width: 100px !important; }

.ie-browser .block-grid.seven-up .col, [owa] .block-grid.seven-up .col {
  width: 85px !important; }

.ie-browser .block-grid.eight-up .col, [owa] .block-grid.eight-up .col {
  width: 75px !important; }

.ie-browser .block-grid.nine-up .col, [owa] .block-grid.nine-up .col {
  width: 66px !important; }

.ie-browser .block-grid.ten-up .col, [owa] .block-grid.ten-up .col {
  width: 60px !important; }

.ie-browser .block-grid.eleven-up .col, [owa] .block-grid.eleven-up .col {
  width: 54px !important; }

.ie-browser .block-grid.twelve-up .col, [owa] .block-grid.twelve-up .col {
  width: 50px !important; }

@media only screen and (min-width: 620px) {
  .block-grid {
    width: 600px !important; }
  .block-grid .col {
    vertical-align: top; }
    .block-grid .col.num12 {
      width: 600px !important; }
  .block-grid.mixed-two-up .col.num4 {
    width: 200px !important; }
  .block-grid.mixed-two-up .col.num8 {
    width: 400px !important; }
  .block-grid.two-up .col {
    width: 300px !important; }
  .block-grid.three-up .col {
    width: 200px !important; }
  .block-grid.four-up .col {
    width: 150px !important; }
  .block-grid.five-up .col {
    width: 120px !important; }
  .block-grid.six-up .col {
    width: 100px !important; }
  .block-grid.seven-up .col {
    width: 85px !important; }
  .block-grid.eight-up .col {
    width: 75px !important; }
  .block-grid.nine-up .col {
    width: 66px !important; }
  .block-grid.ten-up .col {
    width: 60px !important; }
  .block-grid.eleven-up .col {
    width: 54px !important; }
  .block-grid.twelve-up .col {
    width: 50px !important; } }

@media (max-width: 620px) {
  .block-grid, .col {
    min-width: 320px !important;
    max-width: 100% !important;
    display: block !important; }
  .block-grid {
    width: calc(100% - 40px) !important; }
  .col {
    width: 100% !important; }
    .col > div {
      margin: 0 auto; }
  img.fullwidth, img.fullwidthOnMobile {
    max-width: 100% !important; }
  .no-stack .col {
    min-width: 0 !important;
    display: table-cell !important; }
  .no-stack.two-up .col {
    width: 50% !important; }
  .no-stack.mixed-two-up .col.num4 {
    width: 33% !important; }
  .no-stack.mixed-two-up .col.num8 {
    width: 66% !important; }
  .no-stack.three-up .col.num4 {
    width: 33% !important; }
  .no-stack.four-up .col.num3 {
    width: 25% !important; }
  .mobile_hide {
    min-height: 0px;
    max-height: 0px;
    max-width: 0px;
    display: none;
    overflow: hidden;
    font-size: 0px; } }

    </style>
</head>
<body class="clean-body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #F1D5DD">
  <style type="text/css" id="media-query-bodytag">
    @media (max-width: 520px) {
      .block-grid {
        min-width: 320px!important;
        max-width: 100%!important;
        width: 100%!important;
        display: block!important;
      }

      .col {
        min-width: 320px!important;
        max-width: 100%!important;
        width: 100%!important;
        display: block!important;
      }

        .col > div {
          margin: 0 auto;
        }

      img.fullwidth {
        max-width: 100%!important;
      }
      img.fullwidthOnMobile {
        max-width: 100%!important;
      }
      .no-stack .col {
        min-width: 0!important;
        display: table-cell!important;
      }
      .no-stack.two-up .col {
        width: 50%!important;
      }
      .no-stack.mixed-two-up .col.num4 {
        width: 33%!important;
      }
      .no-stack.mixed-two-up .col.num8 {
        width: 66%!important;
      }
      .no-stack.three-up .col.num4 {
        width: 33%!important;
      }
      .no-stack.four-up .col.num3 {
        width: 25%!important;
      }
      .mobile_hide {
        min-height: 0px!important;
        max-height: 0px!important;
        max-width: 0px!important;
        display: none!important;
        overflow: hidden!important;
        font-size: 0px!important;
      }
    }
  </style>
  <table class="nl-container" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #F1D5DD;width: 100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
            <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">               
                    <div align="center" class="img-container center  autowidth  fullwidth " style="padding-right: 0px;  padding-left: 0px;">
<div style="line-height:25px;font-size:1px">&#160;</div>  <img class="center  autowidth  fullwidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/20/rounder-up.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 600px" width="600">
</div>
</div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">

            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->                  
                  <div align="center" class="img-container center fixedwidth " style="padding-right: 0px;  padding-left: 0px;">

  <img class="center fixedwidth" align="center" border="0" src="http://50.116.17.150:3000/uploads/fuchsia-logo.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 240px" width="240">
</div>                
                  
                    <div class="">
  <div style="color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">La mejor forma de gestionar tu negocio</p></div>  
  </div>
</div></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
           <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<div class="">

  <div style="color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:14px;color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px;text-align: center"><span style="font-size: 20px; line-height: 24px;"><strong><span style="line-height: 24px; font-size: 20px;">Bienvenido ${nombreCli},</span></strong></span><br><span style="font-size: 16px; line-height: 21px;">${nombreCen} te ha agregado como miembro en YBstaff</span></p></div>  
  </div>
</div><div align="center" class="img-container center  autowidth  " style="padding-right: 0px;  padding-left: 0px;"><img class="center  autowidth " align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/20/divider.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 316px" width="316">
</div>
 <div class="">

  <div style="color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">Con YBstaff podrás manejar tu agenda, configurar tu horario, confirmar o reprogramar reservas según tu disponibilidad y mucho más.&#160;</p><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center"><br><span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;"><span style="color: #c8385e;"><strong><span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;">Tus credenciales de acceso son:</span><br></strong></span></span><br>Usuario: <strong><span style="color: rgb(200, 56, 94); font-size: 14px; line-height: 21px;">${email}</span></strong><span style="color: rgb(168, 191, 111); font-size: 14px; line-height: 21px;"><strong><br></strong></span></p><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">Contraseña:&#160;<strong><span style="color: rgb(200, 56, 94); font-size: 14px; line-height: 21px;">${clave}</span></strong></p></div>  
  </div>
</div><div class="">
  <div style="color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">Descarga ahora <strong>YBstaff</strong> y configura tu horario para que muestres tu disponibilidad real a los clientes que deseen realizar una reserva.</p></div> 
  </div>
</div></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid two-up ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">
            <div class="col num6" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:25px; padding-bottom:10px;">
    <a href="https://play.google.com/store/apps/details?id=com.ionicframework.estilista" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #ffffff; background-color: #c8385e; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 154px; width: 124px;width: auto; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 15px; padding-right: 15px; padding-bottom: 15px; padding-left: 15px; font-family: 'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;mso-border-alt: none">
      <span style="font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;font-size:16px;line-height:32px;"><strong>GOOGLE PLAY</strong></span>
    </a>
</div></div>
              </div>
            </div>
            <div class="col num6" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:25px; padding-bottom:10px;">
    <a href="https://itunes.apple.com/us/app/ybstaff/id1443880459" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #ffffff; background-color: #c8385e; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 148px; width: 118px;width: auto; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 15px; padding-right: 15px; padding-bottom: 15px; padding-left: 15px; font-family: 'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;mso-border-alt: none">
      <span style="font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;font-size:16px;line-height:32px;"><strong>APPLE STORE</strong></span>
    </a>
</div></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><div class="">
  <div style="color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">SI TIENES DUDAS ESCRÍBENOS A <span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;"><strong><a style="text-decoration: none; color: #000000;" title="soporte@yourbeauty.com.pa" href="mailto:soporte@yourbeauty.com.pa" target="_blank" rel="noopener">SOPORTE@YOURBEAUTY.COM.PA</a></strong></span></p></div>  
  </div>
</div></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #525252;" class="block-grid three-up ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#525252;">
            <div class="col num4" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

                  
                    <div class="">
  <div style="color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:120%; padding-right: 0px; padding-left: 0px; padding-top: 20px; padding-bottom: 0px;">  
    <div style="font-size:12px;line-height:14px;color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 12px;line-height: 14px;text-align: center"><span style="color: rgb(255, 255, 255); font-size: 12px; line-height: 14px;"><strong><span style="font-size: 12px; line-height: 14px;">Web:</span></strong>&#160;<br><a style="text-decoration: none; color: #ffffff;" href="https://www.yourbeauty.com.pa" target="_blank" rel="noopener">www.yourbeauty.com.pa</a><br></span></p></div> 
  </div>
</div>
</div>
              </div>
            </div>
            <div class="col num4" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
<div align="center" style="padding-right: 0px; padding-left: 0px; padding-bottom: 0px;" class="">
  <div style="line-height:15px;font-size:1px">&#160;</div>
  <div style="display: table; max-width:131px;">
    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 5px">
      <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
        <a href="https://www.facebook.com/" title="Facebook" target="_blank">
          <img src="http://50.116.17.150:3000/uploads/facebook@2x.png" alt="Facebook" title="Facebook" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
        </a>
      <div style="line-height:5px;font-size:1px">&#160;</div>
      </td></tr>
    </tbody></table>
    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 5px">
      <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
        <a href="https://twitter.com/" title="Twitter" target="_blank">
          <img src="http://50.116.17.150:3000/uploads/twitter@2x.png" alt="Twitter" title="Twitter" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
        </a>
      <div style="line-height:5px;font-size:1px">&#160;</div>
      </td></tr>
    </tbody></table>
    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 0">
      <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
        <a href="https://plus.google.com/" title="Google+" target="_blank">
          <img src="http://50.116.17.150:3000/uploads/googleplus@2x.png" alt="Google+" title="Google+" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
        </a>
      <div style="line-height:5px;font-size:1px">&#160;</div>
      </td></tr>
    </tbody></table>
  </div>
</div></div>
              </div>
            </div>
            <div class="col num4" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
             <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><div class="">
  <div style="color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:120%; padding-right: 0px; padding-left: 0px; padding-top: 20px; padding-bottom: 0px;">  
    <div style="font-size:12px;line-height:14px;color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 12px;line-height: 14px;text-align: center"><span style="color: rgb(255, 255, 255); font-size: 12px; line-height: 14px;"><strong>Email:<br></strong><a style="text-decoration: none; color: #ffffff;" title="soporte@yourbeauty.com.pa" href="mailto:soporte@yourbeauty.com.pa" target="_blank" rel="noopener">soporte@yourbeauty.com.pa</a><br></span></p></div> 
  </div>
</div></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><div align="center" class="img-container center  autowidth  fullwidth " style="padding-right: 0px;  padding-left: 0px;">
  <img class="center  autowidth  fullwidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/20/rounder-dwn.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 600px" width="600">
</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider " style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
        <tr style="vertical-align: top">
            <td class="divider_inner" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 30px;padding-left: 30px;padding-top: 30px;padding-bottom: 30px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                <table class="divider_content" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 0px solid transparent;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                    <tbody>
                        <tr style="vertical-align: top">
                            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                <span></span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    </td>
  </tr>
  </tbody>
  </table>
</body></html>`
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
           //return res.send({data:dataf,email:resultadoEmail});


        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
         // console.log(dataf);
        }



        function enviarEmailHTML(email,nombreCli,linkAcceso,usuario,contra){

  var numss='123456789';



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
        from: 'yourBeautyMessageCenter@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Cuenta YourBeauty creada', // Subject line
        html:`<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
 
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title></title>
  
  <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" type="text/css">

    
    <style type="text/css" id="media-query">
      body {
  margin: 0;
  padding: 0; }

table, tr, td {
  vertical-align: top;
  border-collapse: collapse; }

.ie-browser table, .mso-container table {
  table-layout: fixed; }

* {
  line-height: inherit; }

a[x-apple-data-detectors=true] {
  color: inherit !important;
  text-decoration: none !important; }

[owa] .img-container div, [owa] .img-container button {
  display: block !important; }

[owa] .fullwidth button {
  width: 100% !important; }

[owa] .block-grid .col {
  display: table-cell;
  float: none !important;
  vertical-align: top; }

.ie-browser .num12, .ie-browser .block-grid, [owa] .num12, [owa] .block-grid {
  width: 600px !important; }

.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
  line-height: 100%; }

.ie-browser .mixed-two-up .num4, [owa] .mixed-two-up .num4 {
  width: 200px !important; }

.ie-browser .mixed-two-up .num8, [owa] .mixed-two-up .num8 {
  width: 400px !important; }

.ie-browser .block-grid.two-up .col, [owa] .block-grid.two-up .col {
  width: 300px !important; }

.ie-browser .block-grid.three-up .col, [owa] .block-grid.three-up .col {
  width: 200px !important; }

.ie-browser .block-grid.four-up .col, [owa] .block-grid.four-up .col {
  width: 150px !important; }

.ie-browser .block-grid.five-up .col, [owa] .block-grid.five-up .col {
  width: 120px !important; }

.ie-browser .block-grid.six-up .col, [owa] .block-grid.six-up .col {
  width: 100px !important; }

.ie-browser .block-grid.seven-up .col, [owa] .block-grid.seven-up .col {
  width: 85px !important; }

.ie-browser .block-grid.eight-up .col, [owa] .block-grid.eight-up .col {
  width: 75px !important; }

.ie-browser .block-grid.nine-up .col, [owa] .block-grid.nine-up .col {
  width: 66px !important; }

.ie-browser .block-grid.ten-up .col, [owa] .block-grid.ten-up .col {
  width: 60px !important; }

.ie-browser .block-grid.eleven-up .col, [owa] .block-grid.eleven-up .col {
  width: 54px !important; }

.ie-browser .block-grid.twelve-up .col, [owa] .block-grid.twelve-up .col {
  width: 50px !important; }

@media only screen and (min-width: 620px) {
  .block-grid {
    width: 600px !important; }
  .block-grid .col {
    vertical-align: top; }
    .block-grid .col.num12 {
      width: 600px !important; }
  .block-grid.mixed-two-up .col.num4 {
    width: 200px !important; }
  .block-grid.mixed-two-up .col.num8 {
    width: 400px !important; }
  .block-grid.two-up .col {
    width: 300px !important; }
  .block-grid.three-up .col {
    width: 200px !important; }
  .block-grid.four-up .col {
    width: 150px !important; }
  .block-grid.five-up .col {
    width: 120px !important; }
  .block-grid.six-up .col {
    width: 100px !important; }
  .block-grid.seven-up .col {
    width: 85px !important; }
  .block-grid.eight-up .col {
    width: 75px !important; }
  .block-grid.nine-up .col {
    width: 66px !important; }
  .block-grid.ten-up .col {
    width: 60px !important; }
  .block-grid.eleven-up .col {
    width: 54px !important; }
  .block-grid.twelve-up .col {
    width: 50px !important; } }

@media (max-width: 620px) {
  .block-grid, .col {
    min-width: 320px !important;
    max-width: 100% !important;
    display: block !important; }
  .block-grid {
    width: calc(100% - 40px) !important; }
  .col {
    width: 100% !important; }
    .col > div {
      margin: 0 auto; }
  img.fullwidth, img.fullwidthOnMobile {
    max-width: 100% !important; }
  .no-stack .col {
    min-width: 0 !important;
    display: table-cell !important; }
  .no-stack.two-up .col {
    width: 50% !important; }
  .no-stack.mixed-two-up .col.num4 {
    width: 33% !important; }
  .no-stack.mixed-two-up .col.num8 {
    width: 66% !important; }
  .no-stack.three-up .col.num4 {
    width: 33% !important; }
  .no-stack.four-up .col.num3 {
    width: 25% !important; }
  .mobile_hide {
    min-height: 0px;
    max-height: 0px;
    max-width: 0px;
    display: none;
    overflow: hidden;
    font-size: 0px; } }

    </style>
</head>
<body class="clean-body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #F1D5DD">
  <style type="text/css" id="media-query-bodytag">
    @media (max-width: 520px) {
      .block-grid {
        min-width: 320px!important;
        max-width: 100%!important;
        width: 100%!important;
        display: block!important;
      }

      .col {
        min-width: 320px!important;
        max-width: 100%!important;
        width: 100%!important;
        display: block!important;
      }

        .col > div {
          margin: 0 auto;
        }

      img.fullwidth {
        max-width: 100%!important;
      }
      img.fullwidthOnMobile {
        max-width: 100%!important;
      }
      .no-stack .col {
        min-width: 0!important;
        display: table-cell!important;
      }
      .no-stack.two-up .col {
        width: 50%!important;
      }
      .no-stack.mixed-two-up .col.num4 {
        width: 33%!important;
      }
      .no-stack.mixed-two-up .col.num8 {
        width: 66%!important;
      }
      .no-stack.three-up .col.num4 {
        width: 33%!important;
      }
      .no-stack.four-up .col.num3 {
        width: 25%!important;
      }
      .mobile_hide {
        min-height: 0px!important;
        max-height: 0px!important;
        max-width: 0px!important;
        display: none!important;
        overflow: hidden!important;
        font-size: 0px!important;
      }
    }
  </style>
  <table class="nl-container" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #F1D5DD;width: 100%" cellpadding="0" cellspacing="0">
  <tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">


    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">

            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
             <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

                  
                    <div align="center" class="img-container center  autowidth  fullwidth " style="padding-right: 0px;  padding-left: 0px;">

<div style="line-height:25px;font-size:1px">&#160;</div>  <img class="center  autowidth  fullwidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/20/rounder-up.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 600px" width="600">

</div>
</div>
              </div>
            </div>
      
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">
       
      
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
             <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">

                  
                    <div align="center" class="img-container center fixedwidth " style="padding-right: 0px;  padding-left: 0px;">

  <img class="center fixedwidth" align="center" border="0" src="http://50.116.17.150:3000/uploads/fuchsia-logo.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 240px" width="240">

</div>

                  
                  
                    <div class="">
  <div style="color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">La mejor forma de gestionar tu negocio</p></div>  
  </div>

</div>
                  
            </div>
              </div>
            </div>

        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">

            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
             <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">

                  
                    <div class="">

  <div style="color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:14px;color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px;text-align: center"><span style="font-size: 24px; line-height: 28px;"><strong><span style="line-height: 28px; font-size: 24px;">Bienvenido ${nombreCli},</span></strong></span><br><span style="font-size: 24px; line-height: 28px;">Ya somos Aliados</span></p></div>  
  </div>

</div>
                  
                  
                    <div align="center" class="img-container center  autowidth  " style="padding-right: 0px;  padding-left: 0px;">

  <img class="center  autowidth " align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/20/divider.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 316px" width="316">

</div>

                  
                  
                    <div class="">

  <div style="color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#555555;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center"><strong>Tu periodo de prueba de 30 días comienza hoy.</strong><br>&#160;<br>Puedes ingresar a tu plataforma de negocio a través de:&#160;<br><span style="color: rgb(200, 56, 94); font-size: 14px; line-height: 21px;"><a style="text-decoration: none; color: #c8385e;" href="http://${linkAcceso}" target="_blank" rel="noopener"><span style="font-size: 14px; line-height: 21px;"><strong>${linkAcceso}</strong></span></a></span><br><br>Tu usuario es: <strong><span style="color: rgb(200, 56, 94); font-size: 14px; line-height: 21px;">${usuario}</span></strong><span style="color: rgb(168, 191, 111); font-size: 14px; line-height: 21px;"><strong><br></strong></span></p><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">Tu contraseña:&#160;<strong><span style="color: rgb(200, 56, 94); font-size: 14px; line-height: 21px;">${contra}</span></strong></p></div>  
  </div>

</div>
                  
                  
                    <div class="">

  <div style="color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">SI TAMBIÉN OFRECES SERVICIOS A TUS CLIENTES DESCARGA <strong><span style="color: rgb(200, 56, 94); font-size: 14px; line-height: 21px;">YBSTAFF</span></strong> Y MANEJA TUS RESERVAS Y CALENDARIO DESDE TU MÓVIL.</p></div>  
  </div>

</div>
                  
          </div>
              </div>
            </div>

        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid two-up ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">

            <div class="col num6" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
                  
                    
<div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:25px; padding-bottom:10px;">

    <a href="https://play.google.com/store/apps/details?id=com.ionicframework.estilista" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #ffffff; background-color: #c8385e; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 154px; width: 124px;width: auto; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 15px; padding-right: 15px; padding-bottom: 15px; padding-left: 15px; font-family: 'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;mso-border-alt: none">
      <span style="font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;font-size:16px;line-height:32px;"><strong>GOOGLE PLAY</strong></span>
    </a>

</div>

                  
             </div>
              </div>
            </div>
  
            <div class="col num6" style="max-width: 320px;min-width: 300px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
             <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">

                                  
<div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:25px; padding-bottom:10px;">
    <a href="https://itunes.apple.com/us/app/ybstaff/id1443880459" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #ffffff; background-color: #c8385e; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 148px; width: 118px;width: auto; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 15px; padding-right: 15px; padding-bottom: 15px; padding-left: 15px; font-family: 'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;mso-border-alt: none">
      <span style="font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;font-size:16px;line-height:32px;"><strong>APPLE STORE</strong></span>
    </a>
</div>
</div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #FFFFFF;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#FFFFFF;">
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
           <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">

          
                    <div class="">
  <div style="color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 10px;"> 
    <div style="font-size:12px;line-height:18px;color:#0D0D0D;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">SI TIENES DUDAS ESCRÍBENOS A <span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;"><strong><a style="text-decoration: none; color: #000000;" title="soporte@yourbeauty.com.pa" href="mailto:soporte@yourbeauty.com.pa" target="_blank" rel="noopener">SOPORTE@YOURBEAUTY.COM.PA</a></strong></span></p></div>  
  </div>
</div>
</div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #525252;" class="block-grid three-up ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:#525252;">
            <div class="col num4" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
            <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">

                  
                    <div class="">

  <div style="color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:120%; padding-right: 0px; padding-left: 0px; padding-top: 20px; padding-bottom: 0px;">  
    <div style="font-size:12px;line-height:14px;color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 12px;line-height: 14px;text-align: center"><span style="color: rgb(255, 255, 255); font-size: 12px; line-height: 14px;"><strong><span style="font-size: 12px; line-height: 14px;">Web:</span></strong>&#160;<br><a style="text-decoration: none; color: #ffffff;" href="https://www.yourbeauty.com.pa" target="_blank" rel="noopener">www.yourbeauty.com.pa</a><br></span></p></div> 
  </div>
</div>
                  
            </div>
              </div>
            </div>

            <div class="col num4" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
             <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">                
<div align="center" style="padding-right: 0px; padding-left: 0px; padding-bottom: 0px;" class="">
  <div style="line-height:15px;font-size:1px">&#160;</div>
  <div style="display: table; max-width:131px;">
    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 5px">
      <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
        <a href="https://www.facebook.com/" title="Facebook" target="_blank">
          <img src="http://50.116.17.150:3000/uploads/facebook@2x.png" alt="Facebook" title="Facebook" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
        </a>
      <div style="line-height:5px;font-size:1px">&#160;</div>
      </td></tr>
    </tbody></table>
    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 5px">
      <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
        <a href="https://twitter.com/" title="Twitter" target="_blank">
          <img src="http://50.116.17.150:3000/uploads/twitter@2x.png" alt="Twitter" title="Twitter" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
        </a>
      <div style="line-height:5px;font-size:1px">&#160;</div>
      </td></tr>
    </tbody></table>
    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 0">
      <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
        <a href="https://plus.google.com/" title="Google+" target="_blank">
          <img src="http://50.116.17.150:3000/uploads/googleplus@2x.png" alt="Google+" title="Google+" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
        </a>
      <div style="line-height:5px;font-size:1px">&#160;</div>
      </td></tr>
    </tbody></table>

  </div>
</div>
</div>
              </div>
            </div>

            <div class="col num4" style="max-width: 320px;min-width: 200px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

                  
                    <div class="">

  <div style="color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;line-height:120%; padding-right: 0px; padding-left: 0px; padding-top: 20px; padding-bottom: 0px;">  
    <div style="font-size:12px;line-height:14px;color:#a8bf6f;font-family:'Montserrat', 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif;text-align:left;"><p style="margin: 0;font-size: 12px;line-height: 14px;text-align: center"><span style="color: rgb(255, 255, 255); font-size: 12px; line-height: 14px;"><strong>Email:<br></strong><a style="text-decoration: none; color: #ffffff;" title="soporte@yourbeauty.com.pa" href="mailto:soporte@yourbeauty.com.pa" target="_blank" rel="noopener">soporte@yourbeauty.com.pa</a><br></span></p></div> 
  </div>

</div>
</div>
              </div>
            </div>
    
        </div>
      </div>
    </div>
    <div style="background-color:transparent;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
         
            <div class="col num12" style="min-width: 320px;max-width: 600px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

                  
                    <div align="center" class="img-container center  autowidth  fullwidth " style="padding-right: 0px;  padding-left: 0px;">

  <img class="center  autowidth  fullwidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/20/rounder-dwn.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 600px" width="600">

</div>

                  
                  
                    
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider " style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
    <tbody>
        <tr style="vertical-align: top">
            <td class="divider_inner" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 30px;padding-left: 30px;padding-top: 30px;padding-bottom: 30px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                <table class="divider_content" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 0px solid transparent;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                    <tbody>
                        <tr style="vertical-align: top">
                            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                <span></span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>
                  
             </div>
              </div>
            </div>
        
        </div>
      </div>
    </div>

    </td>
  </tr>
  </tbody>
  </table>
  <!--[if (mso)|(IE)]></div><![endif]-->


</body></html>`
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
           //return res.send({data:dataf,email:resultadoEmail});


        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
         // console.log(dataf);
        }



function makeidEmail() {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRS";

  for (var i = 0; i < 7; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


var sender = new gcm.Sender('AIzaSyBH4d4XhTbiJDW2QYwkgABH6nmthapELd0');

var sender2 = new gcm.Sender('AIzaSyD6qS2b7LVEIPvceSSVitCjevqtUSViURU');
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

function enviarPush(idCita, tipo){
    
var tipox = 1;

   Promise.all([db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'Android'`,[idCita]),
     db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'iOS'`,[idCita]),
     db(`SELECT c.nombre, c.idCentro, r.horaInicio FROM centro as c, cita as r 
      WHERE c.idCentro = r.idCentro AND r.idCita = ?`,[idCita])]).then((data) => {

      moment.locale('es');
      //res.json(data);
      var mensajePush = ' '; 
      if(tipo == 1){
        mensajePush=" Solicitud de reprogramación de reserva"
       tipox = 1;
      }

       if(tipo == 9){
        mensajePush=" Servicio declinado"
       tipox = 1;
      }


            if(tipo == 2){
        mensajePush="  Felicidades! Tu reserva ha sido confirmada.";
         tipox = 1;

      }

                  if(tipo == 4){
        var horaInicioReserva = moment(data[2][0].horaInicio, "YYYY-MM-DD HH:mm:ss").format("LLL");
        mensajePush=" Recordatorio de cita para el "+horaInicioReserva;
         tipox = 1;

      }


          var nombreCentro = data[2][0].nombre;
         

              if(data[1]){

              var note = new apn.Notification();

              note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    
              note.sound = "ping.aiff";
              note.alert = nombreCentro+mensajePush;
              note.payload = {'tipoNoti': tipox,"idCita":idCita};
              note.topic = "com.ionicframework.beyou";

                 var regTokens = [];

              data[1].forEach((elementwa, index) => {

                  apnProvider.send(note, elementwa.pushKey).then( (result) => {
                  console.log(result);
                  });

              });


            }

            if(data[0]){


            var message = new gcm.Message({
          "data":{
                       "title": nombreCentro,
                       "icon": "ic_launcher",
                       "body": nombreCentro+mensajePush,
                       "tipoNoti": tipox, "idCita":idCita}
                     });





              // Specify which registration IDs to deliver the message to
              var regTokens = [];

              data[0].forEach((elementw, index) => {
              regTokens.push(elementw.pushKey);
              });



              //var regTokens = ['dY98OGfoOJE:APA91bFVAw74t-YO0Oh5DXYFOZbgLzhglyMMhSLsEb2jFpnqn44N6e-mt90V6NbMQ9TkYRUfN3kZw2G7D9Xuv1BKReiJ7khrt2zloVkTx3acZ6tcLevhlg3mb70YDocE0LGaeft7APh7yZYgTgAMErouTV5p3m9H0A'];

              // Actually send the message
              sender.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) console.error(err);
              else console.log(response);
              });

            }


    }).catch(err => res.send(err).status(500));

}



function completarCitaPush(idCita){


/*

            var ga=Number(data.additionalData.puntosGanados) * 1;
            var ge=Number(data.additionalData.totalExc)* 1;
            var gi=Number(data.additionalData.puntosActual)* 1;
            var idCC=Number(data.additionalData.idCC);

SELECT (SELECT valor FROM parametros WHERE idParametro = 7) as max,
(SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = (SELECT gm.idCliente FROM cita as gm WHERE gm.idCita = ? LIMIT 1) AND f.estado = 3) as expCliente,
(SELECT dx.exp FROM cita as dx WHERE dx.idCita = ?) as expCita

*/


Promise.all([
    db(`UPDATE cita set  estado=3,
      exp=(precioEsperado*(SELECT valor FROM parametros WHERE idParametro=2)),
      comision=(precioEsperado*((SELECT valor FROM parametros WHERE idParametro=1)/100)) WHERE idCita = ?`,[idCita]), 
    db(`INSERT INTO evaluacionCentro (idCentro,idCita) 
      VALUES((SELECT x.idCentro FROM cita as x WHERE x.idCita = ?), ?)`,[idCita,idCita]),
    db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'Android'`,[idCita]),
     db(`SELECT DISTINCT p.pushKey FROM pushHandler as p 
      WHERE p.idCliente = (SELECT h.idCliente FROM cita as h WHERE h.idCita = ?) 
      AND p.logOut IS NULL AND p.so = 'iOS'`,[idCita]),
      db(`INSERT INTO animacionesUser (idCliente,ga,ge,gi) 
        VALUES ((SELECT idCliente FROM cita WHERE idCita = ?),
        (SELECT dx.exp FROM cita as dx WHERE dx.idCita = ?),
        (SELECT valor FROM parametros WHERE idParametro = 7),
        ((SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente 
        = (SELECT gm.idCliente FROM cita as gm WHERE gm.idCita = ? LIMIT 1) 
        AND f.estado = 3)-(SELECT dx.exp FROM cita as dx WHERE dx.idCita = ?))
          )`,[idCita,idCita,idCita,idCita]),

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
 [idCita,idCita,idCita,idCita])])
      .then((data) => {

        if (!data) res.send().status(500);
        /*
           var pg = parseInt(data[4][0].expCita) || 0;
               var te = parseInt(data[4][0].max) || 0;
                var pa = (parseInt(data[4][0].expCliente) - parseInt(data[4][0].expCita)) || 0;
                var idCC = 0;
*/
                if(data[5].insertId > 0){
                   //idCC = data[5].insertId;
                   registrarIdCC(data[4].insertId,data[5].insertId);

                }
            if(data[3]){

              var note = new apn.Notification();

              note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    
              note.sound = "ping.aiff";
              note.alert = "Has ganado puntos! Tu cita ha sido marcada como completada";
              note.payload = {'tipoNoti': 2};
              note.topic = "com.ionicframework.beyou";

                 var regTokens = [];

              data[3].forEach((elementwa, index) => {

                  apnProvider.send(note, elementwa.pushKey).then( (result) => {
                  console.log(result);
                  });
              });
            }

            if(data[2]){

                         var message = new gcm.Message({
                          "data":{
                                       "title": "Cita Finalizada",
                                       "icon": "ic_launcher",
                                       "body": "Has ganado puntos! Tu cita ha sido marcada como completada",
                                       "tipoNoti": "2"
                                       
                                       }});
              var regTokens = [];

              data[2].forEach((elementw, index) => {
              regTokens.push(elementw.pushKey);
              });

              sender.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) console.error(err);
              else console.log(response);
              });

            }
      }).catch(err => console.log(err));

}


function testPush(pushTk){

            var message = new gcm.Message({
          "data":{
                       "title": 'Test Push Android',
                       "icon": "ic_launcher",
                       "body": 'simple prueba'}
                     });

              var regTokens = [];
              regTokens.push(pushTk);

              // Actually send the message
              sender2.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) {
                console.log('error push');
              console.error(err);}
              else {
                console.log('okPush');
                console.log(response);
              }
              });


}



function enviarPushEmpleados(empleado, servicios,tipo,fecha,idCita){
    
moment.locale('es');
   Promise.all([db(`SELECT DISTINCT p.pushKey,p.idEmpleado FROM pushHandlerStaff as p 
      WHERE p.idEmpleado = ?  
      AND p.logOut IS NULL AND p.so = 'Android'`,[empleado]),
     db(`SELECT DISTINCT p.pushKey FROM pushHandlerStaff as p 
      WHERE p.idEmpleado = ? AND p.logOut IS NULL AND p.so = 'iOS'`,[empleado]),
     db(`SELECT estado, DATE_FORMAT(horaInicio, '%l:%i  %p') as hora  FROM cita WHERE idCita = ?`,[idCita])]).then((data) => {
      //res.json(data);
      var mensajePush = ' ';
      var titulo = ''; 
      var fecha22 = moment(fecha).format('LL');
      if(data[2][0].estado == 1 || data[2][0].estado == '1'){
        titulo = 'Reserva por confirmar.';
        mensajePush=servicios+" servicio"+(servicios>1 ? 's' : '')+" por confirmar para el "+fecha22 + " a las "+data[2][0].hora;
      }
      if(data[2][0].estado == 2 || data[2][0].estado == '2'){
         titulo = 'Nueva Reserva.';
        mensajePush=servicios+" servicio"+(servicios>1 ? 's' : '')+" para el "+fecha22+ " a las "+data[2][0].hora;
      }

          var nombreCentro = ' ';

              if(data[1]){

              var note = new apn.Notification();

              note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    
              note.sound = "ping.aiff";
              note.alert = titulo+' '+mensajePush;
              note.payload = {'tipoNoti': 1,"idCita":idCita};
              note.topic = "com.ionicframework.estilista";

                 var regTokens = [];

              data[1].forEach((elementwa, index) => {

                  apnProvider.send(note, elementwa.pushKey).then( (result) => {
                  console.log(result);
                  });

              });


            }

            if(data[0]){


            var message = new gcm.Message({
          "data":{
                       "title": titulo,
                       "icon": "ic_launcher",
                       "body": mensajePush,
                       "tipoNoti": 1, "idCita":idCita}
                     });





              // Specify which registration IDs to deliver the message to
              var regTokens = [];

              data[0].forEach((elementw, index) => {
              regTokens.push(elementw.pushKey);
              });



              //var regTokens = ['dY98OGfoOJE:APA91bFVAw74t-YO0Oh5DXYFOZbgLzhglyMMhSLsEb2jFpnqn44N6e-mt90V6NbMQ9TkYRUfN3kZw2G7D9Xuv1BKReiJ7khrt2zloVkTx3acZ6tcLevhlg3mb70YDocE0LGaeft7APh7yZYgTgAMErouTV5p3m9H0A'];

              // Actually send the message
              sender2.send(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) {
                console.log('error push');
              console.error(err);}
              else {
                console.log('okPush');
                console.log(response);
              }
              });

            }


    }).catch(err => res.send(err).status(500));

}

//const app = () => {


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



    expressApp.post('/editarCFE', upload.single('ionicfile'),(req, res) => {
      console.log(req.file);

    
     db(`UPDATE empleado set nombre=?,
      telefono=?,  idFoto=? 
     WHERE idEmpleado = ?`,[req.body.nombreEmpleado, req.body.telefono,
     req.file.path,req.body.idEmpleado])
      .then((data) => {

        if (!data) res.send().status(500);

        return res.send({data:data,idFoto:req.file.path});


      }).catch(err => res.send(err).status(500));

      

  });

    expressApp.post('/editarCFE2', upload.single('ionicfile'),(req, res) => {
      console.log(req.file);

    
     db(`UPDATE empleado set nombre=?,
      telefono=?, password=?, idFoto=? 
     WHERE idEmpleado = ?`,[req.body.nombreEmpleado, req.body.telefono, req.body.password,
     req.file.path,req.body.idEmpleado])
      .then((data) => {

        if (!data) res.send().status(500);

        return res.send({data:data,idFoto:req.file.path});


      }).catch(err => res.send(err).status(500));

      

  });


/*

SELECT s.*, c.nombre as nombreCategoria 
      FROM servicio as s, categoria as c 
      WHERE c.idCategoria = s.idCategoria 
      AND s.idServicio 
      IN (SELECT f.idServicio FROM servicioEmpleado as f 
      WHERE f.idEmpleado = ? AND f.estado = 1)
      */

     expressApp.post('/getSubcategoriasEmpleado', (req, res) => {
    Promise.all([db(`SELECT * FROM subcategoria WHERE idCategoria = ? 
      AND idSubcategoria IN  (SELECT ss.idSubcategoria FROM servicioEmpleado as f, servicio ss  
      WHERE ss.idServicio = f.idServicio AND f.idEmpleado = ? AND f.estado = 1)`,[req.body.idCategoria,
      req.body.idEmpleado]), 
    db(`SELECT s.*
      FROM servicio as s WHERE s.idCategoria = ? AND s.idServicio 
      IN (SELECT f.idServicio FROM servicioEmpleado as f 
      WHERE f.idEmpleado = ? AND f.estado = 1)`,[req.body.idCategoria,
      req.body.idEmpleado])])
      .then((data) => {

        if (!data) res.send().status(500);

        return res.send({subcats:data[0], servicios:data[1]});
      }).catch(err => res.send(err).status(500));
  });



expressApp.post('/getSubcategoriasServ', function(req, res) {
    db(`SELECT s.*
      FROM servicio as s WHERE s.idSubcategoria = ? AND s.idServicio 
      IN (SELECT f.idServicio FROM servicioEmpleado as f 
      WHERE f.idEmpleado = ? AND f.estado = 1)`,[req.body.sub,req.body.idEmpleado]).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});


expressApp.post('/getCategoriasCentro', function(req, res) {
    db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1 
      AND idCategoria IN (SELECT DISTINCT idCategoria FROM servicio WHERE idCentro = ?) `,[req.body.idCentro]).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});

expressApp.post('/getCategoriasEmpleadoC', function(req, res) {
    db(`SELECT  s.* FROM categoria as s WHERE s.estado = 1 
      AND idCategoria IN (SELECT ss.idCategoria FROM servicioEmpleado as f, servicio ss  
      WHERE ss.idServicio = f.idServicio AND f.idEmpleado = ? AND f.estado = 1) `,[req.body.idEmpleado]).then((data) => {
      console.log(data);
      res.json(data);
    }).catch(err => res.send(err).status(500));
});





expressApp.post('/getCitaPendientesN', function(req, res) {
      Promise.all([db(`SELECT idCita FROM cita 
      WHERE idCliente = ? AND estado = 5 
      AND (CONVERT_TZ(now(),'+00:00','-05:00')) < horaInicio 
      ORDER BY idCita ASC LIMIT 1 `,[req.body.idCliente]),
      db(`SELECT * FROM animacionesUser WHERE idCliente = ? 
        AND estado = 1 ORDER BY idAnimacionesUser DESC LIMIT 1`,[req.body.idCliente])]).then((data) => {
     // console.log(data);
      res.json({citas:data[0], animaciones:data[1]});
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

    var numss='123456789';
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
        from: 'yourBeautyMessageCenter@gmail.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'Recuperacion de contraseña YourBeauty', // Subject line
        text: 'Hemos recuperado tu contraseña! Tu contraseña YourBeauty nueva es: '+claveNeva
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




  expressApp.post('/recuperarStaffPass', (req, res) => {

    var numss='123456789';
  var claveNeva = makeid();
  console.log(claveNeva);
 //var claveNeva = 'asdasd';
    var resultadoEmail=1;
    db(`UPDATE empleado set password=? WHERE email=?`,[claveNeva,req.body.email])
      .then((dataf) => {
        if (dataf.affectedRows < 1) {res.send().status(500)}
        else{

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
        from: 'yourBeautyMessageCenter@gmail.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'Recuperacion de contraseña Ybstaff', // Subject line
        text: 'Hemos recuperado tu contraseña! Tu contraseña Ybstaff nueva es: '+claveNeva
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




  expressApp.post('/mensajeSoporte', (req, res) => {

    var resultadoEmail=1;
    db(`SELECT c.email,c.nombre FROM centro as c WHERE c.idCentro = ? `,[req.body.idCentro])
      .then((dataf) => {
        if (!dataf) {res.send().status(500)}
        else{
           if(dataf.length>0){
            var numss='123456789';

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
    console.log(dataf[0].email);
    // setup email data with unicode symbols
    let mailOptions = {
        from: dataf[0].email, // sender address
        to: 'soporte@yourbeauty.com.pa'+','+dataf[0].email, // list of receivers
        subject: req.body.asunto, // Subject line
        text: 'El centro '+dataf[0].nombre+' ha iniciado una solicitud de soporte con el siguiente mensaje:'+req.body.mensaje
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {

            if(error){
            console.log('Error occured');
            console.log(error.message);
            //return;
            resultadoEmail=0;
            return res.send().status(500)
            }
            else{
              return res.send(dataf);
            }
      
           


        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
          console.log(dataf);
        }
        else{return res.send().status(500)}

        }
        //return res.send(data);
      }).catch(err => {
        console.log(err);
        res.send(err).status(500);
      });
  });

  expressApp.post('/recuperarPassNC', (req, res) => {


  var claveNeva = makeid();
  console.log(claveNeva);
 //var claveNeva = 'asdasd';
    var resultadoEmail=1;
    db(`UPDATE usuario_consola set password=? WHERE email=?`,[claveNeva,req.body.email])
      .then((dataf) => {
        if (!dataf) {res.send().status(500)}
        else{
           if(dataf.affectedRows>0){
            var numss='123456789';

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
        from: 'yourBeautyMessageCenter@gmail.com', // sender address
        to: req.body.email, // list of receivers
        subject: 'Recuperacion de contraseña YourBeauty', // Subject line
        text: 'Hemos recuperado tu contraseña del panel de negocio. Tu contraseña YourBeauty nueva es: '+claveNeva
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {

            if(error){
            console.log('Error occured');
            console.log(error.message);
            //return;
            resultadoEmail=0;
            return res.send().status(500)
            }
            else{
              return res.send(dataf);
            }
      
           


        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
});
          console.log(dataf);
        }
        else{return res.send().status(500)}

        }
        //return res.send(data);
      }).catch(err => {
        console.log(err);
        res.send(err).status(500);
      });
  });


  expressApp.post('/buscarServiciosFiltro', (req, res) => {

var stringQuery = `SELECT c.*, MAX(s.precio) as pMax, 
 (SELECT COUNT(idControlOferta) FROM control_oferta WHERE idCentro = c.idCentro 
      AND fechaCaducidad > CONVERT_TZ(now(),'+00:00','-05:00')) as ofertaActiva,
      MIN(s.precio) as pMin, 
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
        stringQuery += ` AND (c.sobreNosotros LIKE '%`+req.body.palabra+`%' OR 
        c.nombre LIKE '%`+req.body.palabra+`%' OR 
        c.idCentro IN 
        (SELECT ssxs.idCentro FROM servicio as ssxs WHERE ssxs.nombre LIKE '%`+req.body.palabra+`%') ) `; 
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
      if(req.body.filtroFecha){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro AND hh.estado = 1 AND hh.diaSemana=`+req.body.fecha+`) > 0 AND 
 (SELECT COUNT(*) FROM horario_especial as cc 
          WHERE c.idCentro = cc.idCentro 
          AND cc.fecha='`+req.body.filtroFecha+`' AND cc.abierto=0 AND cc.estado=1) <= 0 `;
      }

       if(req.body.filtroHora){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro  AND hh.horaAbrir<='`+req.body.filtroHora+`' 
  AND hh.horaCerrar>='`+req.body.filtroHora+`') > 0 `; 
      }


      if(req.body.abierto){
        stringQuery += ` AND (SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro AND hh.diaSemana=`+req.body.diaSemana+` AND hh.horaAbrir<='`+req.body.horaSemana+`' 
  AND hh.horaCerrar>='`+req.body.horaSemana+`' AND hh.estado=1) > 0 `; 
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
        stringQuery += ` AND ((SELECT COUNT(*) FROM horarioCentro as hh 
 WHERE c.idCentro = hh.idCentro AND hh.estado = 1 AND hh.diaSemana=`+req.body.diaSemana+`) > 0 AND 
 (SELECT COUNT(*) FROM horario_especial as hhs 
 WHERE c.idCentro = hhs.idCentro AND hhs.abierto = 0 AND hhs.fecha = DATE(now()) ) < 1)`; 
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

// ORDER BY FIELD(r.estado, 5, 1, 2,3,4), r.horaInicio DESC
  expressApp.post('/reservasUser', (req, res) => {
    db(`SELECT c.nombre as nombreCentro, c.idFoto, r.idCita, r.idCentro, r.horaInicio, ee.nombre as nombreEmpleado,
      (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc WHERE sc.idCita = r.idCita) as cantServicios,
      (SELECT m.nombre FROM servicio as m WHERE m.idServicio IN 
      (SELECT idServicio FROM servicio_cita as ccc WHERE ccc.idCita = r.idCita ORDER BY ccc.idServicioCita ASC) LIMIT 1) as servicioMain,
      r.estado FROM centro as c, cita as r 
      LEFT JOIN empleado as ee ON ee.idEmpleado = r.idEmpleado 
      WHERE c.idCentro = r.idCentro AND r.idCliente = ? ORDER BY r.horaInicio DESC`,[req.body.idCliente])
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
var idServicio = req.body.idServicio;
var idCentro =   req.body.idCentro;

//console.log(time.format("HH:mm"));
//mientras que la hora de cerrar del centro sea mayor o igual que la hora final de la cita
while (moment(finCita).isSameOrBefore(horaCerrar)) {

   // text += "The number is " + i;
    //i++;
//8 830
funcionesBase.push(db(`SELECT ? as inicio, ? as fin, COUNT(DISTINCT e.idEmpleado) as disponibles
 FROM horarioEmpleado as he, empleado as e 

        LEFT JOIN servicio_cita as c ON (c.idEmpleado = e.idEmpleado AND c.estado IN (0,1,2) 
        AND horaFin > ? AND horaInicio < ?)

        LEFT JOIN reservaManual as rm ON (rm.idEmpleado = e.idEmpleado  
        AND rm.horaFinalEsperado > ? AND rm.horaInicio < ? )

        WHERE e.idEmpleado IN (SELECT ec.idEmpleado FROM servicioEmpleado as ec 
        WHERE ec.idServicio = ? AND ec.estado = 1 ) AND e.idCentro = ? 
        AND (he.idEmpleado = e.idEmpleado AND he.diaSemana = ?
         AND he.estado = 1 AND he.horaEntrar < ? AND he.horaSalir > ?)
         AND ? > CONVERT_TZ(now(),'+00:00','-05:00') 
         AND ? > DATE_ADD(CONVERT_TZ(now(),'+00:00','-05:00'), INTERVAL (SELECT parametro1 FROM configuracionCentro WHERE idCentro = ?) HOUR) 
        AND c.idServicioCita IS NULL
        AND rm.idReservaManual IS NULL HAVING disponibles > 0`,[inicioCita.format("YYYY-MM-DD HH:mm:ss"), 
        finCita.format("YYYY-MM-DD HH:mm:ss"),inicioCita.format("YYYY-MM-DD HH:mm:ss"), 
        finCita.format("YYYY-MM-DD HH:mm:ss"), inicioCita.format("YYYY-MM-DD HH:mm:ss"), 
        finCita.format("YYYY-MM-DD HH:mm:ss"),idServicio,idCentro, 
        diaSem, inicioCita.format("HH:mm:ss"), finCita.format("HH:mm:ss"),
        inicioCita.format("YYYY-MM-DD HH:mm:ss"),
        inicioCita.format("YYYY-MM-DD HH:mm:ss"),idCentro]));
  
    inicioCita = moment(finCita);
  //console.log(inicioCita);
    finCita.add(duracion,'m');
    
}

  Promise.all(funcionesBase).then((data) => {

    if (!data) res.send().status(500);
console.log(data);

var dataEnv = [];
data.forEach(item=>{

  if(item[0]){
    dataEnv.push(item[0]);
  }

});
console.log(dataEnv);


/*        data.forEach((item, index) => {

            if(item[0].disponibles<1){
              disponibleTodas=0;
            }
            if(item[0].disponibles>1){
              horariosDisponibles=1;
            }

        });*/
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

        return res.send(dataEnv);
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
    db(`SELECT  df.nombre as nombreCentro, df.idFoto, r.precioEsperado, 
        r.idCita, r.idCentro, DATE_FORMAT(r.horaInicio, '%d/%m/%y') as FechaCita, 
      r.comentarioCita,r.comentarioEstado, r.notaCita, r.estado, 
       (CONVERT_TZ(now(),'+00:00','-05:00') > r.horaInicio) as caducada,
      CONCAT(DATE_FORMAT(r.horaInicio, '%l:%i  %p'), ' - ', 
       DATE_FORMAT(r.horaFinalEsperado, '%l:%i  %p')) as horaCita, 
      (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, 
      (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc 
      WHERE sc.idCita = r.idCita ) as totalServicios, 
      (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  
      FROM centro as df, cita as r  
      WHERE df.idCentro = r.idCentro AND r.idCliente  = ?`,[req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data, 'estado');
            return res.send(groups);
           //return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


 expressApp.post('/citasUserSAFecha', (req, res) => {
    db(`SELECT  df.nombre as nombreCentro, df.idFoto, r.precioEsperado, 
        r.idCita, r.idCentro, DATE_FORMAT(r.horaInicio, '%d/%m/%y') as FechaCita, 
      r.comentarioCita,r.comentarioEstado, r.notaCita, r.estado, 
       (CONVERT_TZ(now(),'+00:00','-05:00') > r.horaInicio) as caducada,
      CONCAT(DATE_FORMAT(r.horaInicio, '%l:%i  %p'), ' - ', 
       DATE_FORMAT(r.horaFinalEsperado, '%l:%i  %p')) as horaCita, 
      (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, 
      (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc 
      WHERE sc.idCita = r.idCita ) as totalServicios, 
      (SELECT v.puntuacion FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  
      FROM centro as df, cita as r  
      WHERE df.idCentro = r.idCentro AND r.idCliente  = ? 
       AND DATE(r.horaInicio) BETWEEN ? AND ? `,[req.body.idCliente,req.body.fecha, req.body.fechaF])
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

  expressApp.post('/serviciosCitaNC', (req, res) => {
    db(`SELECT sc.idServicioCita, sc.idCita, sc.idEmpleado, s.nombre as nombreServicio,s.duracion, 
      sc.precioCobrado, sc.estado as estadoServicio,
      DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') as fechaServicio, TIME_FORMAT(sc.horaInicio, '%h:%i%p') as inicioServicio, 
      TIME_FORMAT(sc.horaFin, '%h:%i%p') as finServicio,
      e.nombre as nombreEmpleado,e.idFoto as empleadoFoto FROM  servicio as s, servicio_cita as sc 
      JOIN empleado as e ON (sc.idEmpleado = e.idEmpleado) 
      WHERE  sc.idCita = ? AND sc.idServicio = s.idServicio`,[req.body.idCita])
      .then((data) => {
        if (!data) res.send().status(500);


            return res.send({servicios:data});

      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCitaDetalleNC', (req, res) => {
   Promise.all([db(`SELECT TIME_FORMAT(c.horaInicio, '%h:%i%p') as inicioCita, c.estado, c.clienteReferencia,
DATE_FORMAT(c.horaInicio, '%Y/%m/%d') as fechaCita, cli.idCliente, 
 c.precioEsperado, c.idPaquete, c.idCita as idCita, cli.nombre as nombreCliente,
 (SELECT COUNT(idServicioCita) FROM servicio_cita as sc WHERE c.idCita = sc.idCita) as cantServicios 
 FROM cita as c, cliente as cli WHERE c.idCliente = cli.idCliente 
 AND c.idCliente = (SELECT idCliente FROM cita WHERE idCita = ?) 
 AND c.idCentro = (SELECT idCentro FROM cita WHERE idCita = ?) ORDER BY fechaCita DESC`,[req.body.idCita,req.body.idCita]), 
   db(`SELECT sc.idServicioCita, sc.idEmpleado, s.nombre as nombreServicio,s.duracion, 
      sc.precioCobrado, sc.estado as estadoServicio,
      DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') as fechaServicio, TIME_FORMAT(sc.horaInicio, '%h:%i%p') as inicioServicio, 
      TIME_FORMAT(sc.horaFin, '%h:%i%p') as finServicio,sc.idCita, 
      e.nombre as nombreEmpleado,e.idFoto as empleadoFoto FROM  servicio as s, servicio_cita as sc 
      JOIN empleado as e ON (sc.idEmpleado = e.idEmpleado) 
      WHERE  sc.idCita = ? AND sc.idServicio = s.idServicio`,[req.body.idCita]),
   db(`SELECT cli.nombre as nombreCliente, cli.idCliente, cli.email, cli.idFoto, 
    (SELECT COUNT(idCita) FROM cita WHERE estado = 3 AND idCliente = cli.idCliente 
    AND idCentro = ?) as completadas,
    (SELECT idCentro FROM cita WHERE idCita = ?) as idCentro,
(SELECT COUNT(idCita) FROM cita WHERE (estado = 1 OR estado = 0) 
AND idCliente = cli.idCliente AND idCentro = ?) as programadas, 
(SELECT COUNT(idCita) FROM cita 
WHERE estado = 4 AND idCliente = cli.idCliente AND idCentro = ?) as canceladas
FROM cliente as cli WHERE cli.idCliente = (SELECT idCliente FROM cita WHERE idCita = ?)
`,[req.body.idCentro,req.body.idCita,req.body.idCentro,req.body.idCentro,req.body.idCita])])
      .then((data) => {
        if (!data) res.send().status(500);


            return res.send({citas:data[0], serviciosCita:data[1],infoCli:data[2]});

      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/getCalendarioNC', (req, res) => {
     Promise.all([db(`SELECT sc.idServicioCita, sc.idEmpleado, s.nombre as nombreServicio, cli.nombre as nombreCliente,s.duracion, 
      sc.precioCobrado, sc.estado as estadoServicio,
      DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') as fechaServicio, TIME_FORMAT(sc.horaInicio, '%h:%i%p') as inicioServicio, 
      TIME_FORMAT(sc.horaFin, '%h:%i%p') as finServicio, c.estado as estadoCita, c.idCita,c.clienteReferencia,
      DATE(c.horaInicio) as fecha, e.nombre as nombreEmpleado,e.idFoto as empleadoFoto, 
      TIME(c.horaInicio) as hora 
      FROM cliente as cli, servicio as s, servicio_cita as sc 
      JOIN cita as c ON (c.idCita = sc.idCita) 
      JOIN empleado as e ON (sc.idEmpleado = e.idEmpleado) 
      WHERE  c.idCentro = ? AND c.horaInicio 
      BETWEEN ? AND DATE_ADD(?, INTERVAL 5 DAY) 
      AND s.idServicio = sc.idServicio AND cli.idCliente = c.idCliente ORDER BY sc.horaInicio ASC`,[req.body.idCentro, req.body.fecha, req.body.fecha]),
    db(`SELECT sc.idServicioCita, sc.idEmpleado, s.nombre as nombreServicio, cli.nombre as nombreCliente, 
      sc.estado as estadoServicio, sc.cambioEstado,
      DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') as fechaServicio, TIME_FORMAT(sc.horaInicio, '%h:%i%p') as inicioServicio, 
      TIME_FORMAT(sc.horaFin, '%h:%i%p') as finServicio, c.idCita,c.clienteReferencia,
      DATE(c.horaInicio) as fecha, e.nombre as nombreEmpleado,e.idFoto as empleadoFoto, 
      TIME(c.horaInicio) as hora 
      FROM cliente as cli, servicio as s, servicio_cita as sc 
      JOIN cita as c ON (c.idCita = sc.idCita) 
      JOIN empleado as e ON (sc.idEmpleado = e.idEmpleado) 
      WHERE  c.idCentro = ? AND sc.estado IN (0,1,2,4) AND DATE(sc.horaInicio) >= CURDATE() AND s.idServicio = sc.idServicio AND cli.idCliente = c.idCliente
       ORDER BY FIELD(sc.estado, 0) DESC, sc.cambioEstado DESC`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data[0], 'idEmpleado');
            var values = _.values(groups);
            var serviciosCalendario = [];

            values.forEach((item, index)=>{
                var final = _.groupBy(item, 'fechaServicio');
                  serviciosCalendario.push(final);
            });

          var result = 0;

          var dataF = data[1].map((i, index) => {

          if(i.estadoServicio == 0){result++;}

          i.timeAgo =  moment(i.cambioEstado).fromNow();

          return i;

        });


           // var result = data[1].filter(word => word.estadoServicio == 0).length;


            return res.send({servEmp:serviciosCalendario, 
                             servAll:data[0], budge:result, notis:dataF});

      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/getCalendarioDayNC', (req, res) => {
     Promise.all([db(`SELECT sc.idServicioCita, sc.idEmpleado, s.nombre as nombreServicio, cli.nombre as nombreCliente,s.duracion, 
      sc.precioCobrado, sc.estado as estadoServicio,
      DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') as fechaServicio, TIME_FORMAT(sc.horaInicio, '%h:%i%p') as inicioServicio, TIME_FORMAT(sc.horaInicio, '%h:00 %p') as inicioServicioFixed,
      TIME_FORMAT(sc.horaInicio, '%H') as soloHoraFixed,  
      TIME_FORMAT(sc.horaFin, '%h:%i%p') as finServicio, c.estado as estadoCita, c.idCita,c.clienteReferencia,
      DATE(c.horaInicio) as fecha, e.nombre as nombreEmpleado,e.idFoto as empleadoFoto, 
      TIME(c.horaInicio) as horaICita 
      FROM cliente as cli, servicio as s, servicio_cita as sc 
      JOIN cita as c ON (c.idCita = sc.idCita) 
      JOIN empleado as e ON (sc.idEmpleado = e.idEmpleado) 
      WHERE  c.idCentro = ? AND DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') = ? 
      AND s.idServicio = sc.idServicio AND cli.idCliente = c.idCliente ORDER BY sc.horaInicio`,[req.body.idCentro,  req.body.fecha]),
    db(`SELECT sc.idServicioCita, sc.idEmpleado, s.nombre as nombreServicio, cli.nombre as nombreCliente, 
      sc.estado as estadoServicio, sc.cambioEstado,
      DATE_FORMAT(sc.horaInicio, '%Y/%m/%d') as fechaServicio, TIME_FORMAT(sc.horaInicio, '%h:%i%p') as inicioServicio, 
      TIME_FORMAT(sc.horaFin, '%h:%i%p') as finServicio, c.idCita,c.clienteReferencia,
      DATE(c.horaInicio) as fecha, e.nombre as nombreEmpleado,e.idFoto as empleadoFoto, 
      TIME(c.horaInicio) as hora 
      FROM cliente as cli, servicio as s, servicio_cita as sc 
      JOIN cita as c ON (c.idCita = sc.idCita) 
      JOIN empleado as e ON (sc.idEmpleado = e.idEmpleado) 
      WHERE  c.idCentro = ? AND sc.estado IN (0,1,2,4) AND DATE(sc.horaInicio) >= CURDATE() AND s.idServicio = sc.idServicio AND cli.idCliente = c.idCliente
       ORDER BY FIELD(sc.estado, 0) DESC, sc.cambioEstado DESC`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);

        /*
              var horasFixed = data.map((item)=>{



                return item;
              })

            //var groups = _.groupBy(data, 'idEmpleado');
           // var values = _.values(groups);
            //var serviciosCalendario = [];

            values.forEach((item, index)=>{
                var final = _.groupBy(item, 'fechaServicio');
                  serviciosCalendario.push(final);
            });
*/
          
            var serviciosCalendario = _.groupBy(data[0], 'idEmpleado');


          var result = 0;

          var dataF = data[1].map((i, index) => {

          if(i.estadoServicio == 0){result++;}

          i.timeAgo =  moment(i.cambioEstado).fromNow();

          return i;

        });


            return res.send({servEmp:serviciosCalendario, 
                             servAll:data[0],budge:result, notis:dataF});

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


  expressApp.post('/verificarPremioUs', (req, res) => {
   Promise.all([db(`INSERT INTO premiosPuntos (puntos, idCliente) SELECT 15, ? WHERE 
      (SELECT idCliente FROM cliente WHERE idCliente = ? 
       AND compartida = 0)>0`,[req.body.idCliente, req.body.idCliente]),
       db(`UPDATE cliente SET compartida = 1 WHERE idCliente = ?`,[req.body.idCliente]),
       db(`SELECT u.idCliente, u.nombre, u.telefono, u.idGenero, u.email, u.imagenFb, u.fechaNacimiento, u.genero,
      u.fbId, u.idFoto, u.estado, COUNT(c.idCita) as completadas,
       (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = u.idCliente AND f.estado = 3) as exp,
              (SELECT valor FROM parametros WHERE idParametro = 7) as appexp
        FROM cliente as u LEFT JOIN cita as c ON c.idCliente = u.idCliente AND c.estado = 3 
      WHERE u.idCliente = ?  GROUP BY u.idCliente`,[req.body.idCliente])])
      .then((data) => {
        if (!data) res.send().status(500);

            var iid = data[0].insertId;
            //compartidoNuevo
            return res.send({compartidoNuevo:iid, puntosGanados:15,dataUser:data[2]});

      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/citasCentroFiltroSA', (req, res) => {
      db(`SELECT  sx.nombre as nombreCliente, df.nombre as nombreCentro,df.idFoto, 
        r.precioEsperado, r.comision, em.nombre as nombreEmpleado, 
        r.idCita, r.idCentro, 
        CONCAT(DATE_FORMAT(r.horaInicio, '%d/%m/%y %H:%i'), ' - ', DATE_FORMAT(r.horaFinalEsperado, '%H:%i')) as FechaCita, 
        r.comentarioCita,r.horaInicio,r.comentarioEstado, r.notaCita,
         r.estado, (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
         WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = r.idCuponCliente) as descuento, 
         (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc 
         WHERE sc.idCita = r.idCita AND sc.estado = 0) as totalServicios, 
         (SELECT v.puntuacion 
         FROM evaluacionCentro as v WHERE v.idCita = r.idCita LIMIT 1) as valoracion  
         FROM cliente as sx, centro as df, cita as r 
         LEFT JOIN empleado as em ON r.idEmpleado = em.idEmpleado 
         WHERE df.idCentro = r.idCentro 
         AND r.idCentro IN (SELECT g.idCentro 
         FROM usuario_consola_centro as g WHERE g.idUsuarioConsola = ? 
         AND sx.idCliente = r.idCliente) 
         AND DATE(r.horaInicio) BETWEEN ? AND ?`,[req.body.idUsuarioConsola, req.body.fecha, req.body.fechaF])
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

      var detalle = 'Reserva de tiempo';

    db(`INSERT INTO reservaManual(idEmpleado,idCentro,horaInicio, 
      horaFinalEsperado, detalle) 
      VALUES (?,(SELECT idCentro FROM empleado WHERE idEmpleado = ? LIMIT 1),?,?,?)`,[req.body.idEmpleado,
      req.body.idEmpleado,req.body.horaInicio,req.body.horaFinalEsperado,detalle])
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
/*
LEFT JOIN servicio_cita as c ON (c.idEmpleado = e.idEmpleado AND c.estado IN (0,1,2) 
        AND horaFin > ? AND horaInicio < ?)

        LEFT JOIN reservaManual as rm ON (rm.idEmpleado = e.idEmpleado  
        AND rm.horaFinalEsperado > ? AND rm.horaInicio < ? )
*/

    expressApp.post('/getEmpleadosDisponibles', (req, res) => {
    db(`SELECT e.nombre, e.descripcion, e.idFoto,e.idEmpleado FROM empleado as e 
  
  LEFT JOIN reservaManual as rm ON (rm.estado = 1 AND rm.idEmpleado = e.idEmpleado AND 
        ((? BETWEEN rm.horaInicio AND rm.horaFinalEsperado ) OR  (? BETWEEN rm.horaInicio AND rm.horaFinalEsperado) OR (? < rm.horaInicio AND rm.horaFinalEsperado < ?)))
        
    LEFT JOIN servicio_cita as c ON (c.idEmpleado = e.idEmpleado AND c.estado IN (0,1,2) 
        AND c.horaFin > ? AND c.horaInicio < ?)
    
    LEFT JOIN horarioEmpleado as he ON (he.idEmpleado = e.idEmpleado AND he.diaSemana = ? AND (he.estado = 0 OR (he.estado = 1 AND ? < he.horaEntrar  OR ? > he.horaSalir)))
    
  WHERE  e.idCentro = ? AND e.estado = 1 AND ? IN (SELECT ec.idServicio FROM servicioEmpleado as ec WHERE ec.idEmpleado = e.idEmpleado AND ec.estado = 1) 
  AND rm.idReservaManual IS NULL 
  AND c.idServicioCita IS NULL 
  AND he.idEmpleado IS NULL ORDER BY e.idEmpleado ASC`,[req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,
  req.body.fecha, req.body.fechaF,req.body.diaN,
  req.body.soloHI,req.body.soloHF,req.body.idCentro,req.body.idServicio])
      .then((data) => {
        if (!data) res.send().status(500);
        console.log(data);
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




    expressApp.post('/agregarPaqueteNC', (req, res) => {

    var insertQ = ''; 


    db(`INSERT INTO paquete_centro (estado,nombre,tiempo,precioTotal, idCentro, fechaVencimiento) 
      VALUES(1,?,?,?,?, DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY))`,[req.body.nombrePaquete,req.body.duracion,
      req.body.precio,req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        else{
          var isID = data.insertId;
          req.body.servicios.forEach((item, index)=>{
          if(index==0){
          insertQ += ' ('+isID+ ','+item.idServicio+')';
          }
          else{
          insertQ += ',('+isID+ ','+item.idServicio+')';
          }
          });
          db(`INSERT INTO paquete_servicio(idPaqueteCentro,idServicio) VALUES `+insertQ+` `)
          .then((datas) => {
            return res.send(datas);
          }).catch(err => res.send(err).status(500));
        }

        //return res.send(data[0]);
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



    expressApp.post('/cancelarRMAS', function(req, res) {
     db(`DELETE cita,servicio_cita FROM cita 
      INNER JOIN servicio_cita ON cita.idCita = servicio_cita.idCita  
      WHERE cita.idCita = ? `,[req.body.idCita])
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


        expressApp.post('/quitarAnimacion', function(req, res) {
     Promise.all([db(`UPDATE animacionesUser set estado = 0 WHERE idCliente = ?`,[req.body.idCliente]),
     db(`SELECT u.idCliente, u.nombre, u.telefono, u.idGenero, u.email, u.imagenFb, u.fechaNacimiento, u.genero,
      u.fbId, u.idFoto, u.estado, COUNT(c.idCita) as completadas,
       (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = u.idCliente AND f.estado = 3) as exp,
              (SELECT valor FROM parametros WHERE idParametro = 7) as appexp
        FROM cliente as u LEFT JOIN cita as c ON c.idCliente = u.idCliente AND c.estado = 3 
      WHERE u.idCliente = ?  GROUP BY u.idCliente`,[req.body.idCliente])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send({data: data[1]});

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
    db(`UPDATE evaluacionCentro set puntuacion=?,comentario=?,estado=2,
      servicio=?,staff=?,precio=?,limpieza=?,ambiente=?  
     WHERE idEvaluacionCentro = ?`,[req.body.evaluacion, req.body.comentario,
     req.body.servicio,req.body.staff,req.body.precio,req.body.limpieza,
     req.body.ambiente,req.body.idEvaluacionCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/editarUsuario', (req, res) => {

      if(req.body.fechaNacimiento){
        req.body.fechaNacimiento = req.body.fechaNacimiento.split('T')[0];
      }
    db(`UPDATE cliente set nombre=?,telefono=?, password = ? , genero=?, idGenero = ? , fechaNacimiento = ? 
     WHERE idCliente = ?`,[req.body.nombre, req.body.telefono,req.body.password,req.body.genero,req.body.idGenero,req.body.fechaNacimiento,
     req.body.idCliente])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




    expressApp.post('/editarEmpleadoAE', (req, res) => {


    db(`UPDATE empleado set nombre=?,telefono=?   
     WHERE idEmpleado = ?`,[req.body.nombreEmpleado, req.body.telefono, req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/editarEmpleadoAE2', (req, res) => {


    db(`UPDATE empleado set nombre=?,telefono=?, password = ?   
     WHERE idEmpleado = ?`,[req.body.nombreEmpleado, req.body.telefono, req.body.password, req.body.idEmpleado])
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
   Promise.all([db(`UPDATE centro set imagenBanner = ? WHERE idCentro = ?`,[req.file.path,req.body.idCentro]),
     db(`UPDATE usuario_consola set pasos=4 WHERE email = 
      (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data[0]);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/actualizarBannerNC21', upload.single('imageU'),(req, res) => {
   db(`UPDATE centro set imagenBanner = ? WHERE idCentro = ?`,[req.file.path,req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/actualizarBannerNC2', upload.single('imageU'),(req, res) => {
   Promise.all([db(`UPDATE centro set idFoto = ? WHERE idCentro = ?`,[req.file.path,req.body.idCentro]),
     db(`UPDATE usuario_consola set pasos=5 WHERE email = 
      (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.idCentro])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data[0]);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/actualizarFotoNC', upload.single('imageU'),(req, res) => {
    db(`UPDATE centro set idFoto = ? WHERE idCentro = ?`,[req.file.path,req.body.idCentro])
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


  



expressApp.get('/enviarEmailHTML', function(req, res) {
 
 enviarEmailHTML();
});




    expressApp.post('/cambiarPaqueteNC', (req, res) => {
    db(`UPDATE paquete_centro set estado=? 
      WHERE idPaqueteCentro = ?`,[req.body.estado,req.body.idPaqueteCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/cambiarOfertaNC', (req, res) => {
    db(`UPDATE control_oferta set estado=? 
      WHERE idControlOferta = ?`,[req.body.estado,req.body.idOferta])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/cancelarCita', (req, res) => {
     Promise.all([db(`UPDATE cita set estado=4 WHERE idCita = ?`,[req.body.idCita]),
      db(`UPDATE servicio_cita set estado=4 WHERE idCita = ?`,[req.body.idCita])])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/cambiarServicioCitaNC', (req, res) => {

      var traduccionEstado = req.body.estado == 0 ? 1 : 
       req.body.estado == 1 ? 2 : req.body.estado == 2 ? 5 : 
        req.body.estado == 3 ? 3 : req.body.estado == 4 ? 4 :1;
        console.log(traduccionEstado);

db(`UPDATE servicio_cita set estado=? 
      WHERE idServicioCita = ?`,[req.body.estado,req.body.idServicioCita]).then((datass) => {

        if (!datass) res.send().status(500);

     Promise.all([db(`UPDATE cita set estado=? WHERE ? <> 4 AND idCita = ? AND ? = 
         ALL (SELECT estado FROM servicio_cita WHERE idCita = ?) 
        `,[traduccionEstado,req.body.estado,req.body.idCita,req.body.estado, req.body.idCita ]),
      db(`SELECT idCita FROM cita WHERE idCita = ? AND 
        estado = ?`,[req.body.idCita, traduccionEstado])])
      .then((data) => {
        


        if(req.body.estado==3 && data[1].length>0 && data[1][0].idCita){
          completarCitaPush(req.body.idCita);
        }
        if(req.body.estado==1 && data[1].length>0 && data[1][0].idCita){
          enviarPush(req.body.idCita,2);
        }      

                if(req.body.estado==4 ){
          enviarPush(req.body.idCita,9);
        }   



        return res.send(data);
      }).catch(err => res.send(err).status(500));


    });
  });



        expressApp.post('/cambiarServicioCitaNCREPRO', (req, res) => {

db(`UPDATE servicio_cita set estado=2 
      WHERE idCita = ?`,[req.body.idCita]).then((datass) => {

        if (!datass) res.send().status(500);

     db(`UPDATE cita set estado=5, comentarioCita=? WHERE idCita = ?`,[req.body.comentario,req.body.idCita])
      .then((data) => {
        
          enviarPush(req.body.idCita,1);
               

        return res.send(data);
      }).catch(err => res.send(err).status(500));


    });
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



        expressApp.post('/reprogramarCitaNC', (req, res) => {

          var idCita = req.body.servicios[0].idCita;
           var notaR = req.body.comentarioEstado || ' ';
           let arrayFunctions = [];
      req.body.servicios.forEach((elementw, index) => {

      var horaI = req.body.fecha+' '+elementw.inicio;
      var horaF = req.body.fecha+' '+elementw.fin;
      arrayFunctions.push(db(`UPDATE servicio_cita set estado=0,horaInicio=?, 
        horaFin=?, idEmpleado = ? 
        WHERE idServicioCita = ?`,[horaI, horaF, elementw.empleadoSeleccionado.idEmpleado,
        elementw.idServicioCita]));

      });

      arrayFunctions.push(db(`UPDATE cita set comentarioEstado=?, horaInicio=?, horaFinalEsperado=?, 
      estado=1  WHERE idCita = ?`,[notaR,req.body.inicio,
      req.body.fin,idCita]));

     Promise.all(arrayFunctions).then((data) => {
        if (!data) res.send().status(500);

        enviarPush(idCita,1);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/reprogramarCitaNCAPP', (req, res) => {

          var idCita = req.body.servicios[0].idCita;
           var notaR = req.body.comentarioEstado || ' ';
           let arrayFunctions = [];
              let confirmacionLista = [];
      req.body.servicios.forEach((elementw, index) => {

      var horaI = req.body.fecha+' '+elementw.inicio;
      var horaF = req.body.fecha+' '+elementw.fin;
      arrayFunctions.push(db(`UPDATE servicio_cita set estado=0,horaInicio=?, 
        horaFin=?, idEmpleado = ? 
        WHERE idServicioCita = ?`,[horaI, horaF, elementw.empleadoSeleccionado.idEmpleado,
        elementw.idServicioCita]));

       confirmacionLista.push(elementw.empleadoSeleccionado.idEmpleado);


      });

      arrayFunctions.push(db(`UPDATE cita set comentarioEstado=?, horaInicio=?, horaFinalEsperado=?, 
      estado=1  WHERE idCita = ?`,[notaR,req.body.inicio,
      req.body.fin,idCita]));

     Promise.all(arrayFunctions).then((data) => {
        if (!data) res.send().status(500);

          var listaPush = _.uniq(confirmacionLista);
           var fecha = req.body.inicio.split(' ')[0];

            listaPush.forEach((elementw, index) => {
            var cant = confirmacionLista.filter(word => word == elementw).length;

            //console.log(elementw, cant,1,req.body.fechaInicio,idCitaAdded);
            enviarPushEmpleados(elementw, cant,1,fecha,idCita);
          });


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
    db(`UPDATE usuario_consola set nombreTitular=?,email=?,estado=?,ruc=?,
      inicioContrato=?,finContrato=?, tipoContrato=?, observaciones=? 
      WHERE idUsuarioConsola = ?`,[req.body.nombreTitular,req.body.email,
      req.body.estado,
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
              note.alert = "Has ganado puntos! Tu cita ha sido marcada como completada";
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
                                       "body": "Has ganado puntos! Tu cita ha sido marcada como completada",
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
    
     expressApp.post('/getSubcategoriasCentro', (req, res) => {
    db(`SELECT * FROM subcategoria WHERE idCategoria = ? 
      AND idSubcategoria IN (SELECT DISTINCT idSubcategoria FROM servicio WHERE idCentro = ?)`,[req.body.idCategoria,req.body.idCentro])
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
    (SELECT COUNT(f.idCita) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado = 4) as canceladas,
    (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado = 3) as exp,
    (SELECT valor FROM parametros WHERE idParametro = 7) as appexp
     FROM cliente as c WHERE c.idCliente <> 0`,[req.body.idUsuario])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




   expressApp.post('/getUserInfo', (req, res) => {
    db(`SELECT c.*,
      (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = c.idCliente AND f.estado = 3) as exp,
              (SELECT valor FROM parametros WHERE idParametro = 7) as appexp 
               FROM cliente as c  WHERE c.idCliente = ?`,[req.body.idCliente])
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


        expressApp.post('/cargaUsuariosConsolaNC', (req, res) => {
    db(`SELECT  c.nombre, c.idCentro, c.idFoto, c.email,
      (SELECT uc.nombreTitular FROM usuario_consola as uc WHERE uc.email = c.email) as nombreTitular,
(SELECT uc.ruc FROM usuario_consola as uc WHERE uc.email = c.email) as ruc,
(SELECT uc.inicioContrato FROM usuario_consola as uc WHERE uc.email = c.email) as inicioContrato,
(SELECT uc.finContrato FROM usuario_consola as uc WHERE uc.email = c.email) as finContrato,
(SELECT uc.tipoContrato FROM usuario_consola as uc WHERE uc.email = c.email) as tipoContrato,
(SELECT uc.idUsuarioConsola FROM usuario_consola as uc WHERE uc.email = c.email) as idUsuarioConsola,
(SELECT uc.observaciones FROM usuario_consola as uc WHERE uc.email = c.email) as observaciones,
(SELECT uc.estado FROM usuario_consola as uc WHERE uc.email = c.email) as estado,
    TRUNCATE(SUM(CASE WHEN (r.estado = 4 AND p.idParametro=1)  THEN (r.precioEsperado*(p.valor/100)) ELSE NULL END),2) AS comisionCanceladas,
    TRUNCATE(SUM(CASE WHEN (r.estado = 1 AND p.idParametro=1)  THEN (r.precioEsperado*(p.valor/100)) ELSE NULL END),2) AS comisionPorConfirmar,
    TRUNCATE(SUM(CASE WHEN (r.estado = 5 AND p.idParametro=1)  THEN (r.precioEsperado*(p.valor/100)) ELSE NULL END),2) AS comisionEConfirmar,
    TRUNCATE(SUM(CASE WHEN (r.estado = 2 AND p.idParametro=1)  THEN (r.precioEsperado*(p.valor/100)) ELSE NULL END),2) AS comisionConfirmadas,
    TRUNCATE(SUM(CASE WHEN (r.estado = 3 AND p.idParametro=1)  THEN (r.precioEsperado*(p.valor/100)) ELSE NULL END),2) AS comisionCompletadas,
    COUNT(DISTINCT CASE WHEN r.estado = 1 THEN r.idCita ELSE NULL END) AS porconfirmar,
    COUNT(DISTINCT CASE WHEN r.estado = 5 THEN r.idCita ELSE NULL END) AS econfirmar,
    COUNT(DISTINCT CASE WHEN r.estado = 2 THEN r.idCita ELSE NULL END) AS confirmadas,
    COUNT(DISTINCT CASE WHEN r.estado = 4 THEN r.idCita ELSE NULL END) AS canceladas,
    COUNT(DISTINCT CASE WHEN r.estado = 3 THEN r.idCita ELSE NULL END) AS completadas FROM  parametros as p, centro as c LEFT JOIN cita as r ON  r.idCentro = c.idCentro GROUP BY c.idCentro`)
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





        expressApp.post('/cargaCentrosUserSA2Fecha', (req, res) => {
     Promise.all([db(` SELECT c.*,
       (SELECT SUM(r.comision) FROM cita as r 
       WHERE r.estado = 3 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as comision,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as canceladas,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as comisionCanceladas,
  (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as canceladasT,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado IN (1,5)  AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as porconfirmar,
  (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado IN (1,5) AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as porconfirmarT,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado IN (1,5)  AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as comisionPorConfirmar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as econfirmar,
     (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as econfirmarT,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as comisionEConfirmar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as confirmadas,
        (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as confirmadasT,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as comisionConfirmadas,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as completadas,
    (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as completadasT,
   (SELECT ROUND(AVG(ecc.puntuacion), 2) FROM evaluacionCentro as ecc WHERE ecc.idCentro = c.idCentro AND ecc.estado = 2 ) as calificacion,
  (SELECT SUM(r.comision) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro AND DATE(r.horaInicio) BETWEEN ? AND ?) as comisionCompletadas 
  FROM centro as c WHERE c.idCentro = ?`,[ req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,
  req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,
  req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,
  req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.fecha, req.body.fechaF,req.body.idCentro]),
     db(`SELECT  sx.nombre as nombreCliente, df.nombre as nombreCentro,sx.idFoto, r.precioEsperado, 
      r.comision, r.idCita, r.idCentro,
       DATE_FORMAT(r.horaInicio, '%d/%m/%y') as FechaCita, 
       CONCAT(DATE_FORMAT(r.horaInicio, '%l:%i  %p'), ' - ', 
       DATE_FORMAT(r.horaFinalEsperado, '%l:%i  %p')) as horaCita,
       (CONVERT_TZ(now(),'+00:00','-05:00') > r.horaInicio) as caducada, 
       r.comentarioCita,r.horaInicio,r.comentarioEstado, r.notaCita,
        r.estado, (SELECT cupon.porcentajeDescuento 
        FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND 
        gh.idCuponCliente = r.idCuponCliente) as descuento, 
        (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc 
        WHERE sc.idCita = r.idCita) as totalServicios, 
        (SELECT v.puntuacion FROM evaluacionCentro as v 
        WHERE v.idCita = r.idCita LIMIT 1) as valoracion  
        FROM cliente as sx, centro as df, cita as r  
        WHERE df.idCentro = r.idCentro AND r.idCentro  = ? AND DATE(r.horaInicio) BETWEEN ? AND ? 
        AND sx.idCliente = r.idCliente `,[req.body.idCentro, req.body.fecha, req.body.fechaF]),
      db(`SELECT SUM(r.precioEsperado) as total, SUM(r.comision) as comision 
          FROM cita as r WHERE r.estado = 3 AND DATE(r.horaInicio) BETWEEN ? AND ? 
          AND r.idCentro = ?`,[req.body.idCentro,req.body.fecha, req.body.fechaF])
     ]).then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data[1], 'estado');
        var datav= {sucursales:data[0], info:groups, dataR:data[2]}
        //console.log(datav);
        return res.send(datav);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/cargaCentrosUserSA2', (req, res) => {
     Promise.all([db(` SELECT c.*,
       (SELECT SUM(r.comision) FROM cita as r 
       WHERE r.estado = 3 AND r.idCentro = c.idCentro) as comision,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro) as canceladas,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro) as comisionCanceladas,
  (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 4 AND r.idCentro = c.idCentro) as canceladasT,
 (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado IN (1,5)  AND r.idCentro = c.idCentro) as porconfirmar,
  (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado IN (1,5) AND r.idCentro = c.idCentro) as porconfirmarT,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado IN (1,5)  AND r.idCentro = c.idCentro) as comisionPorConfirmar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro) as econfirmar,
     (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro) as econfirmarT,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 5 AND r.idCentro = c.idCentro) as comisionEConfirmar,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro) as confirmadas,
        (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro) as confirmadasT,
  (SELECT SUM(r.precioEsperado)*(SELECT valor/100 FROM parametros WHERE idParametro = 1) FROM cita as r WHERE r.estado = 2 AND r.idCentro = c.idCentro) as comisionConfirmadas,
   (SELECT COUNT(r.idCita) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro) as completadas,
    (SELECT SUM(r.precioEsperado) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro) as completadasT,
   (SELECT ROUND(AVG(ecc.puntuacion), 2) FROM evaluacionCentro as ecc WHERE ecc.idCentro = c.idCentro AND ecc.estado = 2 ) as calificacion,
  (SELECT SUM(r.comision) FROM cita as r WHERE r.estado = 3 AND r.idCentro = c.idCentro) as comisionCompletadas 
  FROM centro as c WHERE c.idCentro = ?`,[req.body.idCentro]),
     db(`SELECT  sx.nombre as nombreCliente, df.nombre as nombreCentro,sx.idFoto, r.precioEsperado, 
      r.comision, r.idCita, r.idCentro,
       DATE_FORMAT(r.horaInicio, '%d/%m/%y') as FechaCita, 
       CONCAT(DATE_FORMAT(r.horaInicio, '%l:%i  %p'), ' - ', 
       DATE_FORMAT(r.horaFinalEsperado, '%l:%i  %p')) as horaCita,
       (CONVERT_TZ(now(),'+00:00','-05:00') > r.horaInicio) as caducada, 
       r.comentarioCita,r.horaInicio,r.comentarioEstado, r.notaCita,
        r.estado, (SELECT cupon.porcentajeDescuento 
        FROM cupon, cupon_cliente as gh WHERE gh.idCupon = cupon.idCupon AND 
        gh.idCuponCliente = r.idCuponCliente) as descuento, 
        (SELECT COUNT(sc.idServicioCita) FROM servicio_cita as sc 
        WHERE sc.idCita = r.idCita) as totalServicios, 
        (SELECT v.puntuacion FROM evaluacionCentro as v 
        WHERE v.idCita = r.idCita LIMIT 1) as valoracion  
        FROM cliente as sx, centro as df, cita as r  
        WHERE df.idCentro = r.idCentro AND r.idCentro  = ? 
        AND sx.idCliente = r.idCliente`,[req.body.idCentro]),
      db(`SELECT SUM(r.precioEsperado) as total, SUM(r.comision) as comision 
          FROM cita as r WHERE r.estado = 3 
          AND r.idCentro = ?`,[req.body.idCentro])
     ]).then((data) => {
        if (!data) res.send().status(500);

            var groups = _.groupBy(data[1], 'estado');
        var datav= {sucursales:data[0], info:groups, dataR:data[2]}
        //console.log(datav);
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
      (SELECT COUNT(idControlOferta) FROM control_oferta WHERE idCentro = c.idCentro 
      AND fechaCaducidad > CONVERT_TZ(now(),'+00:00','-05:00')) as ofertaActiva, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, 
      ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.idSubcategoria IN (`+req.body.idSubcategoria+`)  
      AND s.estado = 1   
      GROUP BY c.idCentro HAVING distance < 25 ORDER BY -distance DESC LIMIT ?,10`,[req.body.lat, req.body.lon, req.body.lat, req.body.pagina])])
      .then((data) => {
        if (!data) res.send().status(500);

        return res.send({cercania:data[0]});


      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCentrosMapa', (req, res) => {
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
      AND s.estado = 1   
      GROUP BY c.idCentro HAVING distance < 35`,[req.body.lat, req.body.lon, req.body.lat])
      .then((data) => {
        if (!data) res.send().status(500);

        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/getCentrosMapaFix', (req, res) => {
    db(`SELECT c.*, 
      MAX(s.precio) as pMax, 
      MIN(s.precio) as pMin, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
       ROUND(AVG(ec.puntuacion),2) as rate, 
      ( 6371 * acos( cos( radians(?) ) * cos( radians( c.latitud ) ) 
   * cos( radians(c.longitud) - radians(?)) + sin(radians(?)) 
   * sin( radians(c.latitud)))) AS distance 
      FROM servicio as s, centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro
      WHERE c.idCentro = s.idCentro 
      AND s.idSubcategoria IN (`+req.body.idSubcategoria.toString()+`)  
      AND s.estado = 1   
      GROUP BY c.idCentro HAVING distance < 35`,[req.body.lat, req.body.lon, req.body.lat])
      .then((data) => {
        if (!data) res.send().status(500);

        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });






  expressApp.post('/sgetCentrosMapa', (req, res) => {

    console.log(req.body);
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
      AND s.estado = 1 AND s.idSubcategoria IN (`+req.body.idSubcategoria+`) AND c.latitud IS NOT NULL AND c.longitud IS NOT NULL 
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
    c.idCentro, c.nombre as nombreCentro, c.idFoto, s.nombre as nombreServicio, s.duracion as duracionServicio, s.idServicio, s.idCategoria, s.idSubcategoria, s.precio as precioServicio   
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


  expressApp.post('/getEmpleadoServicios', (req, res) => {
    db(`SELECT s.*, c.nombre as nombreCategoria 
      FROM servicio as s, categoria as c 
      WHERE c.idCategoria = s.idCategoria 
      AND s.idServicio 
      IN (SELECT f.idServicio FROM servicioEmpleado as f 
      WHERE f.idEmpleado = ? AND f.estado = 1)`,[req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        var groups = _.groupBy(data, 'idCategoria');
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
    db(`SELECT ec.idEvaluacionCentro, ec.servicio, 
      ec.staff, ec.precio,ec.limpieza,ec.ambiente, ec.estado, 
      ec.comentario, ec.respuestaCentro,ec.puntuacion, ec.fechaCreacion, ci.idCita, c.nombre, c.idFoto, ci.horaFinalEsperado, ci.precioEsperado
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



  expressApp.post('/getInfoCentroNC', (req, res) => {
     Promise.all([
    db(`SELECT c.nombre,c.direccion,c.idFoto, 
       (SELECT COUNT(r.idCita) FROM cita as r WHERE r.idCentro = c.idCentro AND r.idCliente <> 0) as total, (SELECT COUNT(d.idCita) FROM cita as d WHERE d.idCentro = c.idCentro AND d.estado = 3 AND d.idCliente <> 0) as completadas,
      (SELECT COUNT(d.idCita) FROM cita as d WHERE d.idCentro = c.idCentro AND d.estado = 4 AND d.idCliente <> 0) as canceladas,
      (SELECT COUNT(d.idCita) FROM cita as d WHERE d.idCentro = c.idCentro AND d.estado = 2 AND d.idCliente <> 0) as confirmadas  
      FROM  centro as c  
      WHERE c.idCentro = ?`,[req.body.idCentro]), 
    db(`SELECT s.nombre, cc.nombre as nombreCategoria, cc.idFoto, 
      sc.idServicio, COUNT(sc.idServicioCita) as cantidad 
      FROM categoria as cc, servicio as s, servicio_cita as sc 
      INNER JOIN cita as c ON sc.idCita = c.idCita 
      AND c.idCentro = ? AND c.idCliente <> 0 AND c.estado = 3 
      WHERE s.idServicio = sc.idServicio 
      AND cc.idCategoria = s.idCategoria 
      GROUP BY sc.idServicio 
      ORDER BY cantidad DESC LIMIT 5`,[req.body.idCentro]),
    db(`SELECT  ROUND(SUM(r.precioEsperado), 2) as total, ROUND(AVG(r.precioEsperado), 2) as promedio 
      FROM cita as r WHERE r.idCentro = ? AND r.estado = 3 AND r.idCliente <> 0`,[req.body.idCentro])])
      .then((data) => {

        if (!data) res.send().status(500);

        return res.send({info:data[0],clientes:data[1], dataV:data[2]});


      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/getCentroInfo', (req, res) => {


     if( req.body.numDia==0){ssdd=6;}
  else{ssdd=req.body.numDia-1;}


     Promise.all([
    db(`SELECT c.*, 
      COUNT(DISTINCT ec.puntuacion) as cantRate, 
      AVG(ec.puntuacion) as rate, 
      (SELECT CONCAT(DATE_FORMAT(xxz.horaAbrir, '%l:%i  %p'), ' - ', DATE_FORMAT(xxz.horaCerrar, '%l:%i   %p')) FROM horarioCentro as xxz WHERE xxz.idCentro = ? AND xxz.diaSemana = ? AND xxz.estado = 1) as horarioHoy,
      (SELECT idUsuarioFavorito 
      FROM usuario_favorito WHERE idCentro = ? AND idCliente = ? AND estado = 1) as favorito
      FROM  centro as c LEFT JOIN evaluacionCentro as ec ON ec.idCentro = c.idCentro WHERE c.idCentro = ?
      GROUP BY c.idCentro`,[req.body.idCentro,ssdd,req.body.idCentro, req.body.idCliente, req.body.idCentro]), 
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, c.idFoto as imagenCategoria, c.nombre as nombreCategoria, 
      (SELECT co.precioOferta FROM control_oferta AS co WHERE co.idServicio = s.idServicio AND co.idCentro = ? AND co.fechaCaducidad > CURRENT_TIMESTAMP LIMIT 1) as oferta  
      FROM servicio as s, categoria as c 
      WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCentro,req.body.idCentro]),
    db(`SELECT ev.*, u.nombre as nombreUsuario, u.idFoto as fotoUsuario, u.imagenFb as fotoFb   
      FROM evaluacionCentro as ev, cliente as u, cita as c 
      WHERE ev.idCentro = ? AND u.idCliente = c.idCliente AND c.idCliente <> 0 AND c.idCita = ev.idCita ORDER BY ev.fechaCreacion DESC`,[req.body.idCentro]),
    db(`SELECT c.*, cl.idCuponCliente,
(SELECT GROUP_CONCAT(DISTINCT cs.idServicio SEPARATOR ', ')
FROM cupon_servicio as cs WHERE cs.idCuponCentro=d.idCuponCentro GROUP BY NULL) as serviciosCupon
     FROM cupon as c 
      INNER JOIN cupon_centro as d ON ( d.idCupon = c.idCupon  AND d.idCentro = ?) 
      INNER JOIN cupon_cliente as cl ON (c.idCupon = cl.idCupon AND cl.idCliente = ? AND cl.estado = 1) 
WHERE  c.fechaExpira > CURRENT_TIMESTAMP AND c.estado = 1  ORDER BY c.porcentajeDescuento DESC LIMIT 1`,[req.body.idCentro,req.body.idCliente]),
    db(`SELECT DATE_FORMAT(horaAbrir, '%l:%i   %p') as horaAbrir, 
      DATE_FORMAT(horaCerrar, '%l:%i   %p') as horaCerrar, estado, diaSemana FROM  
      horarioCentro WHERE idCentro = ?`,[req.body.idCentro])])
      .then((data) => {

        if (!data) res.send().status(500);

        let comentarios = data[2].map((i, index) => {
          //console.log(i);

        i.timeAgo =  moment(i.fechaCreacion).fromNow();
         console.log(i);
        return i;});


       

        var groups = _.groupBy(data[1], 'nombreCategoria');
        return res.send({info:data[0],servicios:groups, comentarios:comentarios, cupon:data[3],
          horario:data[4]});
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

    let idCita=null;
    let cliR = req.body.clienteReferencia || null;
      let idPaquete = req.body.idPaquete || null;

    Promise.all([db(`INSERT INTO cita (idCentro, idCliente, horaInicio, horaFinalEsperado, precioEsperado,
      notaCita, estado,idCuponCliente, clienteReferencia, idPaquete ) 
        VALUES (?,?,?,?,?,?,(SELECT (CASE WHEN (confirmacionAutomatica = 1)
         THEN 2 ELSE 1 END ) FROM configuracionCentro WHERE idCentro = ? LIMIT 1),?,?,?)
        `,[req.body.idCentro, req.body.idCliente,req.body.fechaInicio,
        req.body.fechaFinal,req.body.total, (req.body.notaCita || ' '), req.body.idCentro, req.body.idCuponCliente, cliR,idPaquete]),
        db(`SELECT confirmacionAutomatica FROM configuracionCentro WHERE idCentro = ? LIMIT 1`,[req.body.idCentro])])
      .then((data) => {
        console.log(data);
        if (!data) {
          res.send().status(500);
        }


        let arrayFunctions = [];
        idCita = data[0].insertId;
        //

        if(req.body.idCuponCliente && req.body.idCuponCliente>0){

      arrayFunctions.push(db(`UPDATE cupon_cliente set estado=2 WHERE idCuponCliente = ?`,[req.body.idCuponCliente]));

        }

        var confirmacionLista=[];

        req.body.servicios.forEach((elementw, index) => {

          var horaI = req.body.fecha+' '+elementw.inicio;
             var horaF = req.body.fecha+' '+elementw.fin;
            arrayFunctions.push(db(`INSERT INTO servicio_cita (idCita, idServicio, estado,precioCobrado,
              idEmpleado,horaInicio, horaFin) 
            VALUES (?,?,(SELECT confirmacionAutomatica FROM configuracionCentro WHERE idCentro = ? LIMIT 1),?,?,?,?)
            `,[data[0].insertId, elementw.idServicio,req.body.idCentro,(parseFloat(elementw.precioFinal) || 0),
            elementw.empleadoSeleccionado.idEmpleado,horaI, horaF]));

            confirmacionLista.push(elementw.empleadoSeleccionado.idEmpleado);

          });

          var confir = data[1][0].confirmacionAutomatica || 0;
          var idCitaAdded=data[0].insertId;



        //(req.body.fechaInicio)
      Promise.all(arrayFunctions).then((dataas) => {
        if (!dataas) res.send().status(500);

           var listaPush = _.uniq(confirmacionLista);
           var fecha = req.body.fechaInicio.split(' ')[0];
           listaPush.forEach((elementw, index) => {
            var cant = confirmacionLista.filter(word => word == elementw).length;

            console.log(elementw, cant,1,req.body.fechaInicio,idCitaAdded);
            enviarPushEmpleados(elementw, cant,1,fecha,idCitaAdded);
          });

         return res.send({insertId:idCita });
      }).catch(err => res.send(err).status(500));


        //return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/addCitaManual', (req, res) => {

    let idCita=null;
    let cliR = req.body.clienteReferencia || null;
      let idPaquete = req.body.idPaquete || null;

    db(`INSERT INTO cita (idCentro, idCliente, horaInicio, horaFinalEsperado, precioEsperado,
      notaCita, estado,idCuponCliente, clienteReferencia, idPaquete ) 
        VALUES (?,?,?,?,?,?,?,?,?,?)
        `,[req.body.idCentro, req.body.idCliente,req.body.fechaInicio,
        req.body.fechaFinal,req.body.total, (req.body.notaCita || ' '), 2, req.body.idCuponCliente, cliR,idPaquete])
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

          var horaI = req.body.fecha+' '+elementw.inicio;
             var horaF = req.body.fecha+' '+elementw.fin;
            arrayFunctions.push(db(`INSERT INTO servicio_cita (idCita, idServicio, estado,precioCobrado,
              idEmpleado,horaInicio, horaFin) 
            VALUES (?,?,1,?,?,?,?)
            `,[data.insertId, elementw.idServicio,(parseFloat(elementw.precioFinal) || 0),
            elementw.empleadoSeleccionado.idEmpleado,horaI, horaF]));

          });
      Promise.all(arrayFunctions).then((data) => {
        if (!data) res.send().status(500);
         return res.send({insertId:idCita });
      }).catch(err => res.send(err).status(500));


        //return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/addCitaManual2', (req, res) => {

    let idCita=null;
    let cliR = req.body.clienteReferencia || null;


    db(`INSERT INTO cita (idCentro, idCliente, horaInicio, horaFinalEsperado, precioEsperado,
      notaCita, estado, clienteReferencia) 
        VALUES ((SELECT idCentro FROM empleado WHERE idEmpleado = ? LIMIT 1),?,?,?,?,?,?,?)
        `,[req.body.idEmpleado, req.body.idCliente,req.body.fechaInicio,
        req.body.fechaFinal,req.body.total, (req.body.notaCita || ' '), 2, cliR])
      .then((data) => {
        console.log(data);
        if (!data) {
          res.send().status(500);
        }


        let arrayFunctions = [];
        idCita = data.insertId;
        //


        req.body.servicios.forEach((elementw, index) => {

          var horaI = elementw.inicio+':00';
             var horaF = elementw.fin+':00';
            arrayFunctions.push(db(`INSERT INTO servicio_cita (idCita, idServicio, estado,precioCobrado,
              idEmpleado,horaInicio, horaFin) 
            VALUES (?,?,1,?,?,?,?)
            `,[data.insertId, elementw.idServicio,(parseFloat(elementw.precioFinal) || 0),
            req.body.idEmpleado,horaI, horaF]));

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
    db(`SELECT TIMEDIFF(ci.horaInicio,CONVERT_TZ(now(),'+00:00','-05:00')) > 
      CONCAT((SELECT parametro3 FROM configuracionCentro WHERE idCentro = c.idCentro),':00:00') as difT,
      c.idCentro,xcli.nombre as nombreCliente, c.nombre, c.direccion, c.idFoto, c.telefono,c.latitud, c.longitud, vv.nombre as nombreEmpleado, 
      ci.idCita, ci.estado, ci.comentarioCita, ci.notaCita, ci.comentarioEstado, ci.idEmpleado, ci.horaInicio,
      ci.horaFinalEsperado,precioEsperado, ci.idCuponCliente, ci.idCliente, 
      (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = ci.idCuponCliente) as descuento 
      FROM cliente as xcli, centro as c, cita as ci LEFT JOIN empleado as vv ON vv.idEmpleado = ci.idEmpleado  
      WHERE ci.idCita = ? AND c.idCentro = ci.idCentro AND xcli.idCliente = ci.idCliente`,[req.body.idCita]),
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, sc.precioCobrado, sc.idCita, sc.idServicioCita, sc.horaInicio, sc.estado, sc.horaFin, s.idCategoria, e.idFoto as idFotoE, e.nombre as nombreEmpleado, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c, servicio_cita as sc, empleado as e   
      WHERE e.idEmpleado = sc.idEmpleado AND s.idServicio = sc.idServicio AND sc.idCita = ? AND c.idCategoria = s.idCategoria AND s.estado = 1`,[req.body.idCita]),
    db(`SELECT h.* FROM horarioCentro AS h INNER JOIN cita as c 
      ON c.idCentro = h.idCentro AND c.idCita = ?`,[req.body.idCita])
    ])
      .then((data) => {

        if (!data) res.send().status(500);
    //var groups = _.groupBy(data[0], 'nombreCategoria');
  
        return res.send({cita:data[0], servicios:data[1], horario:data[2]});
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getDataCitaAE', (req, res) => {
     Promise.all([
    db(`SELECT c.idCentro,xcli.nombre as nombreCliente, c.nombre, c.direccion, xcli.idFoto, c.telefono, 
      ci.idCita, ci.estado, ci.clienteReferencia, ci.notaCita, ci.comentarioEstado, ci.idEmpleado, ci.horaInicio,
      ci.horaFinalEsperado,precioEsperado, ci.idCuponCliente, ci.idCliente, 
      (SELECT cupon.porcentajeDescuento FROM cupon, cupon_cliente as gh 
      WHERE gh.idCupon = cupon.idCupon AND gh.idCuponCliente = ci.idCuponCliente) as descuento 
      FROM cliente as xcli, centro as c, cita as ci  
      WHERE ci.idCita = ? AND c.idCentro = ci.idCentro AND xcli.idCliente = ci.idCliente`,[req.body.idCita]),
    db(`SELECT s.idServicio, sc.estado, s.nombre, s.duracion, s.precio, sc.precioCobrado, sc.idCita,
     sc.idServicioCita,
     DAY(sc.horaInicio) as d, MONTH(sc.horaInicio) as m, YEAR(sc.horaInicio) as y, 
     HOUR(sc.horaInicio) as h, MINUTE(sc.horaInicio) as min,
      HOUR(sc.horaFin) as h2, MINUTE(sc.horaFin) as min2, s.idCategoria, e.idFoto as idFotoE,
      e.nombre as nombreEmpleado,sc.idEmpleado, c.nombre as nombreCategoria  
      FROM servicio as s, categoria as c, servicio_cita as sc, empleado as e   
      WHERE e.idEmpleado = sc.idEmpleado AND s.idServicio = sc.idServicio 
      AND sc.idCita = ? AND c.idCategoria = s.idCategoria 
      AND s.estado = 1`,[req.body.idCita])])
      .then((data) => {

        if (!data) res.send().status(500);
    //var groups = _.groupBy(data[0], 'nombreCategoria');
  
        return res.send({cita:data[0], servicios:data[1]});
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
    db(`SELECT s.idServicio, s.nombre, s.duracion, s.precio, s.idCategoria, s.idSubcategoria, s.descripcion, c.nombre as nombreCategoria  
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
      AND co.fechaCaducidad > CURRENT_TIMESTAMP LIMIT 1) as oferta, c.nombre as nombreCategoria, c.idFoto as imagenCategoria FROM servicio as ss, categoria as c  
      WHERE  ss.idCentro = ? AND c.idCategoria = ss.idCategoria 
      AND ss.estado = 1`,[req.body.idCentro, req.body.idCentro]),
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

      var groups = _.groupBy(data[0], 'idCategoria');


        return res.send({servicios:data[0], cupon: data[1],categorias:groups});
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
    db(`SELECT e.nombre, e.descripcion, e.telefono, e.password as pass, e.email, e.idFoto, e.estado, e.tipo, e.idEmpleado FROM empleado as e WHERE
       e.idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/getStaffIndi', (req, res) => {
    db(`SELECT e.nombre, e.descripcion, e.email, e.idFoto, e.estado, e.tipo, e.idEmpleado FROM empleado as e WHERE
       e.idEmpleado = ?`,[req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/getStaffBasicNC', (req, res) => {
    db(`SELECT e.nombre, c.idCentro, e.descripcion, e.email, e.idFoto, e.estado, e.tipo, e.idEmpleado FROM empleado as e,
    centro as c WHERE
       e.idEmpleado = ? 
       AND e.idCentro = c.idCentro`,[req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/getConfiguracionNC', (req, res) => {
    db(`SELECT * FROM configuracionCentro WHERE idCentro = ?`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/getEvaluacionesNC', (req, res) => {
    db(`SELECT ec.*,  DATE_FORMAT(ec.fechaCreacion,'%Y-%m-%d') as soloFecha, c.nombre as nombreCliente, c.idFoto FROM evaluacionCentro as ec, cliente as c, cita as r  
WHERE ec.idCentro = ? 
AND ec.estado = 2 
AND r.idCita = ec.idCita 
AND c.idCliente = r.idCliente ORDER BY ec.fechaCreacion DESC LIMIT 5 `,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/getEventosUserNC', (req, res) => {
    Promise.all([db(`SELECT (SELECT COUNT(DISTINCT idServicioCita) 
      FROM servicio_cita WHERE DATE(horaInicio) =  DATE(sc.horaInicio) 
      AND idEmpleado = ? AND estado = 0) as pendientes,cli.nombre as nombreCliente, s.nombre as nombreServicio,
DAY(sc.horaInicio) as d, MONTH(sc.horaInicio) as m, YEAR(sc.horaInicio) as y, HOUR(sc.horaInicio) as h, MINUTE(sc.horaInicio) as min,
 HOUR(sc.horaFin) as h2, MINUTE(sc.horaFin) as min2,
sc.idCita, sc.estado, c.clienteReferencia, c.estado as estadoCita FROM cliente as cli, servicio as s, servicio_cita as sc, cita as c 
WHERE cli.idCliente = c.idCliente AND c.idCita = sc.idCita AND sc.idServicio = s.idServicio 
AND sc.idEmpleado = ? ORDER BY FIELD(sc.estado,0) DESC, 
sc.horaInicio DESC`,[req.body.idEmpleado,req.body.idEmpleado]),
    db(`SELECT rm.*, 
    DAY(rm.horaInicio) as d, MONTH(rm.horaInicio) as m, 
    YEAR(rm.horaInicio) as y, HOUR(rm.horaInicio) as h, 
    MINUTE(rm.horaInicio) as min,
    HOUR(rm.horaFinalEsperado) as h2, MINUTE(rm.horaFinalEsperado) as min2 
    FROM reservaManual as rm WHERE rm.idEmpleado = ?`,[req.body.idEmpleado])])
      .then((data) => {
        if (!data) res.send().status(500);

        var arrayM = data[0].concat(data[1]);

        return res.send(arrayM);
      }).catch(err => res.send(err).status(500));
  });



        expressApp.post('/getInfoEvaNC', (req, res) => {
    db(`SELECT AVG(puntuacion) as puntuacion,
    AVG(servicio) as servicio,
    AVG(staff) as staff,
    AVG(precio) as precio,
    AVG(limpieza) as limpieza,
    AVG(ambiente) as ambiente,
     COUNT(idEvaluacionCentro) as cantidad 
      FROM evaluacionCentro WHERE idCentro = ? AND estado = 2`,[req.body.idCentro])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/getEvaluacionesPeriodoNC', (req, res) => {
    db(`SELECT ec.*,  DATE_FORMAT(ec.fechaCreacion,'%Y-%m-%d') as soloFecha, c.nombre as nombreCliente, c.idFoto FROM evaluacionCentro as ec, cliente as c, cita as r  
WHERE ec.idCentro = ? 
AND ec.estado = 2 
AND r.idCita = ec.idCita 
AND (ec.fechaCreacion BETWEEN ? AND ? )
AND c.idCliente = r.idCliente ORDER BY ec.fechaCreacion `,[req.body.idCentro, req.body.inicio, req.body.fin])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/editarStafNC', (req, res) => {

      var tipo = parseInt(req.body.tipo);
      var telefono = req.body.telefono || '';

    db(`UPDATE empleado set nombre = ?, password = ?, telefono = ?, email = ?, descripcion=?, tipo=? 
      WHERE idEmpleado = ?`,[req.body.nombre,req.body.pass,telefono,req.body.email,
      req.body.descripcion,tipo,req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/eliminarStaff', (req, res) => {
    db(`DELETE FROM empleado  
      WHERE idEmpleado = ?`,[req.body.idEmpleado])
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

    expressApp.post('/getHorarioNC', (req, res) => {
    Promise.all([db(`SELECT * FROM horarioCentro WHERE idCentro = ?`,[req.body.idCentro]),
      db(`SELECT idHorarioEspecial, DATE_FORMAT(horaAbrir, '%l:%i  %p') as horaAbrir,DATE_FORMAT(horaCerrar, '%l:%i  %p') as horaCerrar,
idCentro,fecha,abierto,estado,fechaCreacion,timespan FROM horario_especial WHERE idCentro = ?`,[req.body.idCentro])]).then((data) => {
        if (!data) res.send().status(500);
              return res.send({horario:data[0],horarioEspecial: data[1]});
      }).catch(err => res.send(err).status(500));
  });



    expressApp.post('/getCentroInfoNC', (req, res) => {
   db(`SELECT idCentro, nombre, telefono, fbLink, imagenBanner, idFoto, sobreNosotros, direccion, latitud, longitud 
     FROM centro WHERE idCentro = ?`,[req.body.idCentro]).then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });


   expressApp.post('/updateCICN', (req, res) => {

      var direccion = req.body.direccion || '';
      var telefono = req.body.telefono || '';
        var nombre = req.body.nombre || '';
       var fbLink = req.body.fbLink || '';
           var sobreNosotros = req.body.sobreNosotros || '';

    db(`UPDATE centro set nombre = ?, telefono = ?, direccion = ?, fbLink=?, latitud=?, longitud=?, sobreNosotros=?  
      WHERE idCentro = ?`,[nombre,telefono,direccion,
      fbLink,req.body.latitud,req.body.longitud,sobreNosotros,req.body.idCentro])
      .then((data) => {
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


        expressApp.post('/guardarHorarioCentroNC', function(req, res) {

              var insertQ = ''; 
              var idCentro = req.body.idCentro;

              req.body.horario.forEach((item, index)=>{

              var horaEntrar = item.horaAbrir || '00:00:00';
              var horaSalir = item.horaCerrar || '00:00:00';
              var estado = item.estado ? 1 : 0;

              if(index==0){
              insertQ+= '('+idCentro+','+item.diaSemana+',"'+horaEntrar+'","'+horaSalir+'",'+estado+')';
              }
              else{
              insertQ+= ',('+idCentro+','+item.diaSemana+',"'+horaEntrar+'","'+horaSalir+'",'+estado+')';
              }
              });



    db(`INSERT INTO horarioCentro(idCentro,diaSemana,horaAbrir, horaCerrar, estado) 
      VALUES `+insertQ+` ON DUPLICATE KEY UPDATE horaAbrir=VALUES(horaAbrir),
      horaCerrar=VALUES(horaCerrar), estado=VALUES(estado)`)
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/guardarHorarioNC', function(req, res) {

              var insertQ = ''; 
              var idEmpleado = req.body.idEmpleado;

              req.body.horario.forEach((item, index)=>{

              var horaEntrar = item.horaEntrar || '00:00:00';
              var horaSalir = item.horaSalir || '00:00:00';
              var estado = item.estado ? 1 : 0;

              if(index==0){
              insertQ+= '('+idEmpleado+','+item.diaSemana+',"'+horaEntrar+'","'+horaSalir+'",'+estado+')';
              }
              else{
              insertQ+= ',('+idEmpleado+','+item.diaSemana+',"'+horaEntrar+'","'+horaSalir+'",'+estado+')';
              }
              });



    db(`INSERT INTO horarioEmpleado(idEmpleado,diaSemana,horaEntrar, horaSalir, estado) 
      VALUES `+insertQ+` ON DUPLICATE KEY UPDATE horaEntrar=VALUES(horaEntrar),
      horaSalir=VALUES(horaSalir), estado=VALUES(estado)`)
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/cambiarEstadoSE', function(req, res) {

    db(`INSERT INTO servicioEmpleado(idServicio,idEmpleado,estado) 
      VALUES(?, ?,?) ON DUPLICATE KEY UPDATE estado=VALUES(estado)`,[req.body.idServicio,req.body.idEmpleado,req.body.estado])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/addDiasLibresNC', function(req, res) {

    db(`INSERT INTO empleadoBloqueLibre(idEmpleado,fechaInicio,fechaFinal) 
      VALUES(?,?,?)`,[req.body.idEmpleado,req.body.inicio,req.body.fin])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


              expressApp.post('/agregarHENC', function(req, res) {

                    var insertQ = ''; 
                    var horaI = req.body.horaAbrir || '00:00:00';
                     var horaF = req.body.horaCerrar || '00:00:00';

    req.body.fecha.forEach((item, index)=>{


    if(index==0){
    insertQ +='('+req.body.idCentro+',"'+horaI+'","'+horaF+'","'+item+'",'+req.body.estado+','+req.body.timespan+')';
    }
    else{
   insertQ +=',('+req.body.idCentro+',"'+horaI+'","'+horaF+'","'+item+'",'+req.body.estado+','+req.body.timespan+')';
    }
    });



    db(`INSERT INTO horario_especial(idCentro,horaAbrir,horaCerrar,fecha,abierto,timespan) 
      VALUES `+insertQ)
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });






              expressApp.post('/agregarHEENC', function(req, res) {

                    var insertQ = ''; 
                    var horaI = req.body.horaAbrir ? req.body.horaAbrir+':00' : '00:00:00';
                     var horaF = req.body.horaCerrar ? req.body.horaCerrar+':00' : '00:00:00';

    req.body.fecha.forEach((item, index)=>{


    if(index==0){
    insertQ +='('+req.body.idEmpleado+',"'+horaI+'","'+horaF+'","'+item+'",'+req.body.estado+')';
    }
    else{
   insertQ +=',('+req.body.idEmpleado+',"'+horaI+'","'+horaF+'","'+item+'",'+req.body.estado+')';
    }
    });



    db(`INSERT INTO horario_especial_empleado(idEmpleado,horaEntrar,horaSalir,fecha,abierto) 
      VALUES `+insertQ)
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });





    expressApp.post('/deleteLibresNC', function(req, res) {

    db(`DELETE FROM empleadoBloqueLibre WHERE 
      idEmpleadoBloqueLibre = ?`,[req.body.idEmpleadoBloqueLibre])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


    expressApp.post('/eliminarHE', function(req, res) {

    db(`DELETE FROM horario_especial_empleado WHERE 
      idHorarioEspecialEmpleado = ?`,[req.body.id])
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

        expressApp.post('/verificarEmail', function(req, res) {

    db(`SELECT email FROM usuario_consola WHERE  email = ?`,[req.body.email]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/verificarEmail2', function(req, res) {

    db(`SELECT email FROM empleado WHERE  email = ?`,[req.body.email]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/verificarEmail3', function(req, res) {

    db(`SELECT email FROM cliente WHERE  email = ?`,[req.body.email]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/goReserva', function(req, res) {

    db(`SELECT idCita FROM cita WHERE  idCita = ? AND idCentro = ?`,[req.body.idCita,req.body.idCentro]).then((data) => {
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

    expressApp.post('/getInfoEmpleadoNC', function(req, res) {

    Promise.all([db(`SELECT s.idServicio, s.idCentro, s.idCategoria, 
      s.idSubcategoria, s.nombre, s.duracion, s.precio, c.nombre as nombreCategoria, 
      (SELECT se.idServicioEmpleado FROM servicioEmpleado as se 
      WHERE se.idServicio = s.idServicio AND se.idEmpleado = ? AND se.estado = 1) as idServicioEmpleado 
      FROM servicio as s, categoria as c WHERE s.idCentro = ? AND c.idCategoria = s.idCategoria`,[req.body.idEmpleado, req.body.idCentro]),
      db(`SELECT * FROM horarioEmpleado WHERE idEmpleado = ?`,[req.body.idEmpleado]),
      db(`SELECT *, TIME_FORMAT(horaEntrar, '%h:%i%p') as horaFI, 
TIME_FORMAT(horaSalir, '%h:%i%p') as horaFF FROM horario_especial_empleado WHERE idEmpleado = ? AND 
        CURDATE() <= fecha`,[req.body.idEmpleado])])
      .then((data) => {
         if (!data) res.send().status(500);

        var groups = _.groupBy(data[0], 'nombreCategoria');

        return res.send({servicios:groups,horario:data[1],horarioEspecial:data[2]});

      }).catch(err => res.send(err).status(500));
  });

    expressApp.post('/getInfoEmpleadoAE', function(req, res) {

    Promise.all([db(`SELECT * FROM horarioEmpleado WHERE idEmpleado = ?`,[req.body.idEmpleado]),
      db(`SELECT *, TIME_FORMAT(horaEntrar, '%h:%i%p') as horaFI, 
TIME_FORMAT(horaSalir, '%h:%i%p') as horaFF FROM horario_especial_empleado WHERE idEmpleado = ? AND 
        CURDATE() <= fecha`,[req.body.idEmpleado])])
      .then((data) => {
         if (!data) res.send().status(500);

        return res.send({horario:data[0],horarioEspecial:data[1]});

      }).catch(err => res.send(err).status(500));
  });





        expressApp.post('/nuevoUsuarioNC', function(req, res) {

          var nombreFactura = req.body.nombreFactura || ''; 
          var ruc = req.body.ruc || ''; 

   db(`INSERT INTO usuario_consola(email,nombre,tipo,password, nombreTitular,pasos,nombreFactura, ruc) 
      VALUES(?, ?,1,?,?,1,?,?)`,[req.body.correoElectronico,req.body.nombreNegocio,req.body.password,req.body.nombreUsuario,nombreFactura,ruc])
      .then((data) => {

        console.log(data.Error);
         if (!data) res.send().status(500);
         else{

          db(`INSERT INTO centro(nombre,email,nombreTitular,webAccess) 
      VALUES(?, ?,?,?)`,[req.body.nombreNegocio,req.body.correoElectronico,req.body.nombreUsuario, req.body.accesoweb]).then((datas) => {
          
          if(datas.affectedRows>0){

            var linkAcc= req.body.accesoweb+'.yourbeauty.com.pa';
            enviarEmailHTML(req.body.correoElectronico,req.body.nombreUsuario,linkAcc,req.body.correoElectronico,req.body.password);
/*
                  var numss='123456789';

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
          from: 'yourBeautyMessageCenter@gmail.com', // sender address
          to: req.body.correoElectronico, // list of receivers
          subject: 'Cuenta YourBeauty creada', // Subject line
          text: 'Felicidades! Hemos creado tu cuenta de negocio YourBeauty.\n Usuario:'+req.body.correoElectronico+' Contraseña:'+req.body.password
          };

          // send mail with defined transport object
          transporter.sendMail(mailOptions, (error, info) => {

          if(error){
          console.log('Error send email occured');
          console.log(error.message);
          }
          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
          // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
          });
          });
*/

          }
          return res.send(datas);

      }).catch(err => res.send(err).status(500));;

         }
       



      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/addStaffNC', function(req, res) {
          var idCentro = req.body[0].idCentro;
    var insertQ = ''; 
    var dataFE = req.body;
    req.body.forEach((item, index)=>{

        var clave = makeid();
      dataFE[index].clave = clave;
      var tel = item.telefono || ' ';
      if(index==0){
    insertQ +='('+item.idCentro+',"'+clave+'"'+',"'+item.nombre+'",'+item.tipo+',"'+item.descripcion+'","'+tel+'","'+item.email+'")';
       }
       else{
          insertQ +=', ('+item.idCentro+',"'+clave+'"'+',"'+item.nombre+'",'+item.tipo+',"'+item.descripcion+'","'+tel+'","'+item.email+'")';
       }
    });


    Promise.all([db(`INSERT INTO empleado(idCentro,password,nombre,tipo,descripcion,telefono,email) VALUES `+insertQ+` `),
      db(`INSERT INTO horarioEmpleado(diaSemana,horaEntrar,horaSalir,estado,idEmpleado) 
SELECT 0, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ? UNION ALL 
 SELECT 1, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ?  UNION ALL 
 SELECT 2, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ?  UNION ALL 
 SELECT 3, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ?  UNION ALL 
 SELECT 4, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ?  UNION ALL 
 SELECT 5, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ?  UNION ALL 
 SELECT 6, '00:00:00', '00:00:00', 0, e.idEmpleado FROM empleado as e
 WHERE e.idCentro = ?`,[idCentro,idCentro,idCentro,idCentro,idCentro,idCentro,idCentro]),
db(`UPDATE usuario_consola set pasos=2  WHERE email = (SELECT email FROM centro WHERE idCentro = ?)`,[idCentro]),
db(`SELECT nombre FROM centro WHERE idCentro = ?`,[idCentro])])
      .then((data) => {
         if (!data) res.send().status(500);


          dataFE.forEach((item, index)=>{
          
           
           enviarEmailStaff(item.email, item.clave,item.nombre, data[3][0].nombre);
        
    
          });

        
        return res.send(data[0]);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/addStaffNC2', function(req, res) {
 var clave = makeid();
          var telefono = req.body.telefono || '';
     Promise.all([db(`INSERT INTO empleado(idCentro,nombre,tipo,descripcion,telefono,email, password) 
      VALUES (?,?,?,?,?,?,?)`,[req.body.idCentro,req.body.nombre,req.body.tipo,
      req.body.descripcion,telefono,req.body.email,clave]),
    db(`SELECT nombre FROM centro WHERE idCentro = ?`,[req.body.idCentro])])
      .then((data) => {
         if (!data) res.send().status(500);

          
           //enviarEmailStaff(req.body.email, clave);
           enviarEmailStaff(req.body.email, clave,req.body.nombre,data[1][0].nombre);
        return res.send(data[0]);

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/configuracionCentroNC', function(req, res) {

    Promise.all([db(`INSERT INTO configuracionCentro(idCentro,confirmacionAutomatica, parametro1,
      parametro2,parametro3) 
      VALUES (?,?,?,?,?)`,[req.body.idCentro,req.body.confAuto,req.body.parametro1,
      req.body.parametro2,req.body.parametro3]),
     db(`UPDATE usuario_consola set pasos=7 
        WHERE email = (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.idCentro])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data[0]);

      }).catch(err => res.send(err).status(500));
  });




        expressApp.post('/configuracionPrecioNC', function(req, res) {

  db(`UPDATE usuario_consola set pasos=10, plan=?  
        WHERE email = (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.plan, req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


        expressApp.post('/UpdateconfiguracionCentroNC', function(req, res) {

    db(`INSERT INTO configuracionCentro (confirmacionAutomatica, parametro1, parametro2, parametro3, idCentro)
      VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE confirmacionAutomatica=VALUES(confirmacionAutomatica), parametro1=VALUES(parametro1),
      parametro2=VALUES(parametro2),parametro3=VALUES(parametro3)`,[req.body.confirmacionAutomatica,req.body.parametro1,
      req.body.parametro2,req.body.parametro3,req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/addServicioNC', function(req, res) {

    var insertQ = ''; 
    var duracion = parseInt(req.body.duracionH) + parseInt(req.body.duracionM);
     db(`INSERT INTO servicio(idCentro, nombre, idCategoria, idSubcategoria, duracion, precio ) 
      VALUES (?,LOWER(?),?,?,?,?)`,[req.body.idCentro,req.body.nombreServicio,req.body.idCategoria,
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
    insertQ +='('+req.body.idCentro+',LOWER("'+item.nombreServicio+'"),'+item.categoriaServicio+','+item.subcategoriaServicio+','+(parseInt(item.minutoServicio)+parseInt(item.horaServicio))+','+item.precioServicio+',1)';
       }
       else{
          insertQ +=', ('+req.body.idCentro+',LOWER("'+item.nombreServicio+'"),'+item.categoriaServicio+','+item.subcategoriaServicio+','+(parseInt(item.minutoServicio)+parseInt(item.horaServicio))+','+item.precioServicio+',1)';
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
     db(`UPDATE centro set direccion = ?, sobreNosotros = ?, latitud=?, longitud=?,telefono=?,fbLink=?, estado=1  
      WHERE idCentro = ?`,
      [direccionC,req.body.descripcion,req.body.latitud,req.body.longitud,req.body.telefonoNegocio,req.body.webUsuario,req.body.idCentro]),
     db(`UPDATE horarioEmpleado as he, horarioCentro as hc set he.horaEntrar = hc.horaAbrir, he.horaSalir = hc.horaCerrar,he.estado = hc.estado   
WHERE he.diaSemana = hc.diaSemana AND he.idEmpleado IN (SELECT idEmpleado FROM empleado WHERE hc.idCentro = ?)`,
      [req.body.idCentro]),
      db(`UPDATE usuario_consola set pasos=3 WHERE email = (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.idCentro])])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data[1]);

      }).catch(err => res.send(err).status(500));

    }
    else{

      Promise.all([db(`UPDATE centro set direccion = ?,  sobreNosotros = ?, latitud=?, longitud=?,telefono=?,fbLink=?, estado=1  
      WHERE idCentro = ?`,
      [direccionC,req.body.descripcion,req.body.latitud,req.body.longitud,req.body.telefonoNegocio,req.body.webUsuario,req.body.idCentro]),
      db(`UPDATE usuario_consola set pasos=3 WHERE email = (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.idCentro])]).then((data) => {
         if (!data) res.send().status(500);
        return res.send(data[0]);

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


        expressApp.post('/updateStep', function(req, res) {

    db(`UPDATE usuario_consola set pasos=? 
        WHERE email = (SELECT email FROM centro WHERE idCentro = ?)`,[req.body.step,req.body.idCentro])
      .then((data) => {
         if (!data) res.send().status(500);
        return res.send(data);

      }).catch(err => res.send(err).status(500));
  });





    expressApp.post('/getServiciosCita', (req, res) => {
     Promise.all([db(`SELECT vv.precioEsperado, sc.idServicioCita, sc.estado, em.nombre as nombreEmpleado, sc.precioCobrado, CONCAT(DATE_FORMAT(sc.horaInicio, '%l:%i  %p'), ' - ', 
       DATE_FORMAT(sc.horaFin, '%l:%i  %p')) as horaCita,
        s.idServicio, s.nombre, s.duracion, s.precio,
        DATE_FORMAT(sc.horaInicio, '%d/%m/%y') as fechaCita, s.idCategoria, s.descripcion, c.nombre as nombreCategoria  
      FROM cita as vv, servicio as s, categoria as c, servicio_cita as sc, empleado as em   
      WHERE s.idServicio = sc.idServicio AND em.idEmpleado = sc.idEmpleado 
      AND sc.idCita = ? AND c.idCategoria = s.idCategoria AND vv.idCita = ? `,[req.body.idCita,req.body.idCita]),
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

    db(`SELECT c.idCentro, c.nombre as nombreCentro, u.idUsuarioConsola, u.email, u.nombreTitular, u.nombre, u.tipo, u.estado, u.pasos FROM usuario_consola as u, centro as c  
      WHERE u.email = ? AND u.password = ? AND c.email = u.email`,[req.body.email,req.body.password]).then((data) => {
      console.log(data);

      if (data[0].idUsuarioConsola) {

        var dataSend = data[0];

        if(data[0].pasos==10){
            dataSend.completo=true;
            dataSend.accessToken='access-token-' + Math.random();
            dataSend.refreshToken='access-token-' + Math.random();
            dataSend.roles=["ADMIN"];
        }
        else{
            dataSend.completo=false;
        }

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

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.idGenero, u.email, u.imagenFb, u.fechaNacimiento, u.genero,
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


        expressApp.post('/actualizarDataINL', (req, res) => {

    db(`SELECT u.idCliente, u.nombre, u.telefono, u.idGenero, u.email, u.imagenFb, u.fechaNacimiento, u.genero,
      u.fbId, u.idFoto, u.estado, COUNT(c.idCita) as completadas,
       (SELECT SUM(f.exp) FROM cita as f WHERE f.idCliente = u.idCliente AND f.estado = 3) as exp,
              (SELECT valor FROM parametros WHERE idParametro = 7) as appexp
        FROM cliente as u LEFT JOIN cita as c ON c.idCliente = u.idCliente AND c.estado = 3 
      WHERE u.idCliente = ?  GROUP BY u.idCliente`,[req.body.idCliente]).then((data) => {
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




        expressApp.post('/doLoginApiAE', (req, res) => {

    db(`SELECT e.idEmpleado, e.horarioSet, e.password, e.nombre as nombreEmpleado, 
      c.nombre as nombreCentro, e.email, e.idFoto,
      (SELECT g.estado FROM usuario_consola as g WHERE g.email = c.email) as centroActivo,
 e.descripcion, e.idCentro, e.tipo, e.telefono FROM empleado as e, centro as c  
 WHERE e.email = ? AND e.password = ? 
 AND c.idCentro = e.idCentro`,[req.body.username,req.body.password]).then((data) => {
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

      var hashEmail = makeid2();


    db(`INSERT INTO cliente(nombre,email,telefono,password, verificacionKey, estado) 
      VALUES(?, ?, ?, ?,?,?)`,[req.body.nombre,req.body.email,req.body.telefono,req.body.password,hashEmail,0]).then((data) => {


      var numss='123456789';
      if (data.insertId) {

          clientTwilo.messages.create({
          body: 'Codigo de verificacion YourBeauty: '+hashEmail,
          from: '+15154978942',
          to: '+507'+req.body.telefono
          })
          .then(message => console.log(message.sid))
          .done();


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

        expressApp.post('/horarioSet', (req, res) => {

    db(`UPDATE empleado set horarioSet = 0 WHERE idEmpleado = ?`,
      [req.body.idEmpleado]).then((data) => {
      console.log(data);
      if (data) {
       return res.send(data);
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
      VALUES(LOWER(?), ?, ?, ?, ?, ?, ?,?)`,[req.body.nombre,req.body.duracion,req.body.precio,req.body.estado,
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


    expressApp.post('/addPush2', (req, res) => {
    db(`INSERT INTO pushHandlerStaff (idEmpleado, so, pushKey, deviceID) 
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


  expressApp.post('/cerrarS2', (req, res) => {
    db(`UPDATE  pushHandlerStaff set logOut = CURRENT_TIMESTAMP WHERE idEmpleado = ?`,[req.body.idEmpleado])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

/*
var httpsServer = https.createServer(https_options, expressApp);
serverHttps.listen(8443, () => console.log(`Running on localhost:8443`));

*/
//(515) 497-8942
  expressApp.get('/test', (req, res) =>{
/*
    clientTwilo.messages.create({
     body: 'PruebaSMS Confirmar',
     from: '+15154978942',
     to: '+50769453583'
   })
  .then(message => console.log(message.sid))
  .done();
*/
testPush('dtJz9aj3ZfA:APA91bGjVrKAQKET_LjlBjMyI1smhxphNKB_3g0GgMSBTKwdmx_c09ba2IrmxNTeyj5H5EoqlEXqG3imP-jTEMP5zoapdKi8Uk1U8_WQPGiF5E_O6Mw3DpVWMysuixpRfGf9nIc_pchB');
     });

  expressApp.get('/test32', (req, res) =>{
/*
    clientTwilo.messages.create({
     body: 'PruebaSMS Confirmar',
     from: '+15154978942',
     to: '+50769453583'
   })
  .then(message => console.log(message.sid))
  .done();
*/
testPush('ebbOwnnvXeI:APA91bEwWsQJyqqEJ5IL19Wy9iynxwKlTcx47Y8EpBcHIGmxx5gB0WcO609GSc3RGMDZl66O5FmdMAXNkXYjfzp3v1BZhgZnJSfUp8pCWtczMD5nsv9ElYQrIU1OELXfYFyGOk8ueBgg');
     });


const server = http.createServer(expressApp);
const serverHttps = https.createServer(https_options,expressApp);

serverHttps.listen(8443, () => console.log(`Running on localhost:8443`));
server.listen(3000, () => console.log(`Running on localhost:3000`));



/*
  return expressApp.listen(
    3000,
    () => console.log('Connection has been established successfully.')
  );
*/

//};

//module.exports = app();
