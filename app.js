var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


/* --------- Setup Solr ------------ */
var solr = require('solr-client')
    , url = require ('url')
    , solr_url = url.parse(process.env.WEBSOLR_URL);


var client_opts = {
    path: solr_url.pathname,
    host: solr_url.hostname,
    port: 80
};
if (solr_url.port) {
    client_opts.port = parseInt(solr_url.port);
}

console.log ('client_opts :' + JSON.stringify(client_opts));
var client = solr.createClient(client_opts);
client.autoCommit = true;
/* ------------------ */


// Access Routes
var sfcanvas = require('./routes/sfcanvas')(process.env.SFDC_SECRET);
// Solr WebServices
var products = require('./routes/products')(client);


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json()); // req.body
app.use(bodyParser.urlencoded()); // req.params
app.use(cookieParser());


app.use('/', sfcanvas); // access the app
app.use('/products', products); // the product search

app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
