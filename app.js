var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var SocketBroker = require("./app/js/socket_broker");
var dbClient = require("./lib/db_client");
var serverSocketBroker = require("./lib/server_socket_broker");
var port = process.env.PORT || 8080;
var router = express.Router();
var api = require("./lib/api");

// register API end point
router.use("/api", api);
// Everything else use default middleware.
router.use(express.static(__dirname + '/public'));

app.use(router);

http.listen(port);
console.log('Express server started on port %s', port);

io.on("connection", function (socket) {
    var clientConnId = socket.conn.id;
    var roomId = ''; // Default

    socket.on("INIT", function(data) {
        var roomId = data.roomId;
        if (roomId === undefined) {
            socket.emit("INIT", {err: "No room ID."})
            return
        }
        socket.join(roomId);
        // get all objects for the current room and process them
        console.log("Joining %s", roomId);
        var sBroker = new serverSocketBroker(socket, roomId);
        dbClient.load(roomId, function (data, err) {
            if (err) {
                console.log("Got error while retrieving objects from db for %s", roomId)
            } else {
                sBroker.sendObjectToClient(data)
            }
        });
    socket.broadcast.to(roomId).emit(SocketBroker.MSG_FROM_SERVER, "Someone joined.")
    });

    socket.on('disconnect', function () {
        socket.broadcast.to(roomId).emit(SocketBroker.MSG_FROM_SERVER, "Someone left.");
    });
});
