const express = require("express");
const cors = require("cors")
const app = express();
require("dotenv").config();
const db = require("./connection/connectDB")
const selfserveRoute = require('./routes/createSelfserve')

// Create State
db.authenticate()
.then(() => console.log('Connection has been established successfully.')) 
.catch(error => console.error('Unable to connect to the database:', error))

// MIDDLEWARES
app.use(express.json())
app.use(cors())

const Api_Key = process.env.API_KEY

app.use('/api/v1/self', (req, res, next) => {
  if (req.headers.api_key === Api_Key) {
    console.log(req.header.api_key);
    next()
  } else {
    res.status(403).json({code: 'e101', message: 'You are not Authorized Cus of the API_KEY'})
  }
})
// ROUTES
app.use("/api/v1/self", selfserveRoute)

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});
