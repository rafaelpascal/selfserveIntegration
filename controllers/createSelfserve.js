const express = require('express')
const axios = require("axios")
const NotificationM = require("../models/Notification")
const sequelize = require('../connection/connectDB');
const Payment = require("../models/Payments")
const PaymentData = require("../models/PaymentData");
require("dotenv").config();
const Logs = require("../models/Logs") //<---import the Log here

const SelfServe = async (req, res) => {
    const IP = req.headers['x-real-ip'] || req.socket.remoteAddress; //<--Add the IP here
    var authheader = req.headers.authorization;
    // console.log(req.headers);
    if (!authheader) {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        // return next(err)
        res.status(401).json({ message: 'You are not authenticated!' })
    }
    var auth = new Buffer.from(authheader.split(' ')[1],
        'base64').toString().split(':');
    var user = auth[0];
    var pass = auth[1];
    const paymentReferenceStrg = (len) => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;
    }
    //   console.log(paymentReferenceStrg(36));
    //   console.log(process.env.APP_USERNAME);
    //   console.log(process.env.PASSWORD);
    if (user == process.env.APP_USERNAME && pass == process.env.PASSWORD) {
        const data = new Payment({
            amount: req.body.amount,
            payerName: req.body.payerName,
            payerEmail: req.body.payerEmail,
            payerPhonenumber: req.body.payerPhonenumber,
            payerIdentifier: req.body.payerIdentifier,
            paymentReference: paymentReferenceStrg(36).toUpperCase(),
            ticket_type_account_id: req.body.ticket_type_account_id,
            metaData: req.body.metaData,
            paymentDescription: req.body.paymentDescription,
            currencyCode: req.body.currencyCode,
            Callback_url: req.body.Callback_url
        })
        try {
            const response = await axios.post(process.env.SELFSERVE_ENDPOINT,
                data, {
                auth: {
                    username: user,
                    password: pass
                }
            });
            // console.log(response.data.responseCode);
            if (response.data.responseCode === '99') {
                res.status(409).json({ message: "Duplicate payment reference" })
            } else {
                const savedData = await data.save();
                const newPaymentData = new PaymentData({
                    inbound: data,
                    outbound: response.data,
                })
                await newPaymentData.save()
                Logs.create({ipaddress: IP, payload: data, success: savedData }) //<-LOG SUCCESS
                return res.status(200).json({ message: response.data });
            }
        } catch (err) {
            const errMessage = err.message
            console.log('errMessage', errMessage);
            res.status(500).json({ message: err });
            Logs.create({ipaddress: IP, payload: data, error: errMessage }) //<- LOG ERROR
        }
    } else {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        res.status(401).json({ message: 'You are not authenticated!' })
    }
    // console.log(auth);
};


// SELFSERVE PAYMENT NOTIFICATION
const notificationC = async (req, res) => {
    const IP = req.headers['x-real-ip'] || req.socket.remoteAddress; //<---THE SAME FOR NOTIFICATION
    const newNotifi = new NotificationM({
        eventData: req.body.eventData,
        eventType: req.body.eventType
    })
    var data = [];
    var bank_code = 0;
    var account_name = "";
    data = req.body.eventData['paymentSourceInformation'];
    data.forEach(element => {
        // console.log(element.paymentReference);
        bank_code = element.bankCode;
        // account_name = element.accountName;
    });
    const paymentLogId = (len) => {
        return Math.random().toString(36).substring(2, len + 2);
    }
    const paymentReferenceStrg = (len) => {
        // return Math.random().toString(36).substring(2,len+2);
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;
    }
    console.log(paymentReferenceStrg(36));
    const apiPaymentData = ({
        paymentReference: JSON.stringify(req.body.eventData['paymentReference']),
        PaymentLogId: JSON.stringify(paymentLogId(36).toUpperCase()),
        amountPaid: req.body.eventData['amountPaid'],
        paymentMethod: JSON.stringify(req.body.eventData['paymentMethod']),
        bankCode: bank_code,
        // accountName: account_name,
        paidOn: JSON.stringify(req.body.eventData['paidOn']),
        customerName: JSON.stringify(req.body.eventData['customer']['name']),
        customerEmail: JSON.stringify(req.body.eventData['customer']['email']),
        paymentDescription: JSON.stringify(req.body.eventData['paymentDescription']),

    })
    try {
        var sql = `INSERT INTO api_payments (PaymentReference, PaymentLogId, Amount, PaymentMethod, BankCode, PaymentDate, CustomerName, OtherCustomerInfo, ItemName) VALUES (${apiPaymentData.paymentReference}, ${apiPaymentData.PaymentLogId}, ${apiPaymentData.amountPaid}, ${apiPaymentData.paymentMethod},${apiPaymentData.bankCode}, ${apiPaymentData.paidOn},${apiPaymentData.customerName},${apiPaymentData.customerEmail},${apiPaymentData.paymentDescription})`;
        sequelize.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result);
        });
        const newNotification = await newNotifi.save()
        res.status(200).json({
            success: true,
            data: {
                newNotification,
            },
        });
        Logs.create({ ipaddress: IP, payload: apiPaymentData, success: newNotification }) //<-- LOG SUCCESS
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        const errMessage = error.message
        console.log('errMessage', errMessage);
        Logs.create({ ipaddress: IP, payload: apiPaymentData, error: errMessage }) //<---LOG ERROR
    }
    // console.log(apiPaymentData);
}


module.exports = {
    SelfServe,
    notificationC,
}