'use strict';

var Cesium = require("cesium");

const config = require('config');
const grpc_rx_port = config.get('scrimmage_grpc.rx_port');
const latitude_origin = config.get('scrimmage_grpc.latitude_origin');
const longitude_origin = config.get('scrimmage_grpc.longitude_origin');
const altitude_origin = config.get('scrimmage_grpc.altitude_origin');

// Extract roll/pitch/yaw from a quaternion
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

// Convert a roll/pitch/yaw from radians to degrees
function rad2deg(rpy) {
    return {
        roll : rpy.roll * 180.0 / Math.PI,
        pitch : rpy.pitch * 180.0 / Math.PI,
        yaw : rpy.yaw * 180.0 / Math.PI,
    };
}

// Convert a scrimmage quaternion frame to a Cesium HeadingPitchRoll ECEF frame
function enu_to_gps_hpr(enu_quat) {
    let rpy = quaternion_to_euler(enu_quat);
    return new Cesium.HeadingPitchRoll(-rpy.yaw,
                                       -rpy.pitch, rpy.roll);
}

module.exports = class ScrimmageGRPC {
    constructor() {
        var self = this;

        this.socket = undefined;

        // lon, lat, height
        this.origin = new Cesium.Cartesian3.fromDegrees(
            longitude_origin, latitude_origin, altitude_origin);
        this.ENU = new Cesium.Matrix4();
        Cesium.Transforms.eastNorthUpToFixedFrame(this.origin, Cesium.Ellipsoid.WGS84, this.ENU);

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

        function scrimmage_to_ecef_frame(contacts, idx) {
            // Transform the point from the local cartesian system to ECEF
            let position = new Cesium.Cartesian3(contacts[idx].state.position.x,
                                                 contacts[idx].state.position.y,
                                                 contacts[idx].state.position.z);
            var ecef_pos = Cesium.Matrix4.multiplyByPoint(self.ENU, position, new Cesium.Cartesian3());

            // Update the position
            contacts[idx].state.position.x = ecef_pos.x;
            contacts[idx].state.position.y = ecef_pos.y;
            contacts[idx].state.position.z = ecef_pos.z;

            // Convert the scrimmage ENU quaternion to the gps
            // heading/pitch/roll
            let gps_hpr = enu_to_gps_hpr(contacts[idx].state.orientation);
            let quat = Cesium.Transforms.headingPitchRollQuaternion(
                ecef_pos, gps_hpr);

            // Update the quaternion
            contacts[idx].state.orientation.w = quat.w;
            contacts[idx].state.orientation.x = quat.x;
            contacts[idx].state.orientation.y = quat.y;
            contacts[idx].state.orientation.z = quat.z;
        }

        function SendFrame(call, callback) {
            send_reply(callback, 1);

            for (let i = 0; i < call.request.contact.length; i++) {
                scrimmage_to_ecef_frame(call.request.contact, i);
            }

            if (self.socket != undefined) {
                self.socket.emit('frame', call.request);
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
        scrimmage_server.bind(`0.0.0.0:${grpc_rx_port}`, grpc.ServerCredentials.createInsecure());
        scrimmage_server.start();
    }
};
