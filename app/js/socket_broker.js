var LineObject = require('./inf_board/line_object');

/*
 Wrapper for socket stuff. Handles client id, etc
 */
function SocketBroker(socket, client) {
    var that = this,
        noop = function noop() {
        };

    this.id = null;
    // These will be set by client where necessary
    this.drawTextCallback = noop;
    //this.drawLineCallback = noop;
    this.drawImageCallback = noop;
    this.saveLineObjectFromServerCallback = noop;
    this.clientPanCallback = function (arr) {
        // tx and ty given are the latest ones. So just update it
        client.tx = arr[0];
        client.ty = arr[1];
        client.defaultView(-arr[0], -arr[1]);
    };
    this.clientTranslateSelectedCallback = noop;

    this.init = function () {
        // Receiving from server
        socket.on(SocketBroker.DRAW_TEXT_FROM_SERVER, that.drawTextCallback);
        //socket.on(SocketBroker.DRAW_LINE_FROM_SERVER, that.drawLineCallback);
        socket.on(SocketBroker.DRAW_IMAGE_FROM_SERVER, that.drawImageCallback);
        socket.on(SocketBroker.LINE_OBJECT_FROM_SERVER, that.saveLineObjectFromServerCallback);
        socket.on(SocketBroker.CLIENT_PAN, that.clientPanCallback);
        socket.on(SocketBroker.TRANSLATE_SELECTED_SERVER, that.clientTranslateSelectedCallback);
        socket.on(SocketBroker.MSG_FROM_SERVER, function (data) {
            console.log("MESSAGE FROM SERVER", data);
        });

        socket.json.emit(SocketBroker.MSG_FROM_CLIENT, "HI! I AM CONNECTED" + socket.id);
        socket.on(SocketBroker.MSG_FROM_CLIENT, console.log);

        // Emitting to server, call these when you have created a local object and want others to know
        this.clientDrawTextObject = function clientDrawText(data) {
            socket.json.emit(SocketBroker.DRAW_TEXT_FROM_CLIENT, data);
        };
        this.clientDrawImageObject = function clientDrawImage(data) {
            socket.json.emit(SocketBroker.DRAW_IMAGE_FROM_CLIENT, data);
        };
        //this.clientDrawLine = function clientDrawLine(data) {
        //    socket.json.emit(SocketBroker.DRAW_LINE_FROM_CLIENT, data);
        //};
        this.clientDrawLineObject = function clientDrawLineObject(lineObj) {
            socket.json.emit(SocketBroker.LINE_OBJECT_FROM_CLIENT, lineObj);
        };
        this.clientPan = function clientPan(x, y) {
            socket.json.emit(SocketBroker.CLIENT_PAN, [x, y]);
        };
        this.clientTranslateSelected = function (data) {
            console.log("client trying to send this", data)
            socket.json.emit(SocketBroker.TRANSLATE_SELECTED_CLIENT, data);
        };
        console.log("broker initialised")
    }
}

SocketBroker.DRAW_TEXT_FROM_SERVER = "DRAW_TEXT_FROM_SERVER";
SocketBroker.DRAW_TEXT_FROM_CLIENT = "DRAW_TEXT_FROM_CLIENT";
//SocketBroker.DRAW_LINE_FROM_SERVER = "DRAW_LINE_FROM_SERVER";
//SocketBroker.DRAW_LINE_FROM_CLIENT = "DRAW_LINE_FROM_CLIENT";
SocketBroker.LINE_OBJECT_FROM_SERVER = "LINE_OBJECT_FROM_SERVER";
SocketBroker.LINE_OBJECT_FROM_CLIENT = "LINE_OBJECT_FROM_CLIENT";
SocketBroker.DRAW_IMAGE_FROM_SERVER = "DRAW_IMAGE_FROM_SERVER";
SocketBroker.DRAW_IMAGE_FROM_CLIENT = "DRAW_IMAGE_FROM_CLIENT";
SocketBroker.CLIENT_PAN = "CLIENT_PAN";
SocketBroker.TRANSLATE_SELECTED_CLIENT = "TRANSLATE_SELECTED_CLIENT";
SocketBroker.TRANSLATE_SELECTED_SERVER = "TRANSLATE_SELECTED_SERVER";
SocketBroker.MSG_FROM_SERVER = "MSG_FROM_SERVER";
SocketBroker.MSG_FROM_CLIENT = "MSG_FROM_CLIENT";

module.exports = SocketBroker;