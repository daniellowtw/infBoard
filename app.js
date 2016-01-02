var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var SocketBroker = require("./app/js/socket_broker");
var redisPub = require("redis-connection")();
var dbClient = require("./lib/db_client");
var serverSocketBroker = require("./lib/server_socket_broker")
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

numUsers = 0;
io.on("connection", function (socket) {
    var clientConnId = socket.conn.id;
    var id = 'myRoom';
    var sBroker = new serverSocketBroker(socket, id);
    socket.join(id);

    redisPub.HMGET("nonce", id, function (err, res) {
        if (res[0] === null) {
            redisPub.HMSET("nonce", id, 0, function(err, res){
                if (res === "OK") {
                    socket.emit("INIT", {nonce:0})
                } else {
                    console.log("Error setting nonce")
                }
            })
        } else {
            socket.emit("INIT", {nonce:res[0]})
        }
    });

    // get all objects for the current room and process them
    dbClient.load(id, function (data, err) {
        if (err) {
            console.log("Got error while retrieving objects from db for %s", id)
        } else {
            sBroker.sendObjectToClient(data)
        }
    })

    numUsers++;
    socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, "Someone joined. Total:" + numUsers)

    socket.on('disconnect', function () {
        numUsers--;
        socket.broadcast.emit(SocketBroker.MSG_FROM_SERVER, "Someone left. Total:" + numUsers);
    });
});
