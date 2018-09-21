const express = require('express')
const app = express();

const config = require('config');

const userRoutes = require('./user-routes');
const requestRoutes = require('./request-routes');
const configRoutes = require('../common/config-routes');

const  expressMongoDb = require('express-mongo-db');
const url = config.get('db.citizen');
app.use(expressMongoDb(url));

var cors = require('cors')
app.use(cors())

var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/configs', configRoutes);
app.use('/requests', requestRoutes);

// Error Handler
app.use(function(err, req, res, next) {
    console.error(err);
    res.status(500).send(err.message || 'Something broke');
  });

module.exports = app;