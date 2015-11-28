var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var SocketBroker = require("./app/js/socket_broker");

var port = 8080;

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
      //console.log(a, d);
      socket.broadcast.to(id).json.emit(b, d)
    });
  }
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
  marshallBroadcast(SocketBroker.CLIENT_PAN, SocketBroker.CLIENT_PAN);
  socket.on('disconnect', function () {
    numUsers--;
    socket.broadcast.emit(SocketBroker.MSG_FROM_SERVER, "Someone left.");
  });
});