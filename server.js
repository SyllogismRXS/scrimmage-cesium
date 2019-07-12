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

var io = require('socket.io')(server);
