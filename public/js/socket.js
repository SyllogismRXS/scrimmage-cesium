'use strict';

var socket = io.connect('http://localhost:8000');

function transform_state(state) {
    var heading = Cesium.Math.toRadians(45.0);
    var pitch = Cesium.Math.toRadians(15.0);
    var roll = Cesium.Math.toRadians(0.0);

    var position = new Cesium.Cartesian3(state.position.x, state.position.y, state.position.z);
    var orientation = new Cesium.Transforms.headingPitchRollQuaternion(position, new Cesium.HeadingPitchRoll(heading, pitch, roll));

    return {
        position: position,
        orientation: orientation,
    };
}

function update_entity(contact, entity) {
    var heading = Cesium.Math.toRadians(45.0);
    var pitch = Cesium.Math.toRadians(15.0);
    var roll = Cesium.Math.toRadians(0.0);

    let state = transform_state(contact.state);
    entity.position = state.position;
    entity.orientation = entity.orientation;
}

function add_entity(contact, id_str) {

    let state = transform_state(contact.state);

    //Actually create the entity
    var entity = viewer.entities.add({

        id: id_str,

        // //Set the entity availability to the same interval as the simulation time.
        // availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        //     start : start,
        //     stop : stop
        // })]),

        //Use our computed positions
        position : state.position,

        //Automatically compute orientation based on position movement.
        orientation : state.orientation,

        //Load the Cesium plane model to represent the entity
        model : {
            uri : '../models/CesiumAir/Cesium_Air.gltf',
            minimumPixelSize : 64
        },
    });
}

socket.on('frame', function (frame) {
    // Suspend events during batch entity updates for performance
    viewer.entities.suspendEvents();

    for (let i = 0; i < frame.contact.length; i++) {
        let id_str = frame.contact[i].id.id.toString();
        let entity = viewer.entities.getById(id_str)
        if (entity != undefined) {
            update_entity(frame.contact[i], entity);
        } else {
            console.log('add entity');
            add_entity(frame.contact[i], id_str);
        }
    }
    // Resume events after the batch entity update
    viewer.entities.resumeEvents();
});

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYmQ0NmZiZC0zZGNlLTQ4ZWMtODJiYi0xYTY2OTk4MDMxNDkiLCJpZCI6ODk1MCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU1MzExNjM4M30.cUiEWi_tRRvqkGIY7rNG40aVA9rPKaz8vYF2wQuaLyU';
var viewer = new Cesium.Viewer('cesiumContainer');
