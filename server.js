'use strict';

var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');

// Setup server
server.listen(8000);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
    res.redirect('index.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

var scrimmage_grpc = require("./js/scrimmage-grpc.js");
var sc_grpc = new scrimmage_grpc();

var io = require('socket.io')(server);
io.on('connection', function (socket) {
    sc_grpc.setup_socket(socket);
});
