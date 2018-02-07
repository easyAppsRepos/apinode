const credentials = () => ({
  database: {
    hostname: 'inflowencerdb.ctdr2gfabqo3.us-east-2.rds.amazonaws.com',
    name: 'inflowencerdb',
    port: 3306,
    username: 'inflowenceradmin',
    password: '[Inflowencerapp]',
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
