'use strict';

var Cesium = require("cesium");

module.exports = class ScrimmageGRPC {
    constructor(socket) {
        this.socket = socket;

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

        var that = this;
        function SendFrame(call, callback) {
            // lon, lat, height
            let origin = new Cesium.Cartesian3.fromDegrees(-120.767925, 35.721025, 300.0);

            var ENU = new Cesium.Matrix4();
            Cesium.Transforms.eastNorthUpToFixedFrame(origin, Cesium.Ellipsoid.WGS84, ENU);

            for (let i = 0; i < call.request.contact.length; i++) {
                let cnt = call.request.contact[i];
                let position = new Cesium.Cartesian3(cnt.state.position.x,
                                                     cnt.state.position.y,
                                                     cnt.state.position.z);
                var finalPos = Cesium.Matrix4.multiplyByPoint(ENU, position, new Cesium.Cartesian3());

                call.request.contact[i].state.position.x = finalPos.x;
                call.request.contact[i].state.position.y = finalPos.y;
                call.request.contact[i].state.position.z = finalPos.z;
            }

            that.socket.emit('frame', call.request);
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
    }
};
