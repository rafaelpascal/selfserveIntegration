const Sequelize = require('sequelize');
const db = require("../connection/connectDB")

const PaymentSchema = db.define("PaymentSelfserves", {
  amount: {
    type: Sequelize.NUMBER,
  },
  payerName: {
    type: Sequelize.STRING,
  },
  payerEmail: {
    type: Sequelize.STRING,
  },
  payerPhonenumber: {
    type: Sequelize.STRING,
  },
  ticket_type_account_id: {
    type: Sequelize.NUMBER,
  },
  payerIdentifier: {
    type: Sequelize.STRING,
  },
  paymentReference: {
    type: Sequelize.STRING,
  },
  metaData: {
    type: Sequelize.JSON,
  },
  paymentDescription: {
    type: Sequelize.STRING,
  },
  currencyCode: {
    type: Sequelize.STRING,
  },
  Callback_url: {
    type: Sequelize.STRING,
  },
  ticket_type_account_id: {
    type: Sequelize.NUMBER,
  },
  itemName: {
    type: Sequelize.STRING,
  },
  itemCode: {
    type: Sequelize.STRING,
  },
  paymentStatus: {
    type: Sequelize.NUMBER,
  },
});

module.exports = PaymentSchema