const { Sequelize } = require('sequelize');
require("dotenv").config();

// Option 3: Passing parameters separately (other dialects)
module.exports = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
    host: 'localhost',
    dialect: "mysql"
  });