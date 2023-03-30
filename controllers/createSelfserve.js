const express = require('express')
const axios = require("axios")
const NotificationM = require("../models/Notification")
const sequelize = require('../connection/connectDB');
const Payment = require("../models/Payments")
const PaymentData = require("../models/PaymentData");


const SelfServe = async (req, res) => {
    var authheader = req.headers.authorization;
    // console.log(req.headers);
    if (!authheader) {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        // return next(err)
        res.status(401).json({message: 'You are not authenticated!'})
    }
    var auth = new Buffer.from(authheader.split(' ')[1],
        'base64').toString().split(':');
    var user = auth[0];
    var pass = auth[1];
    const paymentReferenceStrg = (len) => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);;
      } 
      console.log(paymentReferenceStrg(36));
    if (user == 'tmsmda' && pass == 'tmsmda123*') {
        const data = new Payment ({
            amount: req.body.amount,
            payerName: req.body.payerName,
            payerEmail:  req.body.payerEmail,
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
           const response = await axios.post("https://demo.teticket.ng/api/AgentPurchase",         
            data, {
                auth: {
                    username: user,
                    password: pass
                }
            });
    
            // console.log(response.data.responseCode);
            if (response.data.responseCode === '99') {
                res.status(409).json({message: "Duplicate payment reference"})
            } else {            
                await data.save();
                const newPaymentData = new PaymentData({
                    inbound: data,
                    outbound: response.data,
                })
                await newPaymentData.save()
                return res.status(200).json({ message: response.data });
            }
        } catch (err) {
            res.status(500).json({ message: err });
        }
    } else {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        res.status(401).json({message: 'You are not authenticated!'})
    }
    // console.log(auth);
};


// SELFSERVE PAYMENT NOTIFICATION
const notificationC = async (req, res) => {
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
        return Math.random().toString(36).substring(2,len+2);
      }  
    const paymentReferenceStrg = (len) => {
        return Math.random().toString(36).substring(2,len+2);
      }  
    console.log(paymentReferenceStrg(36));
    const apiPaymentData = ({
        paymentReference: JSON.stringify(paymentReferenceStrg(36).toUpperCase()),
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

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    // console.log(apiPaymentData);
}


module.exports = {
    SelfServe,
    notificationC,
}