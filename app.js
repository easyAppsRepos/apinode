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

var sender = new gcm.Sender('AIzaSyB9NRBjhypcU9QZursZiiJuGJMulaCjEmA');


const app = () => {
  const expressApp = express();
  expressApp.use(bodyParser.urlencoded({ extended: true }));
  expressApp.use(bodyParser.json());
expressApp.use(cors({origin: 'http://localhost:3000'}));





expressApp.set('views', path.join(__dirname, 'views'));
expressApp.set('view engine', 'jade');
//addUsuario
expressApp.use(express.static(path.join(__dirname, 'public')));


  expressApp.post('/addUsuario', (req, res) => {

// console.log(req.body);
    //var password = req.body.pass;
   // var salt = Bcrypt.genSaltSync();
   // console.log(password+'-'+ salt);
    //var encryptedPassword = Bcrypt.hashSync(password, salt);
    //,[req.body.email, req.body.pass,req.body.nombre,req.body.telefono]


    db(`INSERT INTO usuarios (email, pass, nombre) 
        VALUES (?,?,?)
        `,[req.body.email, req.body.pass,req.body.nombre])
      .then((data) => {
        console.log(data);
        if (!data) {res.send().status(500);}
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });

 expressApp.post('/addUserFb', (req, res) => {
console.log(req.body);
    db(`INSERT INTO usuarios (email, nombre, fbId, imagenUrl) 
        VALUES (?,?,?,?)
        `,[req.body.email, req.body.name, req.body.userID, req.body.picture])
      .then((data) => {
        console.log(data);
        if (!data) {res.send().status(500);}
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/doLogin', (req, res) => {
    db(`SELECT  idUsuario
        FROM usuarios 
        WHERE email = ? AND pass = ?
    `,[req.body.email, req.body.pass]).then((data) => {
      if (!data) res.send().status(500);
      return res.send({
        idUsuario: data[0].idUsuario,
        });
    }).catch(err => res.send(err).status(500));
  });


  expressApp.get('/:usuario', function(req, res) {
  res.render('index', { title: 'Busqueda de Imagenes', usuario: req.params.usuario });
  });




  expressApp.post('/cerrarSesion', (req, res) => {
    db(`UPDATE pushHandler SET logout = CURRENT_TIMESTAMP WHERE deviceID = ? AND idUsuario = ? AND logout IS NULL
        `,[req.body.device, req.body.user])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ data: data });
      }).catch(err => res.send(err).status(500));
  });


expressApp.get('/userlist', function(req, res) {
/*    var db = req.db;
    var collection = db.get('userlist');
    collection.find({},{},function(e,docs){
        res.json(docs);
    });*/


        db(`SELECT  *
        FROM usuarios`).then((data) => {
      console.log(data);
      res.json(data);

    }).catch(err => res.send(err).status(500));


});

expressApp.get('/getPublisTodas', function(req, res) {
/*    var db = req.db;
    var collection = db.get('userlist');
    collection.find({},{},function(e,docs){
        res.json(docs);
    });*/


        db(`SELECT  titulo,estadoPublicacion, idUsuario, fechaCreacion, idPublicacion
        FROM publicaciones`).then((data) => {
      console.log(data);
      res.json(data);

    }).catch(err => res.send(err).status(500));


});


    expressApp.post('/verificarFBLog', (req, res) => {
    db(`SELECT  idUsuario
        FROM usuarios 
        WHERE fbId = ? 
    `,[req.body.id]).then((data) => {
      console.log(data);
      console.log('dddddd333');
      console.log(data[0]);

      if (!data) res.send().status(500);
      return res.send({
        idUsuario: data[0].idUsuario
        });
    }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/recuperar', (req, res) => {

    
    const nueva = Math.random().toString(36).substr(2, 8);

    console.log(nueva);


    db(`UPDATE usuarios SET pass = ? WHERE email=?
        `,[nueva, req.body.email])
      .then((data) => {


        if (!data) {res.send().status(500);}
        else{

          var stringEmail =  "La clave de su cuenta en el app Ultra Doujinshi ha sido restablecida, su clave nueva es: "+nueva;
          console.log(nueva);
          mail({
            from: "Ultra Doujinshi <ultradoujinshi@gmail.com>", // sender address
            to: req.body.email, // list of receivers
            subject: "Recuperacion clave", // Subject line
            text: stringEmail
          });
        }


        return res.send({ data: data });
      }).catch(err => res.send(err).status(500));
  });



  expressApp.post('/buscar', (req, res) => {
    db(`SELECT *, 
        (SELECT i.urlImagen 
        FROM imagenesPublicaciones as i 
        WHERE i.idPublicacion = p.idPublicacion 
        ORDER BY i.fechaCreacion ASC LIMIT 1) as imagenUrl 
        FROM publicaciones as p 
        WHERE (descripcion LIKE '%${req.body.palabra}%'
           OR titulo LIKE '%${req.body.palabra}%') AND estadoPublicacion = 1 ORDER BY p.idPublicacion DESC 
    `).then((data) => {
      if (!data) res.send().status(500);
      return res.send(data.map(d => ({
        idPublicacion: d.idPublicacion,
        idUsuario: d.idUsuario,
        titulo: d.titulo,
       // descripcion: !d.descripcion || d.descripcion.slice(150),
       descripcion: d.descripcion,
        precio: d.precio,
        urlImagen: d.urlImagen
      })));
    }).catch(err => res.send(err).status(500));
  });

  // PublicationRoute
  expressApp.post('/getPublicaciones', (req, res) => {
    db(`SELECT *, 
        (SELECT i.urlImagen 
        FROM imagenesPublicaciones as i 
        WHERE i.idPublicacion = p.idPublicacion 
        ORDER BY i.fechaCreacion ASC LIMIT 1) as imagenUrl 
        FROM publicaciones as p 
        WHERE estadoPublicacion = 1 ORDER BY p.idPublicacion DESC 
    `).then((data) => {
      if (!data) res.send().status(500);
      return res.send(data.map(d => ({
        idPublicacion: d.idPublicacion,
        idUsuario: d.idUsuario,
        titulo: d.titulo,
       // descripcion: !d.descripcion || d.descripcion.slice(150),
       descripcion: d.descripcion,
        precio: d.precio,
        urlImagen: d.urlImagen
      })));
    }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getPublicacion/:idPublicacion', (req, res) => {
    db(`SELECT publicaciones.idPublicacion, publicaciones.idUsuario, titulo, descripcion, estadoComic, precio, fechaEdicion, estadoPublicacion, usuarios.nombre, imagenesPublicaciones.idImagenPublicacion , imagenesPublicaciones.urlImagen 
        FROM publicaciones 
        INNER JOIN usuarios ON (publicaciones.idUsuario = usuarios.idUsuario) 
        LEFT JOIN imagenesPublicaciones ON (publicaciones.idPublicacion = imagenesPublicaciones.idPublicacion) 
        WHERE publicaciones.idPublicacion = ${req.params.idPublicacion}
    `).then((data) => {
      if (!data) res.send().status(500);
      return res.send({
        idPublicacion: data[0].idPublicacion,
        idUsuario: data[0].idUsuario,
        titulo: data[0].titulo,
        descripcion: data[0].descripcion,
        estadoComic: data[0].estadoComic,
        precio: data[0].precio,
        fechaEdicion: data[0].fechaEdicion,
        nombre: data[0].nombre,
        imagenes: data.map(d =>
          ({ idImagenPublicacion: d.idImagenPublicacion, urlImagen: d.urlImagen })),
      });
    }).catch(err => res.send(err).status(500));
  });

/*  expressApp.post('/addPublicacion', (req, res) => {
    db('').then((data) => {
      if (!data) res.send().status(500);
      return res.send(data);
    }).catch(err => res.send(err).status(500));
  });*/

  // User Route
  expressApp.post('/getPerfil/:userId', (req, res) => {
    Promise.all([
      db(`SELECT u.nombre, u.idUsuario, u.fechaCreacion, u.email, u.imagenUrl, 
          (SELECT COUNT(p.idPublicacion) FROM publicaciones as p WHERE p.idUsuario = u.idUsuario AND p.estadoPublicacion = 2 ) as vendidos,  
          (SELECT COUNT(p.idPublicacion) FROM publicaciones as p WHERE p.idUsuario = u.idUsuario ) as publicados,
          (SELECT AVG(rating) FROM calificaciones WHERE idUsuarioRecibe = ${req.params.userId}) as calificacion,
          (SELECT COUNT(rating) FROM calificaciones WHERE idUsuarioRecibe = ${req.params.userId}) as comprados   
          FROM usuarios as u 
          WHERE idUsuario = ${req.params.userId}`),
      db(`SELECT * 
        FROM publicaciones  
        WHERE idUsuario = ${req.params.userId}
      `)
    ]).then((data) => {
      if (!data) res.send().status(500);
      return res.send({
        idUsuario: data[0][0].idUsuario,
        nombre: data[0][0].nombre,
        fechaCreacion: data[0][0].fechaCreacion,
        imagenUrl: data[0][0].imagenUrl,
        vendidos: data[0][0].vendidos,
        publicados: data[0][0].publicados,
        calificacion: data[0][0].calificacion,
        comprados: data[0][0].comprados,
        publicaciones: data[1].map(p => ({
          idPublicacion: p.idPublicacion,
          estadoPublicacion: p.estadoPublicacion,
          precio: p.precio,
          titulo: p.titulo,
          urlImagen: p.urlImagen,
        }))
      });
    }).catch(err => res.send(err).status(500));
  });



 // User Route
  expressApp.post('/calificarPublicacion', (req, res) => {
    Promise.all([
      db(`UPDATE publicaciones set estadoPublicacion=2 WHERE idPublicacion = ${req.body.idPublicacion}`),
      db(`INSERT INTO calificaciones (idPublicacion, idUsuarioRecibe, rating) 
        VALUES ( ${req.body.idPublicacion}, ${req.body.idUsuario}, ${req.body.calificacion})
      `)
    ]).then((data) => {
      if (!data) res.send().status(500);
      return res.send(data);
    }).catch(err => res.send(err).status(500));
  });

  



  // Chat Route
  expressApp.post('/getChats/:userId', (req, res) => {
    db(`SELECT u.idUsuario, u.nombre, u.imagenUrl,
        (SELECT COUNT(c.idMensaje) FROM mensajes as c 
        WHERE c.estadoMensaje =1 AND ((c.idEmisor = ${req.params.userId} || c.idReceptor = ${req.params.userId} ) && (c.idEmisor = u.idUsuario || c.idReceptor = u.idUsuario )) ) as sinLeer, 
        (SELECT n.fechaCreacion FROM mensajes as n WHERE ((n.idEmisor = ${req.params.userId} || n.idReceptor = ${req.params.userId} ) && (n.idEmisor = u.idUsuario || n.idReceptor = u.idUsuario )) ORDER BY n.fechaCreacion DESC LIMIT 1 ) as ultimoMensaje 
        FROM usuarios as u, mensajes as m  
        WHERE u.idUsuario != ${req.params.userId} AND ((m.idEmisor = ${req.params.userId} || m.idReceptor = ${req.params.userId} ) AND (m.idEmisor = u.idUsuario || m.idReceptor = u.idUsuario ))
        GROUP BY u.idUsuario`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/getMisPublicaciones/:userId', (req, res) => {
    db(`SELECT * 
        FROM publicaciones  
        WHERE idUsuario = ${req.params.userId} AND (estadoPublicacion = 1 OR estadoPublicacion = 3)`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });

  expressApp.post('/cambiarEstadoPubli', (req, res) => {
    db(`UPDATE publicaciones SET estadoPublicacion = ${req.body.estado} WHERE idPublicacion = ${req.body.idPublicacion}`)
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data);
      }).catch(err => res.send(err).status(500));
  });




  expressApp.post('/getChat/:user1Id/:user2Id', (req, res) => {
     Promise.all([
    db(`SELECT * 
        FROM mensajes 
        WHERE (idEmisor = ${req.params.user1Id} OR idReceptor = ${req.params.user1Id}) 
        AND (idEmisor = ${req.params.user2Id} OR idReceptor = ${req.params.user2Id}) 
        ORDER BY idMensaje ASC LIMIT 30 
        `), db(`UPDATE mensajes SET estadoMensaje=2 WHERE estadoMensaje = 1 AND  idReceptor = ${req.params.user2Id}  
        AND idEmisor = ${req.params.user1Id}`)])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send(data[0]);
      }).catch(err => res.send(err).status(500));
  });


  expressApp.get('/deleteuser/:idUsuario', function(req, res) {


     db(`DELETE FROM usuarios WHERE idUsuario = ${req.params.idUsuario}
        `)
      .then((data) => {

        if (!data) res.send({ msg:'error: '});
        return res.send({ msg: '' });

      }).catch(err => res.send(err).status(500));



  });

  expressApp.get('/deletepubli/:idPublicacion', function(req, res) {


     db(`DELETE FROM publicaciones WHERE idPublicacion = ${req.params.idPublicacion}
        `)
      .then((data) => {

        if (!data) res.send({ msg:'error: '});
        return res.send({ msg: '' });

      }).catch(err => res.send(err).status(500));



  });


  expressApp.post('/addMensaje', (req, res) => {
    db(`INSERT INTO mensajes (contenido, idEmisor, idReceptor) 
        VALUES (?, ?, ?)
        `,[req.body.contenido, req.body.idEmisor, req.body.idReceptor])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/addPush', (req, res) => {
    db(`INSERT INTO pushHandler (idUsuario, so, pushKey, deviceID) 
        VALUES (?, ?, ?, ?)
        `,[req.body.user, req.body.device, req.body.pushK, req.body.deviceId])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });


  expressApp.get('/enviarTexto/:palabraClave/:usuario', (req, res) => {

    //req.params.usuario

    Promise.all([
      db(`SELECT pushKey
        FROM pushHandler  
        WHERE  idUsuario = ${req.params.usuario}
      `)
    ]).then((data) => {

       console.log(data[0]);


      var registrationTokens = [];
        data[0].forEach(function(element) {
          console.log(element.pushKey);
          registrationTokens.push(element.pushKey);
        });


        if(registrationTokens.length > 0){
          console.log('d');
          var message = new gcm.Message({
              data: {
              key1: req.params.palabraClave
              },
              notification: {
                  title: "Nueva Palabra",
                  icon: "ic_launcher",
                  body: " "
              }
          });

          sender.sendNoRetry(message, { registrationTokens: registrationTokens }, function(err, response) {
                  if(err) console.error(err);
                  else    console.log(response);
                });

        }

      if (!data) res.send().status(500);
      return res.send({ insertId: 1 });

    }).catch(err => res.send(err).status(500));

  });



  expressApp.post('/cambiarFotoPerfil',upload.single('file'), (req, res) => {
   
//console.log(req.body.idUsuario);
console.log('**************');
    //console.log(req.file);
var nombreV = 'user'+req.body.idUsuario;
    //console.log(req.body);
    //var img = req.file;
   // res.send({ insertId: data.insertId });

    amazonS3.uploadFile({name: nombreV, body: req.file.buffer}).then(function(data){
        if (!data) res.send().status(500);
        return res.send(data);
    }).catch(err => res.send(err).status(500));

   });


  expressApp.post('/publicarComic', (req, res) => {
    db(`INSERT INTO publicaciones (idUsuario, titulo, descripcion, precio, estadoComic, fechaEdicion) 
        VALUES (?, ?, ?, ?, ?, ?)
        `,[req.body.idUsuario, req.body.nombre, req.body.descripcion, req.body.precio, req.body.estado, req.body.fechaPublicacion])
      .then((data) => {
        if (!data) res.send().status(500);
        return res.send({ insertId: data.insertId });
      }).catch(err => res.send(err).status(500));
  });


  expressApp.post('/publicarComicc',upload.single('file'), (req, res) => {

    db(`INSERT INTO publicaciones (idUsuario, titulo, descripcion, precio, estadoComic, fechaEdicion) 
        VALUES (?, ?, ?, ?, ?, ?)
        `,[req.body.idUsuario, req.body.nombre, req.body.descripcion, req.body.precio, req.body.estado, req.body.fechaPublicacion])
      .then((data) => {
        if (!data) res.send().status(500);


        var pw = { insertId: data.insertId };

        amazonS3.uploadFile({name: 'publicaciones'+pw.insertId, body: req.file.buffer}).then(function(data){
        if (!data) res.send().status(500);
        return res.send(pw);
        }).catch(err => res.send(err).status(500));


      }).catch(err => res.send(err).status(500));
  });



 expressApp.post('/cambiarFotoPublicacion',upload.single('file'), (req, res) => {
   
//console.log(req.body.idUsuario);
console.log('******cambiarfotoPu********');
    //console.log(req.file);
var nombreV = 'publicacion'+req.body.idPublicacion;
    //console.log(req.body);
    //var img = req.file;
   // res.send({ insertId: data.insertId });

    amazonS3.uploadFile({name: nombreV, body: req.file.buffer}).then(function(data){
        if (!data) res.send().status(500);
        return res.send(data);
    }).catch(err => res.send(err).status(500));

   });



/*  expressApp.get('/', (req, res) =>
    res.send('Api is running in port 3000'));*/

  return expressApp.listen(
    3000,
    () => console.log('Connection has been established successfully.')
  );
};

module.exports = app();
