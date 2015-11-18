var config = require('../config.js');
var LineObject = require("./inf_board/line_object");
var TextObject = require("./inf_board/text_object");
var ImageObject = require("./inf_board/image_object");
var io = require("socket.io-client");
var helper = require('./helper');
var SocketBroker = require("./socket_broker");


function Client(canvas, tempCanvas, readOnlyCanvas) {
    var that = this,
        borderWidth = 10,
        isMouseDown = false,
        drawingData;
    this.isMouseInCanvas = false;
    this.currObj = null;
    this.ctx = canvas.getContext('2d');
    this.tempCtx = tempCanvas.getContext('2d');
    this.readOnlyCtx = readOnlyCanvas.getContext('2d');
    this.tx = 0; // x translation
    this.worldStartX = 0;
    this.worldStartY = 0;
    this.msx = 0; // mouse start x (at the start of a drag)
    this.msy = 0; // mouse start y (at the start of a drag)
    this.mx = 0; // mouse x (always updated)
    this.my = 0; // mousy y (always updated)
    this.ctx.strokeStyle = "";
    this.objectStore = {};
    this.readOnlyObjectStore = {};
    this.objectId = 0;
    this.mode = Client.modes.NONE;
    this.ty = 0; // y translation
    this.canvas = canvas;
    this.tempCanvas = tempCanvas;
    this.readOnlyCanvas = readOnlyCanvas;
    this.tempCtx.font = "20px serif";
    this.ctx.font = "20px serif";
    this.scope = null; // Register the scope of the controller so we can control the view.
    this.socket = io();
    this.selectedObjectsID = [];

    this.addSelected = function (id) {
        this.selectedObjectsID.push(id);
    };

    this.removeSelected = function (id) {
        this.selectedObjectsID.splice(selectedObjects.indexOf(id), 1);
    };

    this.init = function init(options) {
        if (options != undefined && options.hasOwnProperty('objectStore')) {
            that.objectStore = options.objectStore;
        }
        that.sBroker = new SocketBroker(that.socket, that);
        that.sBroker.clientTranslateSelectedCallback = function (data) {
            for (var i = 0; i < data.selected.length; i ++) {
                that.readOnlyObjectStore[data.selected[i]].selected= true;
            }
            that.translateSelected(that.readOnlyObjectStore, data.x, data.y)
        };
        that.sBroker.saveLineObjectFromServerCallback = function (data) {
            var obj = LineObject.newFromData(data);
            that.readOnlyObjectStore[obj.id] = obj;
            that.scope.forceUpdate();
            that.defaultViewForContext(that.readOnlyCtx, that.readOnlyObjectStore, -that.tx, -that.ty)
        };
        that.sBroker.drawImageCallback = function (data) {
            var obj = ImageObject.newFromData(data);
            that.readOnlyObjectStore[obj.id] = obj;
            that.scope.forceUpdate();
            that.defaultViewForContext(that.readOnlyCtx, that.readOnlyObjectStore, -that.tx, -that.ty)
        };
        that.sBroker.init();

        this.objectId = 0;
        this.clearBoard();
    };

    this.changeMode = function changeMode(m) {
        that.mode = m;
        if (m == Client.modes.NONE) {
            that.currObj = null;
        }
    };

    this.clearBoard = function clearBoard() {
        this.tx = 0;
        this.ty = 0;
        this.ctx.restore();
        this.tempCtx.restore();
        this.objectStore = {};
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.save();
        this.tempCtx.save();
        //TODO: What about readonly canvas?
    };

    $(canvas)
        .mouseenter(function () {
            that.isMouseInCanvas = true;
        })
        .mousedown(function (e) {
            var mx = e.pageX - $(this).offset().left - borderWidth,
                my = e.pageY - $(this).offset().top - borderWidth;
            isMouseDown = true;
            that.worldStartX = mx - that.tx;
            that.worldStartY = my - that.ty;
            that.msx = mx;
            that.msy = my;
            that.updatedX = mx; // This is a shared variable to keep track of mouse movement
            that.updatedY = my;
            if (that.mode == Client.modes.DRAW) {
                that.currObj = new LineObject(that.getIdForObject(), that.ctx.strokeStyle, that.ctx.lineWidth);
                that.currObj.addData(that.worldStartX, that.worldStartY);
                drawingData = canvas.toDataURL().replace("image/png", "application/octet-stream")
            }
        })
        .mousemove(function (e) {
            var mx = e.pageX - $(this).offset().left - borderWidth,
                my = e.pageY - $(this).offset().top - borderWidth,
                wx = mx - that.tx,
                wy = my - that.ty,
                sx = that.worldStartX,
                sy = that.worldStartY,
                tx, ty,
                omx, omy; // Old mx, old my
            omx = that.mx;
            omy = that.my;
            that.mx = mx;
            that.my = my;
            if (that.mode == Client.modes.TEXT) {
                that.defaultViewForContext(that.tempCtx, {}, -that.tx, -that.ty);
                that.currObj.x = wx;
                that.currObj.y = wy;
                that.currObj.render(that.tempCtx);
            }
            if (isMouseDown) {
                switch (that.mode) {
                    case Client.modes.DRAW:
                        that.currObj.addData(wx, wy);
                        that.ctx.beginPath();
                        that.ctx.moveTo(sx, sy);
                        that.ctx.lineTo(wx, wy);
                        that.ctx.stroke();
                        that.worldStartX = wx;
                        that.worldStartY = wy;
                        break;
                    case Client.modes.PAN:
                        tx = that.mx - that.msx + that.tx;
                        ty = that.my - that.msy + that.ty;
                        that.defaultView(-tx, -ty);
                        that.sBroker.clientPan(tx, ty);
                        break;
                    case Client.modes.MOVE:
                        that.translateSelected(that.objectStore, mx - omx, my - omy);
                        that.sBroker.clientTranslateSelected({
                            selected: that.selectedObjectsID,
                            x: mx - omx,
                            y: my - omy
                        });
                        break;
                }
            }
        })
        .mouseup(function () {
            isMouseDown = false;
            switch (that.mode) {
                case Client.modes.DRAW:
                    that.currObj.finalize();
                    // TODO: RENAME
                    that.sBroker.clientDrawLineObject(that.currObj);
                    that.objectStore[that.currObj.id] = that.currObj;
                    break;
                case Client.modes.PAN:
                    that.tx += that.mx - that.msx;
                    that.ty += that.my - that.msy;
                    that.defaultView(-that.tx, -that.ty);
                    break;
                case Client.modes.MOVE:
                    // Noop
                    break;
                case Client.modes.TEXT:
                    console.log("Current text", that.currObj.text)
                    if(that.currObj.text != "") {
                        that.currObj.finalize();
                        that.objectStore[that.currObj.id] = that.currObj;
                        that.currObj.render(that.ctx);
                    }
                    that.scope.changeMode(Client.modes.NONE);
                    helper.cleanContext(that.tempCtx);
                    break;
            }
        })
        .mouseleave(function () {
            isMouseDown = false;
            that.isMouseInCanvas = false;
        });
}


