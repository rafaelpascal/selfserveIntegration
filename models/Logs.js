const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

//THE CATEGORY SCHEMA
const logs = db.define("Logs",
    {
        // url:{
        //     type: Sequelize.STRING,
        // },
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