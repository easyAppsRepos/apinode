const credentials = () => ({
  database: {
    hostname: 't',
    name: 't',
    port: 3306,
    username: 't',
    password: 't',
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
