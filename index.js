const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const relay = require('trustnote-relay');
const app = express();
const init = require('./init/init');

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

const asset = require('./routers/asset')
const account = require('./routers/account')

app.use('/api/v1/asset', asset)
app.use('/api/v1/account', account)


app.listen(6001);