module.exports = function(forward_socket) {
    var module = {};

    ///////////////////////////////
    // Load GRPC
    var PROTO_PATH = __dirname + '/../scrimmage/src/proto';
    var grpc = require('grpc');
    var protoLoader = require('@grpc/proto-loader');

    // Suggested options for similarity to existing grpc.load behavior
    var packageDefinition = protoLoader.loadSync(
        PROTO_PATH + '/scrimmage/proto/Scrimmage.proto',
        {keepCase: true,
         longs: String,
         enums: String,
         defaults: true,
         oneofs: true,
         includeDirs: [PROTO_PATH]
        });
    var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    // The protoDescriptor object has the full package hierarchy
    var scrimmage_proto = protoDescriptor.scrimmage_proto

    function send_reply(callback, status) {
        var reply = { success: status };
        callback(null, reply);
    }

    function SendFrame(call, callback) {
        // console.log(call.request.contact.length);
        //for (var i = 0; i < call.request.contact.length; i++) {
        //    //console.log('Contact ID: %d', call.request.contact[i].id.id);
        //    console.log(JSON.stringify(call.request.contact[i]));
        //}
        frame = JSON.stringify(call.request);

        function cb_closure(socket) {
            socket.emit('frame',
        };

        // if (forward_socket == null) {
        //     console.log('bad socket');
        // } else {
        //     forward_socket.emit('frame', frame);
        // }

        //if
        //module.socket.emit('frame', frame);

        send_reply(callback, 1);
    }

    function SendUTMTerrain(call, callback) {
        send_reply(callback, 1);
    }

    function SendSimInfo(call, callback) {
        send_reply(callback, 1);
    }

    function SendContactVisual(call, callback) {
        send_reply(callback, 1);
    }

    function SendShapes(call, callback) {
        send_reply(callback, 1);
    }

    function Ready(call, callback) {
        send_reply(callback, 1);
    }

    function SendGUIMsg(call, callback) {
        send_reply(callback, 1);
    }

    function SendWorldPointClicked(call, callback) {
        send_reply(callback, 1);
    }

    function getGRPCServer() {
        var server = new grpc.Server();
        server.addService(scrimmage_proto.ScrimmageService.service, {
            SendFrame: SendFrame,
            SendSimInfo: SendSimInfo,
            SendContactVisual: SendContactVisual,
            SendShapes: SendShapes,
            Ready: Ready,
            SendGUIMsg: SendGUIMsg,
            SendWorldPointClicked: SendWorldPointClicked,
            SendUTMTerrain: SendUTMTerrain
        });
        return server;
    }
    var scrimmage_server = getGRPCServer();
    scrimmage_server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    scrimmage_server.start();

    // Create GRPC client back to scrimmage:
    // new scrimmage_proto.ScrimmageService('localhost:50052', grpc.credentials.createInsecure());

    return module;
};
