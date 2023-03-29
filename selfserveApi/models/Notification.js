const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

//THE CATEGORY SCHEMA
const notificationSchema = db.define("selfservice_payment_notification",
    {
        eventData: {
           type: Sequelize.JSON,
        },
        eventType:{
           type: Sequelize.STRING,
        }
    },
);

module.exports = notificationSchema
