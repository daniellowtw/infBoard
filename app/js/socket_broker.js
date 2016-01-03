var LineObject = require('./inf_board/line_object');

/*
 Wrapper for socket stuff. Handles client id, etc
 */
function SocketBroker(socket, roomId) {
    var that = this,
        noop = function noop() {
        },
        logger = function (data) {
            console.log("Socketbroker:", data)
        };
    this.nonce = 0; // messageId between server and client
    this.id = roomId;
    // These will be set by client where necessary
    this.drawTextCallback = noop;
    this.drawImageCallback = noop;
    this.saveLineObjectFromServerCallback = noop;
    this.clientPanCallback = noop;
    this.clientTranslateSelectedCallback = noop;
    this.clientDeleteObjectCallback = noop;
    this.callBackQueue = {}; // {id:function(res:[nil/obj])}

    this.init = function () {
        // Receiving from server
        socket.on("SYNACK", function (data) {
            // data is of the form {nonce:int, res:[nil/object], err:[error/nil]}
            that.callBackQueue[data.nonce](data.res, data.err)
        });
        socket.on("INIT", function(data) {
            that.nonce = data.nonce;
            that.callBackQueue[that.nonce] = logger;
            console.log("broker initialised")
        });
        socket.on(SocketBroker.DRAW_TEXT_FROM_SERVER, that.drawTextCallback);
        socket.on(SocketBroker.DRAW_IMAGE_FROM_SERVER, that.drawImageCallback);
        socket.on(SocketBroker.LINE_OBJECT_FROM_SERVER, that.saveLineObjectFromServerCallback);
        socket.on(SocketBroker.CLIENT_PAN, that.clientPanCallback);
        socket.on(SocketBroker.TRANSLATE_SELECTED_SERVER, that.clientTranslateSelectedCallback);
        socket.on(SocketBroker.DELETE_SELECTED_SERVER, that.clientDeleteObjectCallback);
        socket.on(SocketBroker.MSG_FROM_SERVER, function (data) {
            console.log("MESSAGE FROM SERVER", data);
        });

        socket.on(SocketBroker.MSG_FROM_CLIENT, console.log);

        // Emitting to server, call these when you have created a local object and want others to know
        this.clientDrawTextObject = function clientDrawText(data, callback) {
            data.nonce = that.nonce++;
            that.callBackQueue[data.nonce] = callback;
            socket.json.emit(SocketBroker.DRAW_TEXT_FROM_CLIENT, data);
        };
        this.clientDrawImageObject = function clientDrawImage(data, callback) {
            data.nonce = that.nonce++;
            that.callBackQueue[data.nonce]= (callback || noop);
            socket.json.emit(SocketBroker.DRAW_IMAGE_FROM_CLIENT, data);
        };

        // Tries to draw the line object. Calls callback if server says ok.
        this.clientDrawLineObject = function clientDrawLineObject(lineObj, callback) {
            lineObj.nonce = that.nonce++;
            // Update our id with that from the server.
            that.callBackQueue[lineObj.nonce] = callback;
            socket.json.emit(SocketBroker.LINE_OBJECT_FROM_CLIENT, lineObj);
        };
        this.clientPan = function clientPan(x, y) {
            socket.json.emit(SocketBroker.CLIENT_PAN, [x, y]);
        };
        this.clientTranslateSelected = function (data) {
            socket.json.emit(SocketBroker.TRANSLATE_SELECTED_CLIENT, data);
        };
        this.clientSaveMovedObject = function (data) {
            socket.json.emit(SocketBroker.SAVE_MOVED_OBJECT, data)
        };

        // TODO(Bulk delete like bulk translate?)
        this.clientDeleteObject = function (objectIdToDelete, callback) {
            var nonce = that.nonce++;
            var message = {
                nonce: nonce,
                objId: objectIdToDelete
            };
            that.callBackQueue[nonce] = callback;
            socket.json.emit(SocketBroker.DELETE_SELECTED_CLIENT, message)
        };

        socket.json.emit("INIT", {roomId: roomId});
    }
}

SocketBroker.DRAW_TEXT_FROM_SERVER = "DRAW_TEXT_FROM_SERVER";
SocketBroker.DRAW_TEXT_FROM_CLIENT = "DRAW_TEXT_FROM_CLIENT";
SocketBroker.LINE_OBJECT_FROM_SERVER = "LINE_OBJECT_FROM_SERVER";
SocketBroker.LINE_OBJECT_FROM_CLIENT = "LINE_OBJECT_FROM_CLIENT";
SocketBroker.DRAW_IMAGE_FROM_SERVER = "DRAW_IMAGE_FROM_SERVER";
SocketBroker.DRAW_IMAGE_FROM_CLIENT = "DRAW_IMAGE_FROM_CLIENT";
SocketBroker.CLIENT_PAN = "CLIENT_PAN";
SocketBroker.TRANSLATE_SELECTED_CLIENT = "TRANSLATE_SELECTED_CLIENT";
SocketBroker.TRANSLATE_SELECTED_SERVER = "TRANSLATE_SELECTED_SERVER";
SocketBroker.DELETE_SELECTED_CLIENT = "DELETE_SELECTED_CLIENT";
SocketBroker.DELETE_SELECTED_SERVER = "DELETE_SELECTED_SERVER";
SocketBroker.MSG_FROM_SERVER = "MSG_FROM_SERVER";
SocketBroker.MSG_FROM_CLIENT = "MSG_FROM_CLIENT";
SocketBroker.SAVE_MOVED_OBJECT = "SAVE_MOVED_OBJECT";

module.exports = SocketBroker;