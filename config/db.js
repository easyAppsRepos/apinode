const mysql = require('mysql');
const { database } = require('./credentials');

const db = (query,parametros) => {
  const connection = mysql.createConnection({
    host: database.hostname,
    user: database.username,
    password: database.password,
    database: database.name
  });

  try {
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) {
          console.log(err);
          reject(err);
        }
      });

      return connection.query(query, parametros, (error, results) => {
        if (!error) {
          resolve(results);
        }
        else{
          console.log(error);
          resolve(error);

        }
      });
    });
  } finally {
    connection.end();
  }
};

module.exports = db;
