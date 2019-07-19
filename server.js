'use strict';

var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
const config = require('config');

const socketio_port = config.get('socketio.port');
const webserver_port = config.get('webserver.port');
const webserver_host = config.get('webserver.host');

// Setup server
server.listen(socketio_port);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
    res.redirect('index.html');
});

app.listen(webserver_port, function () {
  console.log(`scrimmage-cesium running: http://${webserver_host}:${webserver_port}`);
});

var scrimmage_grpc = require("./js/scrimmage-grpc.js");
var sc_grpc = new scrimmage_grpc();

var io = require('socket.io')(server);
io.on('connection', function (socket) {
    sc_grpc.setup_socket(socket);
});
