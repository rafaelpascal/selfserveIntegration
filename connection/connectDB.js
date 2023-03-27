const { Sequelize } = require('sequelize');

// Option 3: Passing parameters separately (other dialects)
module.exports = new Sequelize('revotax_tms', 'root', '', {
    host: 'localhost',
    dialect: "mysql"
  });