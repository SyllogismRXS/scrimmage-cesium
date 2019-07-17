var socket = io.connect('http://localhost:8000');

socket.on('frame', function (data) {
    console.log('got a frame');
});
