# scrimmage-cesium

Use [CesiumJS](https://cesiumjs.org/) to visualize
[SCRIMMAGE](http://www.scrimmagesim.org/) simulations.

## Setup Development Environment

### Install Node.js

(Reference)[https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions]

    # Using Ubuntu
    curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
    sudo apt-get install -y nodejs

### Clone Repository and Submodules

    $ git clone <this-repository>
    $ cd scrimmage-cesium
    $ git submodule update --init --recursive

### Install Dependencies

    $ cd /path/to/scrimmage-cesium
    $ npm install

### Run Server

    $ nodejs server.js

Open (http://localhost:3000)[http://localhost:3000] in a browser to visit the
scrimmage-cesium viewer.

## Run a Simulation

After you have successfully
[built](https://github.com/gtri/scrimmage#build-scrimmage) and
[ran](https://github.com/gtri/scrimmage#run-scrimmage) scrimmage, modify
scrimmage's
(straight.xml)[https://github.com/gtri/scrimmage/blob/master/missions/straight.xml]
mission to use a network GUI. Set `enable_gui` to `false`, `network_gui` to
`true`, and `start_paused` to `false`. For example:

    <run start="0.0" end="100" dt="0.1"
       time_warp="10"
       enable_gui="false"
       network_gui="true"
       start_paused="false"/>

Source your local scrimmage setup and run the straight.xml mission to visualize
the aircraft in scrimmage-cesium:

    $ source ~/.scrimmage/setup.bash
    $ scrimmage /path/to/scrimmage/missions/straight.xml

# Configuration Options

The scrimmage-cesium viewer can be configured by modifying the
`./config/default.json` file. It is important that the `latitude_origin`,
`longitude_origin`, and `altitude_origin` match in both the `default.json` file
and your scrimmage mission file.
