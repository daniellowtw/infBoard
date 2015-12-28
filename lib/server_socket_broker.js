var SocketBroker = require("../app/js/socket_broker");
var dbClient = require("./db_client");


// A broker is tied to a socket that is connected to the server.
// It binds all the callbacks we need in order to communicate with the client
function ServerSocketBroker(socket, roomId) {
    var that = this;
    this.socket = socket;
    this.id = roomId;

    socket.on(SocketBroker.DRAW_TEXT_FROM_CLIENT, function (data) {
        data.type = "textObj";
        that.objectHandler(SocketBroker.DRAW_TEXT_FROM_SERVER, data)
    });
    socket.on(SocketBroker.LINE_OBJECT_FROM_CLIENT, function (data) {
        data.type = "lineObj";
        that.objectHandler(SocketBroker.LINE_OBJECT_FROM_SERVER, data)
    });
    socket.on(SocketBroker.DRAW_IMAGE_FROM_CLIENT, function (data) {
        data.type = "imageObj";
        that.objectHandler(SocketBroker.DRAW_IMAGE_FROM_SERVER, data)
    });

    socket.on(SocketBroker.TRANSLATE_SELECTED_CLIENT, function (data) {
        that.socket.broadcast.to(that.id).json.emit(SocketBroker.TRANSLATE_SELECTED_SERVER, data)
    });

    socket.on(SocketBroker.DELETE_SELECTED_CLIENT, function (data) {
        that.socket.broadcast.to(that.id).json.emit(SocketBroker.DELETE_SELECTED_SERVER, data)
    });

    socket.on(SocketBroker.SAVE_MOVED_OBJECT, function (objectOffsetArray) {
        for (var i = 0; i < objectOffsetArray.length; i++) {
            data = objectOffsetArray[i];
            dbClient.updateObjectOffset(that.id, data.id, data.offsetX, data.offsetY, function (err) {
                if (err) {
                    console.log("Saving moved object to redis failed.", err, data)
                }
            })

        }
    });

    this.marshallBroadcast(SocketBroker.CLIENT_PAN, SocketBroker.CLIENT_PAN);

    this.socket.on(SocketBroker.MSG_FROM_CLIENT, function (d) {
        that.socket.broadcast.to(that.id).emit(SocketBroker.MSG_FROM_SERVER, d);
    });
}

// stores it to the database, tell sender ok, broadcast obj to other sockets
ServerSocketBroker.prototype.objectHandler = function (evtOut, data) {
    var that = this;
    var nonce = data.nonce;
    delete data.nonce;
    var cb = function (data) {
        // Tell other people once we have the this.id
        that.socket.emit("SYNACK", {nonce: nonce, res: data.id});
        that.socket.broadcast.to(that.id).json.emit(evtOut, data); // Tell other clients
    };

    dbClient.saveNewObject(this.id, data, function (err) {
        console.log("Error occurred while handling object (saving)", err);
    }, cb)
};

ServerSocketBroker.prototype.marshallBroadcast = function (a, b) {
    var that = this;
    this.socket.on(a, function (d) {
        that.socket.broadcast.to(that.id).json.emit(b, d)
    });
};

// Decode the data from db and emit to client
ServerSocketBroker.prototype.sendObjectToClient = function (data) {
    data = JSON.parse(data);
    switch (data.type) {
        case "lineObj" :
            this.socket.json.emit(SocketBroker.LINE_OBJECT_FROM_SERVER, data);
            break;
        case "imageObj" :
            this.socket.json.emit(SocketBroker.DRAW_IMAGE_FROM_SERVER, data);
            break;
        case "textObj" :
            this.socket.json.emit(SocketBroker.DRAW_TEXT_FROM_SERVER, data);
            break;
        default:
            console.log("Unknown data.type when trying to send object to client", data)
    }
};

module.exports = ServerSocketBroker;