// Constants
Client.modes = {
    NONE: 0,
    DRAW: 1,
    PAN: 2,
    CLEAR: 3,
    MOVE: 4,
    TEXT: 5
};

Client.prototype.getIdForObject = function() {
    var currentID = this.objectId;
    this.objectId++;
    return currentID;
};

Client.prototype.addImageObject = function addImageObject(results) {
    if (!this.isMouseInCanvas) return;
    this.currObj = new ImageObject(this.getIdForObject());
    this.currObj.addData(results, this.mx - this.tx, this.my - this.ty);
    this.currObj.finalize();
    this.objectStore[this.currObj.id] = this.currObj;
    this.currObj.render(this.ctx);
    this.sBroker.clientDrawImageObject(this.currObj);
    this.scope.forceUpdate();
};

Client.prototype.update = function update() {
    this.defaultView(-this.tx, -this.ty);
};

Client.prototype.defaultViewForContext = function (ctx, objectStore, x, y) {
    helper.saveContextStyle(ctx);
    ctx.restore(); // Reset our coordinate system
    helper.restoreContextStyle(ctx);
    ctx.save(); // Save the default coordinate system
    helper.cleanContext(ctx); // This will clear rect of the screen in the default coordinate system
    ctx.translate(-parseInt(x), -parseInt(y)); // when we want to render something at x,y, it is rendered at 0,0
    Object.keys(objectStore).forEach(function (key) {
        this[key].render(ctx);
    }, objectStore);
};

// defaultView changes the TL corner to be equivalent to world coordinate (x,y)
Client.prototype.defaultView = function (x, y) {
    this.defaultViewForContext(this.ctx, this.objectStore, x, y)
    this.defaultViewForContext(this.tempCtx, {}, x, y)
    this.defaultViewForContext(this.readOnlyCtx, this.readOnlyObjectStore, x, y)
};

// Update the colour of the stroke
Client.prototype.updateStyle = function updateStyle(style) {
    this.ctx.strokeStyle = style;
    this.tempCtx.strokeStyle = style;
    this.ctx.fillStyle = style;
    this.tempCtx.fillStyle = style;
};

// Update the colour of the stroke
Client.prototype.updateWidth = function updateWidth(size) {
    this.ctx.lineWidth = size;
    this.tempCtx.lineWidth = size;
};

// When you move objects
Client.prototype.translateSelected = function translateSelected(objectStore, x, y) {
    Object.keys(objectStore).forEach(function (key) {
        if (this[key].selected) {
            this[key].translate(x, y);
        }
    }, objectStore);
    this.update();
};

Client.prototype.unselectAll = function unselectAll() {
    Object.keys(this.objectStore).forEach(function (key) {
        this[key].toggleSelected(false)
    }, this.objectStore);
    this.selectedObjectsID = [];
    this.update();
};

Client.prototype.addTextObject = function (t) {
    if (this.currObj == null || this.currObj.constructor != TextObject) {
        this.currObj = new TextObject(this.getIdForObject(), this.worldStartX, this.worldStartY, t);
    }
    this.currObj.text = t;
    // TODO: this is ugly and heavyweight
    // Render the text as we type.
    this.defaultViewForContext(this.tempCtx, {}, -this.tx, -this.ty)
    this.currObj.render(this.tempCtx);
};

module.exports = Client;