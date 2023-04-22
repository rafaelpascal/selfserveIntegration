const express = require('express')
const axios = require("axios")
const NotificationM = require("../models/Notification")
const sequelize = require('../connection/connectDB');
const Payment = require("../models/Payments")
const PaymentData = require("../models/PaymentData");
require("dotenv").config();
const Logs = require("../models/Logs")
const paymentselfserves = require("../models/Payments")

// GENERATING ACCOUNT FOR PAYMENT
const SelfServe = async (req, res) => {
    const IP = req.headers['x-real-ip'] || req.socket.remoteAddress;
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
    if (user == process.env.APP_USERNAME && pass == process.env.PASSWORD) {
        const data = ({
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
        const paymentTableData = new Payment({
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
            Callback_url: req.body.Callback_url,
            itemName: req.body.item_name,
            itemCode: req.body.item_code,
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
                // Saving into the Api Payment  
                const savedData = await paymentTableData.save();
                const newPaymentData = new PaymentData({
                    inbound: savedData,
                    outbound: response.data,
                })
                await newPaymentData.save()
                Logs.create({ ipaddress: IP, payload: paymentTableData, success: savedData })
                return res.status(200).json({ message: response.data });
            }
        } catch (err) {
            const errMessage = err.message
            res.status(500).json({ message: err });
            Logs.create({ ipaddress: IP, payload: paymentTableData, error: errMessage })
        }
    } else {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        res.status(401).json({ message: 'You are not authenticated!' })
    }
};

// SELFSERVE PAYMENT NOTIFICATION
const notificationC = async (req, res) => {
    const IP = req.headers['x-real-ip'] || req.socket.remoteAddress;
    const newNotifi = new NotificationM({
        eventData: req.body.eventData,
        eventType: req.body.eventType
    })
    var data = [];
    var bank_code = 0;
    var account_name = "";
    data = req.body.eventData['paymentSourceInformation'];
    data.forEach(element => {
        bank_code = element.bankCode;
        account_name = element.accountName;
        amount_paid = element.amountPaid;
        amount_accountNama = element.accountName;
        session_Id = element.sessionId;
    });
    const paymentLogId = (len) => {
        return Math.random().toString(36).substring(2, len + 2);
    }
    const paymentReferenceStrg = (len) => {
        // return Math.random().toString(36).substring(2,len+2);
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;
    }
    console.log(paymentReferenceStrg(36));
    const notificationData = ({
        notificationReference: req.body.eventData['paymentReference'],
        paymentStatus: req.body.eventData['paymentStatus'],
        PaymentLogId: JSON.stringify(paymentLogId(36).toUpperCase()),
        amountPaid: req.body.eventData['amountPaid'],
        paymentMethod: JSON.stringify(req.body.eventData['paymentMethod']),
        bankCode: bank_code,
        paidOn: JSON.stringify(req.body.eventData['paidOn']),
    })
    try {
        if (notificationData.paymentStatus) {
            console.log('PAID');
            const payment_status = await paymentselfserves.update(
                {
                    paymentStatus: 1,
                },
                {
                    where: { paymentReference: notificationData.notificationReference },
                }
            );
            // GET PAYMENT DATA USING THE PAYMENTREFERENCE
            const paymentSelf = await paymentselfserves.findOne({ where: { paymentReference: notificationData.notificationReference } });;
            console.log('paymentSelf', paymentSelf);
            const apiPaymentData = ({
                paymentReference: JSON.stringify(paymentSelf.paymentReference),
                amountPaid: JSON.stringify(paymentSelf.amount),
                CustReference: JSON.stringify(paymentSelf.payerIdentifier),
                customerName: JSON.stringify(paymentSelf.payerName),
                customerEmail: JSON.stringify(paymentSelf.payerEmail),
                paymentDescription: JSON.stringify(paymentSelf.paymentDescription),
                ItemCode: JSON.stringify(paymentSelf.itemCode),
                ItemName: JSON.stringify(paymentSelf.itemName),
                InstitutionName: JSON.stringify(process.env.INSTITUTION_NAME),
                ChannelName: JSON.stringify(process.env.CHANNEL_NAME),
            })
            console.log('payment_status', payment_status);
            if (paymentSelf.paymentStatus === 1) {
                console.log('Payment Status is 1');
                var sql = `INSERT INTO api_payments (CustReference, AlternateCustReference, InstitutionName, ChannelName, BankCode, ItemCode, PaymentReference, PaymentLogId, Amount, PaymentMethod, PaymentDate, CustomerName, ItemName) VALUES (${apiPaymentData.CustReference}, ${apiPaymentData.customerEmail},${apiPaymentData.InstitutionName},${apiPaymentData.ChannelName},${notificationData.bankCode},${apiPaymentData.ItemCode},${apiPaymentData.paymentReference}, ${notificationData.PaymentLogId}, ${apiPaymentData.amountPaid}, ${notificationData.paymentMethod}, ${notificationData.paidOn},${apiPaymentData.customerName},${apiPaymentData.ItemName})`;
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
                Logs.create({ ipaddress: IP, payload: newNotifi, success: newNotification })
            } else {
                res.status(500).json({ success: false, message: 'Writing into the Api Payment Table Error because Payment Status is 0' });
            }
        } else {
            res.status(500).json({ success: false, message: 'NOTIFICATION PAYMENT STATUS IS NOT PAID' });
        }
    } catch (error) {
        const errMessage = error.message
        console.log(errMessage);
        res.status(500).json({ success: false, message: error.message });
        Logs.create({ ipaddress: IP, payload: newNotifi, error: errMessage })
    }
    // console.log(apiPaymentData);
}


module.exports = {
    SelfServe,
    notificationC,
}
