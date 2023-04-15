const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

//THE CATEGORY SCHEMA
const notificationSchema = db.define("selfservice_payment_notifications",
    {
        eventData: {
            type: Sequelize.JSON,
        },
        eventType: {
            type: Sequelize.JSON,
        }
    },
);

module.exports = notificationSchema
//this is to cause a git change
