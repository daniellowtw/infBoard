var SocketBroker = require("../app/js/socket_broker");
var redisClient = require("redis-connection")();
var util = require("util");


// A broker is tied to a socket that is connected to the server.
// It binds all the callbacks we need in order to communicate with the client
function serverSocketBroker(socket, roomId) {
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

    this.marshallBroadcast(SocketBroker.TRANSLATE_SELECTED_CLIENT, SocketBroker.TRANSLATE_SELECTED_SERVER);
    this.marshallBroadcast(SocketBroker.CLIENT_PAN, SocketBroker.CLIENT_PAN); // TODO: Don't store such commands in db.
    this.socket.on(SocketBroker.MSG_FROM_CLIENT, function (d) {
        this.socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, d);
    });
}

// stores it to the database, tell sender ok, broadcast obj to other sockets
serverSocketBroker.prototype.objectHandler = function (evtOut, data) {
    var that = this;
    var nonce = data.nonce;
    delete data.nonce;
    redisClient.INCR("counter:objects:" + this.id, function (err, res) {
        //TODO: Handle error
        redisClient.SADD(util.format("objects:%s", that.id), res);
        data.id = res;
        redisClient.HMSET("object", util.format("%s:%s", that.id, res), JSON.stringify(data), function (err, res) {
        });
        // Tell other people once we have the this.id
        that.socket.emit("SYNACK", {nonce: nonce, res: res});
        that.socket.broadcast.to(that.id).json.emit(evtOut, data); // Tell other clients
    });
};

// Helper class for translate broadcast
serverSocketBroker.prototype.marshallTranslateObjectBroadcast = function (evtIn, evtOut) {
    this.socket.on(evtIn, function (data) {
        // TODO: Update offset of object in redis
        this.socket.broadcast.to(this.id).json.emit(evtOut, data)
    })
};

serverSocketBroker.prototype.marshallBroadcast = function (a, b) {
    var that = this;
    this.socket.on(a, function (d) {
        that.socket.broadcast.to(this.id).json.emit(b, d)
    });
};

// Decode the data from db and emit to client
serverSocketBroker.prototype.sendObjectToClient = function (data) {
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
            console.log("Unknown", data)
    }
}

module.exports = serverSocketBroker;