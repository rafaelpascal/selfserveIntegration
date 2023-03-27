const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

const PaymentDataSchema = db.define("PaymentDataSelfserves", {
    outbound: {
        type: Sequelize.JSON,
    },
    inbound: {
        type: Sequelize.JSON,
    },
});

module.exports = PaymentDataSchema