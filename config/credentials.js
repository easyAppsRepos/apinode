const credentials = () => ({
  database: {
    hostname: 'magicminddb.c9wrj87xicce.us-east-2.rds.amazonaws.com',
    name: 'mminddb',
    port: 3306,
    username: 'administrator',
    password: 'MagicMind2017',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  },
  server: {
    port: 3000,
    routes: Object.freeze([
      { uri: '/', module: './src/publication/publicationRouter' },
    ])
  }
});

module.exports = credentials();
