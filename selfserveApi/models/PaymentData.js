const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

const PaymentDataSchema = db.define("PaymentDataSelfserves", {
    inbound: {
        type: Sequelize.JSON,
    },
    outbound: {
        type: Sequelize.JSON,
    },
});

module.exports = PaymentDataSchema