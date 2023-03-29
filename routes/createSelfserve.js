const express = require('express');
const routes = express.Router()
const {SelfServe, notificationC, pushTopayment} = require ("../controllers/createSelfserve")

routes.route("/async/post").post(SelfServe)
routes.route("/async/notification").post(notificationC)

module.exports = routes