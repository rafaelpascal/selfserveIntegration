const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

const logs = db.define("Logs",
    {
        ipaddress:{
            type: Sequelize.STRING,
        },
        payload: {
            type: Sequelize.JSON,
        },
        error: {
            type: Sequelize.JSON,
        },
        success: {
            type: Sequelize.JSON,
        },
    },
);

module.exports = logs
//this is to cause a git change