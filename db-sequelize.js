const Sequelize = require('sequelize');
const sequelize = new Sequelize('os', 'os', '123456', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  //logging: false
});

module.exports = sequelize;