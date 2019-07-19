'use strict';

var Cesium = require("cesium");


function quaternion_to_euler(q) {
    let roll = Math.atan2(2 * (q.w * q.x + q.y * q.z),
                          1 - 2 * (Math.pow(q.x, 2) + Math.pow(q.y, 2)));
    let pitch = Math.asin(2 * (q.w * q.y - q.z * q.x));
    let yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y),
                         1 - 2 * (Math.pow(q.y, 2) + Math.pow(q.z, 2)));
    return {
        roll : roll,
        pitch : pitch,
        yaw : yaw,
    };
}

function rad2deg(rpy) {
    return {
        roll : rpy.roll * 180.0 / Math.PI,
        pitch : rpy.pitch * 180.0 / Math.PI,
        yaw : rpy.yaw * 180.0 / Math.PI,
    };
}

function enu_to_gps_hpr(enu_quat) {
    let rpy = quaternion_to_euler(enu_quat);
    return new Cesium.HeadingPitchRoll(-rpy.yaw,
                                       -rpy.pitch, rpy.roll);
}

module.exports = class ScrimmageGRPC {
    constructor() {
        this.socket = undefined;

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
            send_reply(callback, 1);

            // lon, lat, height
            let origin = new Cesium.Cartesian3.fromDegrees(-120.767925, 35.721025, 300.0);

            var ENU = new Cesium.Matrix4();
            Cesium.Transforms.eastNorthUpToFixedFrame(origin, Cesium.Ellipsoid.WGS84, ENU);

            for (let i = 0; i < call.request.contact.length; i++) {
                let cnt = call.request.contact[i];
                let position = new Cesium.Cartesian3(cnt.state.position.x,
                                                     cnt.state.position.y,
                                                     cnt.state.position.z);
                var ecef_pos = Cesium.Matrix4.multiplyByPoint(ENU, position, new Cesium.Cartesian3());

                call.request.contact[i].state.position.x = ecef_pos.x;
                call.request.contact[i].state.position.y = ecef_pos.y;
                call.request.contact[i].state.position.z = ecef_pos.z;

                let gps_hpr = enu_to_gps_hpr(cnt.state.orientation);
                let quat = Cesium.Transforms.headingPitchRollQuaternion(
                    ecef_pos, gps_hpr);

                call.request.contact[i].state.orientation.w = quat.w;
                call.request.contact[i].state.orientation.x = quat.x;
                call.request.contact[i].state.orientation.y = quat.y;
                call.request.contact[i].state.orientation.z = quat.z;
            }

            if (that.socket != undefined) {
                that.socket.emit('frame', call.request);
            }
        }

        this.setup_socket = function(socket) {
            this.socket = socket;
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
