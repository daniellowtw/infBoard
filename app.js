var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var SocketBroker = require("./app/js/socket_broker");
var redisPub = require("redis-connection")();
var redisSub = require("redis-connection")("subscriber");
var dbClient = require("./lib/db_client");
var util = require("util")

var port = process.env.PORT || 8080;


//Create a static file server
app.use(express.static(__dirname + '/public'));
http.listen(port);
console.log('Express server started on port %s', port);


numUsers = 0;
io.on("connection", function (socket) {
    var clientConnId = socket.conn.id;
    var id = 'myRoom';
    socket.join(id);
    function marshallBroadcast(a, b) {
        socket.on(a, function (d) {
            //console.log(a, d);
            socket.broadcast.to(id).json.emit(b, d)
        });
    }

    function marshallObjectBroadcast(evtIn, evtOut) {
        socket.on(evtIn, function (data) {
            // data : {nonce:int, data:any}
            var nonce = data.nonce;
            delete data.nonce;
            redisPub.INCR("counter:objects:" + id, function (err, res) {
                //TODO: Handle error
                redisPub.SADD(util.format("objects:%s", id), res);
                data.id = res;
                redisPub.HMSET("object", util.format("%s:%s", id, res), JSON.stringify(data), function (err, res) {
                });
                // Tell other people once we have the id
                socket.emit("SYNACK", {nonce: nonce, res: "OK"});
                socket.broadcast.to(id).json.emit(evtOut, data); // Tell other clients
            });
        })
    }

    function marshallTranslateObjectBroadcast(evtIn, evtOut) {
        socket.on(evtIn, function (data) {
            redisPub.INCR("counter:objects:" + id, function (err, res) {
                //TODO: Handle error
                redisPub.SADD("objects:" + id, res);
                redisPub.HMSET("object", id + ":" + res, JSON.stringify(d), function (err, res) {
                })
            });
            //console.log(a, d);
            socket.broadcast.to(id).json.emit(evtOut, data)
        })
    }

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
    socket.on(SocketBroker.MSG_FROM_CLIENT, function (d) {
        socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, d);
    });
    numUsers++;
    socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, "Someone joined.")
    marshallObjectBroadcast(SocketBroker.DRAW_TEXT_FROM_CLIENT, SocketBroker.DRAW_TEXT_FROM_SERVER);
    marshallObjectBroadcast(SocketBroker.LINE_OBJECT_FROM_CLIENT, SocketBroker.LINE_OBJECT_FROM_SERVER);
    marshallObjectBroadcast(SocketBroker.DRAW_IMAGE_FROM_CLIENT, SocketBroker.DRAW_IMAGE_FROM_SERVER);
    marshallBroadcast(SocketBroker.TRANSLATE_SELECTED_CLIENT, SocketBroker.TRANSLATE_SELECTED_SERVER);
    marshallBroadcast(SocketBroker.CLIENT_PAN, SocketBroker.CLIENT_PAN); // TODO: Don't store such commands in db.
    socket.on('disconnect', function () {
        numUsers--;
        socket.broadcast.emit(SocketBroker.MSG_FROM_SERVER, "Someone left.");
    });
});
