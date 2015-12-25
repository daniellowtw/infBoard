var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var SocketBroker = require("./app/js/socket_broker");
var redisPub = require("redis-connection")();
var redisSub = require("redis-connection")("subscriber");
var dbClient = require("./lib/db_client");
var serverSocketBroker = require("./lib/server_socket_broker")
var port = process.env.PORT || 8080;

//Create a static file server
app.use(express.static(__dirname + '/public'));
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
            console.log("Nonce is now", res[0])
            socket.emit("INIT", {nonce:res[0]})
        }
    });


    dbClient.load(id, function (data, err) {
    })

    numUsers++;
    socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, "Someone joined. Total:" + numUsers)

    socket.on('disconnect', function () {
        numUsers--;
        socket.broadcast.emit(SocketBroker.MSG_FROM_SERVER, "Someone left. Total:" + numUsers);
    });
});
