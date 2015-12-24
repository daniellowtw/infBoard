var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var SocketBroker = require("./app/js/socket_broker");
var redisPub = require("redis-connection")();
var redisSub = require("redis-connection")("subscriber");
var loader = require("./lib/object_loader");

var port = process.env.PORT || 8080;


//Create a static file server
app.use(express.static(__dirname + '/public'));
http.listen(port);
console.log('Express server started on port %s', port);

numUsers = 0;
io.on("connection", function (socket) {
  var id = 'myRoom';
  socket.join(id);
  function marshallBroadcast(a, b) {
    socket.on(a, function (d) {
      redisPub.INCR("counter:objects:" + id, function(err, res){
        //TODO: Handle error
        redisPub.SADD("objects:" + id, res);
        redisPub.HMSET("object", id + ":" + res, JSON.stringify(d), function(err, res){
            console.log("Result of hm set", err, res)
        })
        console.log("Storing", "object:" + id + ":" + res, JSON.stringify(d));
      });
      //console.log(a, d);
      socket.broadcast.to(id).json.emit(b, d)
    });
  }
    console.log(loader.load(id, function(data, err){
        console.log("Loader returned with ", data, err)
    }))
  socket.on(SocketBroker.MSG_FROM_CLIENT, function(d){
    socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, d);
  });
  socket.emit(SocketBroker.MSG_FROM_SERVER, "Connected");
  numUsers++;
  socket.broadcast.to(id).emit(SocketBroker.MSG_FROM_SERVER, "Someone joined.")
  marshallBroadcast(SocketBroker.DRAW_TEXT_FROM_CLIENT, SocketBroker.DRAW_TEXT_FROM_SERVER);
  marshallBroadcast(SocketBroker.TRANSLATE_SELECTED_CLIENT, SocketBroker.TRANSLATE_SELECTED_SERVER);
  marshallBroadcast(SocketBroker.LINE_OBJECT_FROM_CLIENT, SocketBroker.LINE_OBJECT_FROM_SERVER);
  marshallBroadcast(SocketBroker.DRAW_IMAGE_FROM_CLIENT, SocketBroker.DRAW_IMAGE_FROM_SERVER);
  marshallBroadcast(SocketBroker.CLIENT_PAN, SocketBroker.CLIENT_PAN); // TODO: Don't store such commands in db.
  socket.on('disconnect', function () {
    numUsers--;
    socket.broadcast.emit(SocketBroker.MSG_FROM_SERVER, "Someone left.");
  });
});
