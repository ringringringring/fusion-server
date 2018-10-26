const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const relay = require('trustnote-relay');
const app = express();
const intro = require('./init/intro');
const rateLimit = require("express-rate-limit");

// init database before server start
intro.initDb();

app.use(bodyParser.json({
    limit: '1mb'
}));

app.use(bodyParser.urlencoded({
    extended: false
}))

var logDirectory = path.join(__dirname, 'log')

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
})

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
        network: 'devnet',
        errCode: 429,
        errMsg: "Too many accounts created from this IP, please try again after an hour",
        data: null
    }
});

app.use(limiter);

const asset = require('./routers/asset')
const account = require('./routers/account')

app.use('/api/v1/asset', asset)
app.use('/api/v1/account', account)

// 404 Error
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(404).send({
        network: 'devnet',
        errCode: 404,
        errMsg: "API error",
        data: null
    });
});

app.listen(6001);